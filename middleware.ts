import { convexAuthNextjsMiddleware } from '@convex-dev/auth/nextjs/server';
import { NextResponse } from 'next/server';
export default process.env.NEXT_PUBLIC_CONVEX_URL ? convexAuthNextjsMiddleware(undefined, { cookieConfig: { maxAge: 60 * 60 * 24 * 30 } }) : () => NextResponse.next();
export const config = { matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv)).*)', '/api/(.*)'] };
