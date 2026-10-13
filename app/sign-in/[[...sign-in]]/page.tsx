import { GoogleSignIn } from '@/components/AccountSignIn';
export const metadata = { title: 'Sign in' };
export default function Page() { return <main className="auth-page"><a className="brand" href="/drey">Ads Master / BY DREY</a><section className="card account-update"><h1>Sign in to Ads Master</h1>{process.env.NEXT_PUBLIC_CONVEX_URL ? <GoogleSignIn /> : <p>Sign-in needs setup. Return to your workspace to import a report.</p>}</section></main>; }
