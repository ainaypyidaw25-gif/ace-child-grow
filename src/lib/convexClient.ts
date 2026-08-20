import { ConvexReactClient } from 'convex/react';

// Public deployment URL only (safe to ship). Empty in local demo builds.
const url = import.meta.env.VITE_CONVEX_URL as string | undefined;
const fallbackUrl = 'https://placeholder.convex.cloud';

export const isConvexConfigured = Boolean(url);
export const convexDeploymentUrl = url ?? fallbackUrl;

// A single client instance. When unconfigured we still create a client against a
// placeholder so hooks don't crash; the AuthGate keeps unauthenticated users out.
export const convex = new ConvexReactClient(convexDeploymentUrl);
