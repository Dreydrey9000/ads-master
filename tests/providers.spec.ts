import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as reports from '../lib/account-report';
const nativeRequire = require;
function adapter(provider: string, env: Record<string, string>, fetcher: typeof fetch) {
  const exports: Record<string, () => Promise<reports.AccountReport>> = {};
  const source = ts.transpileModule(fs.readFileSync(`lib/${provider}-ads.ts`, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(source, { exports, require: (name: string) => name === 'server-only' ? {} : name === './account-report' ? reports : nativeRequire(name), process: { env }, fetch: fetcher, AbortSignal, URLSearchParams, Set, Date });
  return exports;
}
const metaEnv = { META_ADS_ACCESS_TOKEN: 'test-token', META_ADS_ACCOUNT_ID: 'act_123' };
test('Meta follows cursors on the fixed host and computes daily totals', async () => {
  const calls: string[] = [];
  const { since } = reports.reportWindow();
  const fetcher = (async (url: string) => {
    calls.push(url);
    const result = calls.length === 1 ? { id: 'act_123', name: 'Test', currency: 'USD', timezone_name: 'America/New_York' } : calls.length === 2 ? { data: [{date_start: since, spend: '1.25', impressions: '10', clicks: '2'}], paging: { next: 'https://untrusted.example/secret', cursors: { after: 'cursor' } } } : {data: []};
    return Response.json(result);
  }) as typeof fetch;
  const report = await adapter('meta', metaEnv, fetcher).fetchMetaReport();
  expect(report.totals).toEqual({spend:1.25,impressions:10,clicks:2});
  expect(calls).toHaveLength(3);
  expect(calls.every(url => url.startsWith('https://graph.facebook.com/v26.0/act_123'))).toBe(true);
  expect(calls[2]).toContain('after=cursor');
});
test('Meta rejects wrong accounts, provider failures and repeated cursors', async () => {
  for (const mode of ['wrong-account', 'expired', 'cursor-loop']) {
    let count = 0;
    const fetcher = (async () => {
      count++;
      if (mode === 'expired') return Response.json({}, {status:401});
      if (count === 1) return Response.json({id: mode === 'wrong-account' ? 'act_other' : 'act_123', currency:'USD',timezone_name:'America/New_York'});
      return Response.json({data:[],paging:{next:'next',cursors:{after:'same'}}});
    }) as typeof fetch;
    await expect(adapter('meta',metaEnv,fetcher).fetchMetaReport()).rejects.toThrow(mode === 'wrong-account' ? 'ACCOUNT_MISMATCH' : mode === 'expired' ? 'RECONNECT' : 'INVALID_REPORT');
  }
});

test('Google renews OAuth, reads only search endpoints and converts microdollars', async () => {
  const { generateKeyPairSync } = nativeRequire('node:crypto');
  const { privateKey } = generateKeyPairSync('rsa', {modulusLength:2048});
  const env = { GOOGLE_ADS_CUSTOMER_ID: '1234567890', GOOGLE_ADS_SERVICE_ACCOUNT_JSON: JSON.stringify({client_email:'test@example.test',private_key:privateKey.export({type:'pkcs8',format:'pem'})}) };
  const calls: {url:string;body:string}[] = [];
  const { since } = reports.reportWindow();
  const fetcher = (async (url: string, init: RequestInit) => {
    calls.push({url,body:String(init.body)});
    return Response.json(calls.length === 1 ? {access_token:'test'} : calls.length === 2 ? {results:[{customer:{id:'1234567890',descriptiveName:'Test',currencyCode:'USD',timeZone:'America/New_York'}}]} : {results:[{segments:{date:since},metrics:{costMicros:'1250000',impressions:'10',clicks:'2'}}]});
  }) as typeof fetch;
  const report = await adapter('google',env,fetcher).fetchGoogleReport();
  expect(report.totals).toEqual({spend:1.25,impressions:10,clicks:2});
  expect(calls[0].url).toBe('https://oauth2.googleapis.com/token');
  expect(calls.slice(1).every(c => c.url.endsWith('/googleAds:search'))).toBe(true);
  expect(calls.slice(1).every(c => JSON.parse(c.body).query.startsWith('SELECT '))).toBe(true);
});
