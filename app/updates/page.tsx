import Image from 'next/image';

export const metadata = { title: 'Product updates' };

export default function Page() {
  return <main className="auth-page"><article className="card account-update">
    <p className="eyebrow">ADS MASTER / UPDATES</p>
    <h1>Real reporting for 1BB</h1>
    <p>Choose 1BB in Business to see connected ChatGPT Ads, Stripe payments, and website traffic. Overview and Connections show these supported sources, without sample research or conflicting connection labels. Existing CSV imports remain separate and labeled. Missing or delayed reports stay visible as missing or delayed.</p>
    <h2>Your totals, graphs, and next step</h2>
    <p>Overview now shows DreyOS totals directly in Ads Master, with daily graphs and a suggested next step. Use Business to switch between Drey Thomas and 1BB. Reports refresh hourly in the background, even when the app is closed.</p>
    <p>Personal reporting includes ChatGPT Ads, Meta, Google / YouTube, and Stripe. 1BB includes ChatGPT Ads, Stripe, and website traffic. Each card shows its own reporting dates and last successful update; a failed refresh keeps the previous report visible with a warning.</p>
    <p>Payments are before fees and costs. They are not attributed ad revenue or available profit. Connection renewal may still be required if a platform expires or revokes access. Campaigns and budgets require your separate approval.</p>
    <Image src="/updates/automatic-overview-example.png" alt="Illustrative example of the new next-step card, daily graphs, and delayed-report warnings. These are fictional figures, not private account results." width={1440} height={1200} style={{width:'100%',height:'auto',borderRadius:16}} />
    <p className="small muted">Interface example with fictional figures. Your actual totals are visible only after owner sign-in.</p>
    <h2>DreyOS reporting, within reach</h2>
    <p>Open DreyOS Growth from the sidebar. Select 1BB there to view connected ChatGPT Ads, Stripe payments, and website analytics. The 1BB workspace also includes a direct shortcut. DreyOS reports remain separate from the sample and CSV figures shown in Ads Master.</p>
    <Image src="/updates/dreyos-reporting.png" alt="The 1BB workspace with its DreyOS Growth sidebar link and connected-report shortcut." width={1280} height={983} style={{ width: '100%', height: 'auto', borderRadius: 16 }} />
    <h2>Your Glass Workspace</h2>
    <p>Midnight-blue glass, clearer navigation, and silver controls give your reports more room. Choose Account reports in your personal workspace to open connected reporting, or Connections to review platform setup.</p>
    <Image src="/updates/glass-workspace.png" alt="Ads Master Glass Workspace with the dedicated Account reports navigation and silver controls." width={1280} height={720} style={{ width: '100%', height: 'auto', borderRadius: 16 }} />
    <h2>Meta and Google join your reports</h2>
    <p>Your personal workspace now pulls ChatGPT Ads, Meta Ads, and Google / YouTube Ads spend, impressions, and clicks for the last 30 completed days. Select a platform to load its report. It refreshes every five minutes while open, and when you return after five minutes.</p>
    <Image src="/updates/multi-platform-reports.png" alt="The live Ads Master report controls for ChatGPT Ads, Meta Ads and Google / YouTube Ads." width={1128} height={449} style={{ width: '100%', height: 'auto', borderRadius: 16 }} />
    <p>Choose <strong>Sign in to connect reports</strong> in your personal workspace, then continue with your approved Google account. If setup needs attention, follow the message beside your reports. TikTok and LinkedIn still need account setup. Google access tokens renew automatically; Meta may require reconnection when its token expires.</p>
    <p>The earlier account-detail view reports ad delivery. See Overview for the new payment totals and graphs; verified conversion attribution remains separate.</p>
    <a className="metal-button primary" href="/drey">Open personal workspace</a>
  </article></main>;
}
