// Knowledge base — 0–12 months.
//
// Authored under the Knowledge Base Architect brief: content only, no software
// changes. Each band file carries milestones, domain guides (development
// explanation, parent observations, daily/weekly activities, indoor/outdoor
// play, nutrition, sleep, safety, common questions, red flags, when to seek
// help, parent tips), themed activities and a printable checklist.
import type { SeedItem } from '../../types';
import { BIRTH_2M } from './birth2m';
import { M3_4M } from './m3_4';
import { M5_6M } from './m5_6';

export const INFANT_CONTENT: SeedItem[] = [...BIRTH_2M, ...M3_4M, ...M5_6M];
