import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LocaleProvider } from '../../app/LocaleContext';
import { SubscriptionPlans } from '../SubscriptionPlans';

// Fix (production audit follow-up): convex/subscriptions.ts's cancelAtPeriodEnd
// mutation existed but no screen ever called it — a paying parent had no
// self-service way to turn off auto-renewal. This covers the "Manage
// subscription" control this fix adds: shown only for a real paid, non-trial
// plan; hidden once already canceling; routes through the shared
// ConfirmDialog rather than firing on the first click.

const options = { plans: [], methods: [] };
const emptyList: unknown[] = [];

// useQuery is called in a fixed order on every render of SubscriptionPlans:
// billing.options, billing.myRequests, mmpayData.myPayments,
// subscriptions.mine (0..3, then repeating on re-render).
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

// useMutation is called in a fixed order: generateProofUploadUrl,
// submitPaymentRequest, cancelMyRequest, startTrial, cancelAtPeriodEnd
// (0..4, then repeating). Track calls to index 4 (cancelAtPeriodEnd).
const cancelRenewalCalls = vi.hoisted(() => [] as unknown[]);
let mutationCallCount = 0;

vi.mock('convex/react', () => ({
  useQuery: () => {
    const index = queryCallCount++ % 4;
    if (index === 0) return options;
    if (index === 3) return subscriptionMock;
    return emptyList;
  },
  useMutation: () => {
    const index = mutationCallCount++ % 5;
    return vi.fn(async (args: unknown) => {
      if (index === 4) cancelRenewalCalls.push(args);
      return undefined;
    });
  },
  useAction: () => vi.fn(),
}));

afterEach(() => {
  cleanup();
  queryCallCount = 0;
  mutationCallCount = 0;
  cancelRenewalCalls.length = 0;
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

describe('SubscriptionPlans — manage/cancel auto-renewal', () => {
  it('offers to cancel auto-renewal for an active paid plan, and calls the mutation only after confirming', async () => {
    subscriptionMock = {
      ...subscriptionMock,
      planKey: 'premium',
      isTrial: false,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: Date.parse('2026-09-05'),
    };
    renderScreen();

    const cancelButton = screen.getByRole('button', { name: 'သက်တမ်းတိုးခြင်း ပယ်ဖျက်မည်' });
    fireEvent.click(cancelButton);

    // Clicking the entry button must not fire the mutation directly — it
    // must go through the confirm dialog first.
    expect(cancelRenewalCalls).toHaveLength(0);
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'ပယ်ဖျက်မည်' }));

    await waitFor(() => expect(cancelRenewalCalls).toHaveLength(1));
    expect(await screen.findByText('သက်တမ်းတိုးခြင်းကို ပယ်ဖျက်ပြီးပါပြီ။')).toBeTruthy();
  });

  it('does not fire the mutation when the confirm dialog is dismissed', () => {
    subscriptionMock = {
      ...subscriptionMock,
      planKey: 'family',
      isTrial: false,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: Date.parse('2026-09-05'),
    };
    renderScreen();

    fireEvent.click(screen.getByRole('button', { name: 'သက်တမ်းတိုးခြင်း ပယ်ဖျက်မည်' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'မလုပ်တော့ပါ' }));

    expect(cancelRenewalCalls).toHaveLength(0);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows the non-renewing state and hides the cancel button once already canceled', () => {
    subscriptionMock = {
      ...subscriptionMock,
      planKey: 'premium',
      isTrial: false,
      cancelAtPeriodEnd: true,
      currentPeriodEnd: Date.parse('2026-09-05'),
    };
    renderScreen();

    expect(screen.queryByRole('button', { name: 'သက်တမ်းတိုးခြင်း ပယ်ဖျက်မည်' })).toBeNull();
    expect(screen.getByText(/အလိုအလျောက် သက်တမ်းတိုးမည် မဟုတ်တော့ပါ/)).toBeTruthy();
  });

  it('hides the manage-subscription control on the free plan', () => {
    subscriptionMock = { ...subscriptionMock, planKey: 'free', isTrial: false, cancelAtPeriodEnd: false };
    renderScreen();

    expect(screen.queryByRole('button', { name: 'သက်တမ်းတိုးခြင်း ပယ်ဖျက်မည်' })).toBeNull();
  });

  it('hides the manage-subscription control during the free trial (it already auto-expires)', () => {
    subscriptionMock = {
      ...subscriptionMock,
      planKey: 'premium',
      isTrial: true,
      cancelAtPeriodEnd: true,
      currentPeriodEnd: Date.parse('2026-08-12'),
    };
    renderScreen();

    expect(screen.queryByRole('button', { name: 'သက်တမ်းတိုးခြင်း ပယ်ဖျက်မည်' })).toBeNull();
    expect(screen.queryByText(/အလိုအလျောက် သက်တမ်းတိုးမည် မဟုတ်တော့ပါ/)).toBeNull();
  });
});
