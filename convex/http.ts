import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import { auth } from './auth';

const http = httpRouter();
auth.addHttpRoutes(http);

http.route({
  path: '/mmpay/webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const nonce = request.headers.get('x-mmpay-nonce')?.trim();
    const signature = request.headers.get('x-mmpay-signature')?.trim();
    if (!nonce || !signature) {
      return Response.json({ received: false, error: 'Missing signature headers' }, { status: 401 });
    }
    if (nonce.length > 512 || signature.length > 512) {
      return Response.json({ received: false, error: 'Invalid signature headers' }, { status: 400 });
    }
    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > 64 * 1024) return Response.json({ received: false, error: 'Payload too large' }, { status: 413 });
    const rawBody = await request.text();
    if (rawBody.length > 64 * 1024) return Response.json({ received: false, error: 'Payload too large' }, { status: 413 });
    try {
      const verified = await ctx.runAction(internal.mmpay.verifyWebhook, { rawBody, nonce, signature });
      const result = await ctx.runMutation(internal.mmpayData.applyWebhook, verified);
      return Response.json({ received: true, duplicate: result.duplicate }, { status: 200 });
    } catch {
      // Do not disclose whether an order exists or which validation failed.
      return Response.json({ received: false, error: 'Invalid callback' }, { status: 400 });
    }
  }),
});

export default http;
