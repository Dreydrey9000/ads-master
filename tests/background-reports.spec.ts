import { test, expect } from '@playwright/test';
import { validateUpdates, validateReport, retainedSnapshot, nextStep, type DashboardSource } from '../lib/dashboard-report';
import { authorizedSync, boundedBody } from '../lib/sync-security';
import { fromDreyOS } from '../lib/report-sync';

const now = Date.now();
const day = new Date(now - 86400000).toISOString().slice(0,10);
const data = {since:day,until:day,timezone:'America/New_York',checkedAt:new Date(now).toISOString(),metric:'spend',currency:'USD',rows:[{date:day,value:4.25,clicks:2,impressions:100}]};
const update = {businessId:'1bb',provider:'openai',error:null,data};
test('sync authentication fails closed and request bodies are bounded', async () => {
  const secret = 'test-only-secret'.repeat(4);
  expect(authorizedSync(null,secret)).toBe(false);
  expect(authorizedSync('Bearer '+secret,undefined)).toBe(false);
  expect(authorizedSync('Bearer '+secret.slice(1)+'x',secret)).toBe(false);
  expect(authorizedSync('Bearer '+secret,secret)).toBe(true);
  await expect(boundedBody(new Request('https://test.invalid',{method:'POST',headers:{'content-type':'application/json'},body:'x'.repeat(101)}),100)).rejects.toThrow();
  await expect(boundedBody(new Request('https://test.invalid',{method:'POST',body:'{}'}))).rejects.toThrow();
});
test('only valid business-provider combinations and bounded daily aggregates are retained', () => {
  const result = validateUpdates([{...update,secret:'discard',data:{...data,customers:['discard']}}]);
  expect(result[0].data?.rows[0].value).toBe(4.25);
  expect(JSON.stringify(result)).not.toContain('discard');
  for (const bad of [{...update,businessId:'someone-else'},{...update,provider:'meta'},update]) {
    expect(() => validateUpdates(bad === update ? [update,update] : [bad])).toThrow();
  }
  for (const rows of [[...data.rows,...data.rows],[{...data.rows[0],value:-1}],[{...data.rows[0],value:NaN}],[{...data.rows[0],clicks:1.5}],[{...data.rows[0],date:'2000-01-01'}]]) expect(() => validateReport({...data,rows},'openai')).toThrow();
});
test('failed refresh retains last good data and delayed successes cannot overwrite newer data', () => {
  const previous = validateReport(data,'openai');
  const failed = retainedSnapshot(previous,{businessId:'1bb',provider:'openai',error:'RECONNECT'},new Date(now+1000).toISOString());
  expect(failed?.data).toEqual(previous);
  expect(failed?.error).toBe('RECONNECT');
  const old = {...previous,checkedAt:new Date(now-3600000).toISOString()};
  expect(retainedSnapshot(previous,{businessId:'1bb',provider:'openai',error:null,data:old},new Date(now).toISOString())).toBeNull();
  expect(nextStep([failed as DashboardSource],now).title).toBe('Check ChatGPT Ads');
  expect(nextStep([{...failed!,error:null,data:{...previous,checkedAt:new Date(now-4*3600000).toISOString()}}],now).title).toBe('Check ChatGPT Ads');
  expect(nextStep([{...failed!,error:null}],now).title).toBe('Check what happened after the click');
});
test('DreyOS account isolation and provider failures do not poison other business reports', () => {
  const groups = ['drey-personal','1bb'].map(businessId => ({businessId,failures:{stripe:'PROVIDER_ERROR',posthog:'NOT_CONFIGURED'},sources:{reporting:{ads:{configured:true,data:{from:day,through:day,timezone:data.timezone,checkedAt:data.checkedAt,currency:'USD',accountId:'adacct_6abfbca6370081a2bbd57187fe0e2c25',rows:[{date:day,spend:4.25,clicks:2,impressions:100}]}}}}}));
  const result = fromDreyOS(groups);
  expect(result.find(r=>r.businessId==='drey-personal'&&r.provider==='openai')?.error).toBe('ACCOUNT_MISMATCH');
  expect(result.find(r=>r.businessId==='1bb'&&r.provider==='openai')?.data?.rows[0].value).toBe(4.25);
  expect(result.find(r=>r.provider==='stripe')?.error).toBe('PROVIDER_ERROR');
  expect(()=>fromDreyOS([groups[0],groups[0]])).toThrow();
});
test('background ingress refuses anonymous and wrong-key requests', async ({request}) => {
  for (const headers of [{},{authorization:'Bearer wrong-key'}] as Record<string,string>[]) {
    const response = await request.post('/api/reports/sync',{headers,data:[]});
    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({error:'UNAUTHORIZED'});
  }
});
