import Google from '@auth/core/providers/google';
import { convexAuth } from '@convex-dev/auth/server';
import { isReportOwner } from '../lib/report-access';
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google({ profile(profile) {
    if (profile.email_verified !== true || !isReportOwner(profile.email?.toLowerCase(), process.env.AUTH_OWNER_EMAIL?.toLowerCase())) throw new Error('This account is not approved for this workspace.');
    return { id: profile.sub, name: profile.name, email: profile.email, image: profile.picture };
  } })],
});
