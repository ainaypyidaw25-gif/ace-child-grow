import type { Id } from '../_generated/dataModel';

// Shared by the exact merge mutation and the account-erasure worker. Keeping
// these values in one policy module prevents a release-specific guard from
// silently drifting away from the audit row that activates it.
export const OWNER_ACCOUNT_MERGE_RELEASE_ID =
  'owner-account-merge-lapyaewun2690-2026-09-01-v1' as const;
export const OWNER_ACCOUNT_MERGE_QUARANTINE_ACTION =
  'auth.account.merge_duplicate_owner.quarantine.2026_09_01_v1' as const;
export const OWNER_ACCOUNT_MERGE_SOURCE_USER_ID =
  'mn7en7gt4yc0w1fny6gfccqb8s8bck0m' as Id<'users'>;

// Stable session rows observed in the final pre-merge Production snapshot.
// Refresh-token rows beneath these sessions are intentionally not frozen:
// Convex Auth rotates them during ordinary browser use. The merge transaction
// reads and deletes every bounded token range for these exact sessions.
export const OWNER_ACCOUNT_MERGE_SOURCE_SESSIONS = [
  { _id: 'jn71k52h8stmtt5ca44807311h8bcs8h', _creationTime: 1785226991844.5076, expirationTime: 1787818991844 },
  { _id: 'jn70et7d0paxfmn7qmc336sst58bnqh1', _creationTime: 1785547497796.6729, expirationTime: 1788139497796 },
  { _id: 'jn74qz4jkjy3rj7gz1bw6sp3w18bnbaz', _creationTime: 1785553708950.4924, expirationTime: 1788145708950 },
  { _id: 'jn7ackkfwx1dvx9kphsmztpec58bm3a1', _creationTime: 1785574618969.2864, expirationTime: 1788166618969 },
  { _id: 'jn71jv5qe7a26n3n3jxp7pwbah8bmkhs', _creationTime: 1785575079748.6724, expirationTime: 1788167079748 },
  { _id: 'jn7ej7j7jx9k2v842jc8f07acs8bnjmj', _creationTime: 1785577368264.3083, expirationTime: 1788169368264 },
  { _id: 'jn714xm7mc7ta5hxda2bzcchn58bmfmv', _creationTime: 1785584631761.2046, expirationTime: 1788176631761 },
  { _id: 'jn7fbbr7skpnrxeyrvc4djh6pd8bn1s0', _creationTime: 1785588043823.9114, expirationTime: 1788180043823 },
  { _id: 'jn757dbeygwk4hzaf6g8vtwz758bmq1v', _creationTime: 1785589009220.2441, expirationTime: 1788181009220 },
  { _id: 'jn7cjfgcryqeps92t39swksg718bnqt8', _creationTime: 1785589059059.5896, expirationTime: 1788181059059 },
  { _id: 'jn72h2bhsbpz0qpf1zfxrpxpks8bmq4a', _creationTime: 1785589483380.0115, expirationTime: 1788181483380 },
  { _id: 'jn7b229as063pfcs54x7zbpheh8bn2y7', _creationTime: 1785591305954.4937, expirationTime: 1788183305954 },
  { _id: 'jn7112kef389sq057yebekgsn58c6sf1', _creationTime: 1786332104140.434, expirationTime: 1788924104140 },
  { _id: 'jn78qy7y5kkzdpx4be9rqcsrf58ddvrq', _creationTime: 1787971890938.0503, expirationTime: 1790563890938 },
  { _id: 'jn7dba15yf6p2yvtkkm66v9x8h8dd5qd', _creationTime: 1787976992226.8796, expirationTime: 1790568992226 },
  { _id: 'jn79z5ht4ggzphz8s9jpxexp4s8dg7dn', _creationTime: 1788167130346.382, expirationTime: 1790759130346 },
].map((session) => ({
  ...session,
  _id: session._id as Id<'authSessions'>,
  userId: OWNER_ACCOUNT_MERGE_SOURCE_USER_ID,
}));
