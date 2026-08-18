type AppleAuthProfile = {
  sub: string;
  email: string;
  user?: {
    name?: {
      firstName?: string;
      lastName?: string;
    };
  };
};

/**
 * Apple intentionally has no profile image. Auth.js represents that as
 * `image: null`, but Convex Auth's users table accepts an omitted image only.
 */
export function normalizeAppleProfile(profile: AppleAuthProfile) {
  const fullName = [profile.user?.name?.firstName, profile.user?.name?.lastName]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .map((part) => part.trim())
    .join(' ');

  return {
    id: profile.sub,
    name: fullName || profile.email,
    email: profile.email,
  };
}
