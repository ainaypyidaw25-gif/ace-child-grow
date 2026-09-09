import type { Id } from '../_generated/dataModel';

/**
 * Immutable successor snapshot for the duplicate-owner finalization.
 *
 * This release intentionally stores only Convex row identifiers and canonical
 * SHA-256 digests. The underlying account/profile content may contain PII and
 * must not be copied into source control.
 */
export const OWNER_ACCOUNT_MERGE_V2_RELEASE_ID =
  'owner-account-merge-lapyaewun2690-2026-09-09-v2' as const;
export const OWNER_ACCOUNT_MERGE_V2_FINALIZE_ACTION =
  'auth.account.merge_duplicate_owner.finalize.2026_09_09_v2' as const;
export const OWNER_ACCOUNT_MERGE_V2_FINALIZE_CONFIRMATION =
  'confirm-owner-account-finalize-lapyaewun2690-2026-09-09-v2' as const;

export const OWNER_ACCOUNT_MERGE_V2_SOURCE_USER_ID =
  'mn7en7gt4yc0w1fny6gfccqb8s8bck0m' as Id<'users'>;
export const OWNER_ACCOUNT_MERGE_V2_TARGET_USER_ID =
  'mn79pqcdy108y85stdxvtvqcz18b8w9c' as Id<'users'>;
export const OWNER_ACCOUNT_MERGE_V2_SOURCE_PROFILE_ID =
  'md7ab5dgsg9h6ew6ah2n39f7v98bds46' as Id<'parentProfiles'>;
export const OWNER_ACCOUNT_MERGE_V2_SOURCE_SUBSCRIPTION_ID =
  'mx72fnnqyd0q125shqxv4vvebh8bc1xa' as Id<'subscriptions'>;

export type FrozenSet = {
  count: number;
  idsDigest: string;
  rowsDigest: string;
};

export type FrozenReferenceSet = {
  key: string;
  count: number;
  idsDigest: string;
  linksDigest: string;
};

const EMPTY_SET: FrozenSet = {
  count: 0,
  idsDigest: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
  rowsDigest: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
};

export const OWNER_ACCOUNT_MERGE_V2_EXPECTED_PREIMAGE = {
  sourceUser: {
    count: 1,
    idsDigest: 'b55600e550a0ac4ce7c0fa3280c93339c67bc6a90f2793c76870040fdbd255e4',
    rowsDigest: '0bb7e4f0e0a4539a80ec35cd36683cb2b45aeaec7cae611f35516328cb40aadc',
  },
  targetUser: {
    count: 1,
    idsDigest: 'fc809aaf86502d57af8abe1d0e72211c3283a235cc18fb461634bbbbdbdba130',
    rowsDigest: '0d4832af0fe8ca174f9220323cc917f5ec39007f86a5a1f8400d588490f094e4',
  },
  sourceProfiles: {
    count: 1,
    idsDigest: '58ef544b1e203bd29c3570f8245f1feaa1190e94d8e7520d6da1d8bb982f21fa',
    rowsDigest: '3170766533c785f378e554a6008382b4a42e2c6f11c9f17b5d5b3046399ec8b4',
  },
  targetProfiles: {
    count: 1,
    idsDigest: 'f87e1f27e24114ac360e14b6c05494223658fe5b5355b4768525124fa3a6627b',
    rowsDigest: '62d4dbac7cdc6942d1203d546c3ec025d1f7baff67364aa0bcdcb5aa7104d1f1',
  },
  sourceSubscriptions: {
    count: 1,
    idsDigest: '2ebe99bc3dfd76b1001ba1043e443a4e918bb44e9bd99e8d8c32c4cbbf477fcd',
    rowsDigest: 'a0cded0ceb57d16c665098300db7e207aa35ece556bfe8b0605bd232320437bc',
  },
  targetSubscriptions: {
    count: 1,
    idsDigest: '7ada07d1b01c5c703d386e102e8434c01923ed7f96bf060e291b4318b07f8602',
    rowsDigest: '22bd88258f1db5a680ab5edd212249d50a7836e1ce68e0fb9108c7972ddc195f',
  },
  sourceChildren: {
    count: 1,
    idsDigest: 'db962227f6de84e5b7be6bb510863eacd33e4bbf377f13de69c52a96c0c366ac',
    rowsDigest: 'b330d52f5e1003e776c96ba6e394d558fefd18f274377eb77927854dc96fc1b5',
  },
  targetChildren: {
    count: 2,
    idsDigest: '693371a4e15b0f907ae182d5115c68deae495392e1851967f45048557a35ead1',
    rowsDigest: '2cc6123bb70a12205d2f7a8f339cc800f87cb25236ed8a9f37ab1439d1abf0c5',
  },
  sourceActivities: {
    count: 16,
    idsDigest: 'd54b6acde331e0cdb0299df2df07205b1897aacb0d466422c4852a20fb8e32bd',
    rowsDigest: 'faf9467837af122bea60e074d124553f1787670e9b0421316053b95254a9989d',
  },
  targetActivities: {
    count: 3,
    idsDigest: '1883efb6537190025cff2daa8298cc0bfc8b97c67d6edfe0e1b173a53ead12e2',
    rowsDigest: '626ef5184bdce6c59cbfd767a5174af8908839c7e76c8519008a40439c79e5bf',
  },
  sourceNotifications: {
    count: 1,
    idsDigest: '11ac02b3402d3c5f8727e2b9152d5972c566eaddb48652fdc5aa6736129f5d45',
    rowsDigest: '3c41f8d4bea914461ffa5ee135b0e6373c79cf3e9ddc6af0aa50fe420444bfaa',
  },
  targetNotifications: {
    count: 1,
    idsDigest: 'b87494deeb13271671950dcb6beddcf753f773390e54e87411ae175c616dbb76',
    rowsDigest: '29dd3167c785c7e1874fa49e2ff4d5c097a7ecb441771ee983220bb1237f9fc5',
  },
  sourceReviews: {
    count: 26,
    idsDigest: 'ff91e3190f4b0f0b0f1252c7646ab4635e7d2da2bf72a0a24dfec98d8e9ac386',
    rowsDigest: 'cbbab9b06599343829c78d47924762b6e424d5f6cf29e9e4d9c857b08e92081f',
  },
  sourceEditLogs: {
    count: 11,
    idsDigest: 'cd79e860bb621615de5bdd1500db7d684acba0d5cf063e454de49fdc22ab0475',
    rowsDigest: '0f6eeb9633607ae86427c8284c55551bc4066868e203a508056d2202dff67f7d',
  },
  targetAccountProjection: {
    count: 2,
    idsDigest: '2806318d6acec68ee74a71508d07329ab50116114bb3739aa4c8ce32027d2907',
    rowsDigest: '595ce757dcb16d452376da60629f2bf9c1e24e9d2020259836107af87e3242b6',
  },
  v1QuarantineAudit: {
    count: 1,
    idsDigest: '9f0bb971ccf65a215b46895481f99761cc9a7fe976595e832ac7b1c0a3b51666',
    rowsDigest: 'a71d8cff6860f67450e2e543f803a9a6a66a8882e4a02e2dde227ab874e189ac',
  },
} satisfies Record<string, FrozenSet>;

export const OWNER_ACCOUNT_MERGE_V2_EXPECTED_POSTIMAGE = {
  ...OWNER_ACCOUNT_MERGE_V2_EXPECTED_PREIMAGE,
  sourceProfiles: EMPTY_SET,
  sourceSubscriptions: EMPTY_SET,
  sourceChildren: EMPTY_SET,
  sourceActivities: EMPTY_SET,
  sourceNotifications: EMPTY_SET,
  targetChildren: {
    count: 3,
    idsDigest: 'ffaa5658077d22f25eb198a6ee935d94baff3dfe0e86882eef069e28a5a2128d',
    rowsDigest: 'f74dd989baa127a92a2f00aab0bb730d3d1db4dc64489ec38e2626623b086bdf',
  },
  targetActivities: {
    count: 19,
    idsDigest: '3c3c867e2983926aa75727175063713c4200be9a84748a2b0fa01163b9acd8ee',
    rowsDigest: 'c46d367ae6c485b29898ea2f9aea87b609bf53ac78559abd385fe67cb1af34bf',
  },
  targetNotifications: {
    count: 2,
    idsDigest: 'debeda0216d93ccfa0e8d79dc86f55194ae78712a6126d3f01c42f7c8cb8f46e',
    rowsDigest: '6976986344fc48089990f6f0e1b20e651d4d8350634b7702e57bbc22536e3ef6',
  },
} satisfies Record<string, FrozenSet>;

/** Eight target-owner link sets observed in the 2026-09-09 production snapshot. */
export const OWNER_ACCOUNT_MERGE_V2_TARGET_REFERENCE_SETS = [
  { key: 'sleepRecords.userId', count: 1, idsDigest: '7cbec37e82d3423692a04072259fe2ffae2ce29b7f4ce0809f7eb841797069ce', linksDigest: '6c1414b77df04aba6b14b0d5c6d8c795fa8489c40a09f115e14281ad41c4a822' },
  { key: 'milestoneSessions.userId', count: 5, idsDigest: 'cd0add9aa6a196b5ba6c7ca88bb47987ef88ca35770cd420f5ea3b4c55582cf4', linksDigest: '412000ce14e0e979023b65c602d9f275d14fe1c8164365680d23aea9bc9c5391' },
  { key: 'milestoneResponses.userId', count: 59, idsDigest: '7ce35c1c1c6ab0f488f052d2506681aa1328565f2a8af8218acae909e969e6c4', linksDigest: 'd5c17fb48af3be7877b77ad747bbb7f472e7dbe96e6b1855def674d38cc08fc8' },
  { key: 'observations.userId', count: 1, idsDigest: '0461978f953ddf543abb222f8d9897f8ff961dd856b49b87810c0c52e649d07b', linksDigest: '03e5d507e14c804ca4d9998c062b068d2fd0ef69559aff9df092cc22a6c7623b' },
  { key: 'staffInvites.invitedBy', count: 8, idsDigest: '09cd75bf249df9d21defe3bf0b8411de3ed1865e76115bf0ad1d831fcf89e0c8', linksDigest: '95bfeb4a2fdaeae09b768a0eb8fb80aa6be342a37b5091e12ec94d5cfc91731a' },
  { key: 'contentItems.reviewerId', count: 22, idsDigest: '13716e1a9511c0abd6ae5403d716f32c03d93dad0096f354feb9fe517917c3e7', linksDigest: '52c717ce88ef7311543f6da02eed1da862c70f7ccd9f121d0d934c50e401e1c3' },
  { key: 'libraryContent.reviewerId', count: 81, idsDigest: 'de3538c115297dc12936d3e48f0787742f467c4f1f7e7fe8d82e73b1eaba5f92', linksDigest: '168404d7205de5325b7b816bd142fa75a4663e7ad3c695898526e509536e92c4' },
  { key: 'evidenceSources.reviewerId', count: 86, idsDigest: '2b7d10a7be418d883b4d698d6cf97af5676e235f429f632bcd6de3db4e772fcd', linksDigest: 'dd48320f17f4e039129bee2bd6aa51752508dbfc8793043176026e3946f030ea' },
] as const satisfies readonly FrozenReferenceSet[];
