import { httpRouter } from 'convex/server';
import { auth } from './auth';
import { ingest } from './reporting';
const http = httpRouter();
auth.addHttpRoutes(http);
http.route({ path: '/reporting/ingest', method: 'POST', handler: ingest });
export default http;
