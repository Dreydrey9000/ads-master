import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as reports from '../lib/dashboard-report';

function fixtureMarkup() {
  const exports: Record<string, React.ComponentType<{ sources: reports.DashboardSource[]; now: number }>> = {};
  const source = ts.transpileModule(fs.readFileSync('components/LiveOverview.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  vm.runInNewContext(source,{exports,require:(name:string)=>name.endsWith('.css') || name === './AccountSignIn' ? {} : name === '@/lib/dashboard-report' ? reports : name === './ui' ? {money:(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n)} : require(name),Date,Intl,Math,Array});
  const now=Date.parse('2026-10-16T12:00:00Z');
  const sources:reports.DashboardSource[]=[
    {businessId:'1bb',provider:'openai',attemptedAt:new Date(now).toISOString(),error:null,data:{since:'2026-10-09',until:'2026-10-15',timezone:'America/New_York',checkedAt:new Date(now).toISOString(),metric:'spend',currency:'USD',rows:[{date:'2026-10-09',value:20,clicks:30,impressions:1000},{date:'2026-10-12',value:35,clicks:70,impressions:2000}]}},
    {businessId:'1bb',provider:'stripe',attemptedAt:new Date(now).toISOString(),error:'PROVIDER_ERROR',data:{since:'2026-09-16',until:'2026-10-15',timezone:'UTC',checkedAt:new Date(now-4*3600000).toISOString(),metric:'captured',currency:'USD',rows:[{date:'2026-10-12',value:120.93,refunded:10.25}]}},
    {businessId:'1bb',provider:'posthog',attemptedAt:new Date(now).toISOString(),error:'NOT_CONFIGURED'},
  ];
  return renderToStaticMarkup(React.createElement(exports.ReportOverview,{sources,now}));
}

for(const width of [390,1440]) test(`overview graphs, missing data, delayed results and keyboard access at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:1000});
  const css=fs.readFileSync('app/globals.css','utf8')+fs.readFileSync('components/live-overview.css','utf8');
  await page.setContent(`<html lang="en"><head><title>Reporting UI fixture</title><style>${css}</style></head><body><main style="padding:24px;max-width:1200px;margin:auto"><header class="page-heading"><div><h1>Illustrative reporting example</h1><p>Fictional figures for interface testing.</p></div></header><div class="overview-stack">${fixtureMarkup()}</div></main></body></html>`);
  await expect(page.getByRole('heading',{name:'Check Stripe payments'})).toBeVisible();
  await expect(page.getByText('The latest refresh failed. Showing the last successful report.')).toBeVisible();
  await expect(page.getByText('Waiting for the first successful background report.')).toBeVisible();
  await expect(page.locator('.report-total').nth(1)).toHaveText('$120.93');
  expect(await page.locator('svg[role="img"]').count()).toBe(2);
  expect(await page.locator('.graph-missing').count()).toBe(34);
  await page.locator('summary').first().focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('cell',{name:'$35.00',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const scan=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(scan.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))).toEqual([]);
  await page.locator('summary').first().press('Enter');
  if(width===1440) await page.screenshot({path:'public/updates/automatic-overview-example.png',fullPage:true});
  await page.evaluate(()=>{document.documentElement.style.fontSize='200%';});
  const overflow=await page.evaluate(()=>Array.from(document.querySelectorAll('main *')).filter(el=>el.getBoundingClientRect().right>innerWidth+1).map(el=>({tag:el.tagName,className:el.className,text:el.textContent?.slice(0,70)})));
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),JSON.stringify(overflow)).toBe(true);
});
