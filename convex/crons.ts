import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

crons.interval('expire unverified directory entries', { hours: 24 }, internal.directory.expireOverdue);
crons.interval('expire subscriptions and trials', { hours: 1 }, internal.subscriptions.expireDueSubscriptions);
crons.interval('send reviewer due-date reminders', { hours: 24 }, internal.notifications.sendReviewerReminders);

export default crons;
