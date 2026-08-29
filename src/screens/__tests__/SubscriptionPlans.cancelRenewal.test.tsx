import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { SubscriptionPlans } from '../SubscriptionPlans';

const monthlyPlan = {
  _id: 'plans:monthly',
  _creationTime: 1,
  planKey: 'premium',
  nameMm: 'Premium လစဉ်',
  nameEn: 'Premium Monthly',
  descriptionMm: 'Premium ဝန်ဆောင်မှုများကို လစဉ် အသုံးပြုရန်',
  descriptionEn: 'Monthly Premium access',
  amount: 6_900,
  currency: 'MMK',
  interval: 'month',
  features: [],
  isActive: true,
  sortOrder: 0,
  createdAt: 1,
  updatedAt: 1,
};
const options = { plans: [monthlyPlan], methods: [] };
const emptyList: unknown[] = [];
let subscriptionMock = {
  planKey: 'free' as 'free' | 'premium' | 'family',
  status: 'active',
  features: [] as string[],
  currentPeriodEnd: null as number | null,
  cancelAtPeriodEnd: false,
  isTrial: false,
  trialEligible: true,
  daysRemaining: null as number | null,
  inheritedFamilyAccess: false,
  testingAccess: false,
};
let queryCallCount = 0;

vi.mock('convex/react', () => ({
  useQuery: () => {
    const index = queryCallCount++ % 4;
    if (index === 0) return options;
    if (index === 3) return subscriptionMock;
    return emptyList;
  },
  useMutation: () => vi.fn(),
  useAction: () => vi.fn(),
}));

afterEach(() => {
  cleanup();
  queryCallCount = 0;
});

function renderScreen() {
  return render(
    <MemoryRouter>
      <LocaleProvider>
        <SubscriptionPlans />
      </LocaleProvider>
    </MemoryRouter>,
  );
}

describe('SubscriptionPlans — fixed-term paid access', () => {
  it('offers a 3-day trial and discloses monthly or yearly continuation', () => {
    subscriptionMock = { ...subscriptionMock, planKey: 'free', isTrial: false, trialEligible: true };
    renderScreen();

    expect(screen.getByText('Premium ကို ၃ ရက် အခမဲ့ စမ်းသုံးပါ')).toBeTruthy();
    expect(screen.getByText(/Premium ဆက်သုံးလိုပါက လစဉ် သို့မဟုတ် နှစ်စဉ်အစီအစဉ်/)).toBeTruthy();
    expect(screen.queryByText(/၇ ရက် အခမဲ့/)).toBeNull();
  });

  it('renders the owner-configured monthly price', () => {
    subscriptionMock = { ...subscriptionMock, planKey: 'free', trialEligible: false };
    renderScreen();

    expect(screen.getByText(/6,900/)).toBeTruthy();
    expect(screen.getByText(/MMK \/ လ/)).toBeTruthy();
    expect(screen.queryByText(/၇ ရက်သုံးခွင့်/)).toBeNull();
  });

  it('describes paid access as non-renewing even for legacy rows', () => {
    subscriptionMock = {
      ...subscriptionMock,
      planKey: 'premium',
      isTrial: false,
      trialEligible: false,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: Date.parse('2026-09-05'),
    };
    renderScreen();

    expect(screen.getByText(/အလိုအလျောက် သက်တမ်းတိုးခြင်း သို့မဟုတ် ငွေကောက်ခံခြင်း မရှိပါ/)).toBeTruthy();
    expect(screen.queryByText(/အလိုအလျောက် သက်တမ်းတိုးပါမည်/)).toBeNull();
  });

  it('does not show paid-access status during the free trial', () => {
    subscriptionMock = {
      ...subscriptionMock,
      planKey: 'premium',
      isTrial: true,
      trialEligible: false,
      currentPeriodEnd: Date.parse('2026-08-12'),
    };
    renderScreen();

    expect(screen.queryByText('လက်ရှိ အခပေးသုံးခွင့်')).toBeNull();
    expect(screen.getByText(/Premium အခမဲ့စမ်းသုံးကာလ/)).toBeTruthy();
  });
});
