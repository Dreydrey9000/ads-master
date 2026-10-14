import Image from 'next/image';

export const metadata = { title: 'Product updates' };

export default function Page() {
  return <main className="auth-page"><article className="card account-update">
    <p className="eyebrow">ADS MASTER / UPDATES</p>
    <h1>Meta and Google join your reports</h1>
    <p>Your personal workspace now pulls ChatGPT Ads, Meta Ads, and Google / YouTube Ads spend, impressions, and clicks for the last 30 completed days. Select a platform to load its report. It refreshes every five minutes while open, and when you return after five minutes.</p>
    <Image src="/updates/multi-platform-reports.png" alt="The live Ads Master report controls for ChatGPT Ads, Meta Ads and Google / YouTube Ads." width={1128} height={449} style={{ width: '100%', height: 'auto', borderRadius: 16 }} />
    <p>Choose <strong>Sign in to connect reports</strong> in your personal workspace, then continue with your approved Google account. If setup needs attention, follow the message beside your reports. TikTok and LinkedIn still need account setup. Google access tokens renew automatically; Meta may require reconnection when its token expires.</p>
    <p>Revenue and conversions are not included yet. No campaigns or budgets are changed.</p>
    <a className="metal-button primary" href="/drey">Open personal workspace</a>
  </article></main>;
}
