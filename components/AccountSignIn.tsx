'use client';
import { useAuthActions } from '@convex-dev/auth/react';
import { useState } from 'react';
import GlassDialog from './GlassDialog';

export function GoogleSignIn() {
  const { signIn } = useAuthActions();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function connect() {
    setPending(true); setError('');
    try { await signIn('google', { redirectTo: '/drey' }); }
    catch { setError('Google sign-in could not start. Try again, or check the account setup.'); setPending(false); }
  }
  return <div className="account-update"><p className="muted">Use your approved Google account to open your private reports.</p><button className="metal-button primary" disabled={pending} onClick={connect}>{pending ? <><span className="thinking-orb" /> Opening Google…</> : 'Continue with Google'}</button>{error && <p className="error-message" role="alert">{error}</p>}</div>;
}
export default function AccountSignIn() {
  const [open, setOpen] = useState(false);
  return <><button className="metal-button primary" onClick={() => setOpen(true)}>Sign in to connect reports</button>{open && <GlassDialog title="Sign in to Ads Master" onClose={() => setOpen(false)}><GoogleSignIn /></GlassDialog>}</>;
}
export function AccountSignOut() {
  const { signOut } = useAuthActions();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  return <div><button className="metal-button" disabled={pending} onClick={async () => { setPending(true); setError(false); try { await signOut(); } catch { setError(true); } finally { setPending(false); } }}>Sign out</button>{error && <p role="alert">Sign-out failed. Try again.</p>}</div>;
}
