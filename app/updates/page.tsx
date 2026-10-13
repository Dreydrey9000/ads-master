import Image from 'next/image';

export const metadata = { title: 'Product updates' };

export default function Page() {
  return <main className="auth-page"><article className="card account-update">
    <p className="eyebrow">ADS MASTER / UPDATES</p>
    <h1>Automatic account reports</h1>
    <p>Your personal workspace can pull ChatGPT Ads spend, impressions, and clicks for the last 30 completed days. It refreshes every five minutes while open, and when you return after five minutes.</p>
    <Image src="/updates/account-reports.png" alt="The Ads Master glass sign-in dialog with its Continue with Google button." width={1280} height={720} style={{ width: '100%', height: 'auto', borderRadius: 16 }} />
    <p>Choose <strong>Sign in to connect reports</strong> in your personal workspace, then continue with your approved Google account. If setup needs attention, follow the message beside your reports. Other platforms still use CSV imports.</p>
    <p>Revenue and conversions are not included yet. No campaigns or budgets are changed.</p>
    <a className="metal-button primary" href="/drey">Open personal workspace</a>
  </article></main>;
}
