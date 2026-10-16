import { authorizedSync, boundedBody } from '@/lib/sync-security';
import { fromAccount, fromDreyOS } from '@/lib/report-sync';
import { fetchMetaReport } from '@/lib/meta-ads';
import { fetchGoogleReport } from '@/lib/google-ads';
import { safeError, validateUpdates, type ReportUpdate } from '@/lib/dashboard-report';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const headers = { 'Cache-Control': 'private, no-store' };
export async function POST(request: Request) {
  const secret = process.env.REPORT_SYNC_SECRET;
  if (!authorizedSync(request.headers.get('authorization'),secret)) return Response.json({ error:'UNAUTHORIZED' },{status:401,headers});
  const site = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
  if (!site || !/^https:\/\/[a-z0-9-]+\.convex\.site$/.test(site)) return Response.json({error:'NOT_CONFIGURED'},{status:503,headers});
  let updates: ReportUpdate[];
  try { updates = fromDreyOS(await boundedBody(request)); } catch { return Response.json({error:'INVALID_REPORT'},{status:400,headers}); }
  const extra = await Promise.all(([['meta',fetchMetaReport],['google',fetchGoogleReport]] as const).map(async ([provider,read]): Promise<ReportUpdate> => {
    try { return { businessId:'drey-personal',provider,error:null,data:fromAccount(await read()) }; }
    catch (error) { return { businessId:'drey-personal',provider,error:safeError(error instanceof Error ? error.message : undefined) }; }
  }));
  updates.push(...extra);
  try {
    const response = await fetch(site+'/reporting/ingest',{method:'POST',redirect:'error',headers:{Authorization:'Bearer '+secret,'content-type':'application/json'},body:JSON.stringify(validateUpdates(updates)),signal:AbortSignal.timeout(10000)});
    if (!response.ok) throw Error('SAVE_FAILED');
    return Response.json({ saved:updates.length, failed:updates.filter(s=>s.error).map(s=>({businessId:s.businessId,provider:s.provider,error:s.error})) },{headers});
  } catch { return Response.json({error:'SAVE_FAILED'},{status:502,headers}); }
}
