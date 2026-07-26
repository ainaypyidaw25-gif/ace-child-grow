import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

crons.interval('expire unverified directory entries', { hours: 24 }, internal.directory.expireOverdue);

export default crons;
