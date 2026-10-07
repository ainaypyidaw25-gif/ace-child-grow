import { useSyncExternalStore, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { getFunctionName } from 'convex/server';
import { App } from '../../app/App';

const mock = vi.hoisted(() => ({
  keys: [] as string[],
  listeners: new Set<() => void>(),
  toggle: vi.fn(),
  items: [{ _id: 'activity:1', slug: 'play-with-blocks', titleEn: 'Play with blocks', titleMm: 'ကစားမယ်', summaryEn: 'Build together', summaryMm: 'အတူကစားမယ်', domainKey: 'cognitive' }],
  loading: false,
  locale: 'en',
}));
vi.mock('convex/react', () => ({
  Authenticated: ({ children }: { children: ReactNode }) => children,
  Unauthenticated: () => null,
  AuthLoading: () => null,
  useQuery: (ref: Parameters<typeof getFunctionName>[0]) => {
    const keys = useSyncExternalStore(
      (listener) => { mock.listeners.add(listener); return () => { mock.listeners.delete(listener); }; },
      () => mock.keys,
    );
    const name = getFunctionName(ref);
    if (name === 'favorites:list') return keys;
    if (name === 'subscriptions:mine') return { planKey: 'free', features: [] };
    return [];
  },
  useMutation: (ref: Parameters<typeof getFunctionName>[0]) => getFunctionName(ref) === 'favorites:toggle' ? mock.toggle : vi.fn(),
}));
vi.mock('@convex-dev/auth/react', () => ({ useAuthActions: () => ({ signOut: vi.fn() }) }));
vi.mock('../../app/LocaleContext', () => ({ useLocale: () => ({ locale: mock.locale, setLocale: vi.fn(), t: (key: string) => key }) }));
vi.mock('../../app/AppState', () => ({ useAppState: () => ({
  activeChild: { id: 'child:1', nickname: 'Baby', birthDate: '2025-01-01' },
  state: { children: [], activeChildId: null }, dispatch: vi.fn(),
}) }));
vi.mock('../../app/useOfflineLibrary', () => ({
  useLibraryContent: () => mock.loading ? undefined : { staff: false, items: mock.items },
  useOfflineWithdrawal: () => undefined,
}));
vi.mock('../../components/Layout', () => ({ Layout: ({ children }: { children: ReactNode }) => children }));
vi.mock('../../components/ReferralSection', () => ({ ReferralSection: () => null }));
vi.mock('../SignIn', () => ({ SignIn: () => null }));
vi.mock('../OfflineDownloads', () => ({ OfflineDownloads: () => <h1>Offline route</h1> }));
vi.mock('../SubscriptionPlans', () => ({ SubscriptionPlans: () => <h1>Subscription route</h1> }));
vi.mock('../Home', () => ({ Home: () => <h1>Home route</h1> }));

function open(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
}
beforeEach(() => {
  mock.keys = [];
  mock.loading = false;
  mock.locale = 'en';
  mock.toggle.mockReset();
  mock.toggle.mockImplementation(async ({ activityKey }: { activityKey: string }) => {
    mock.keys = mock.keys.includes(activityKey) ? mock.keys.filter((key) => key !== activityKey) : [...mock.keys, activityKey];
    for (const listener of mock.listeners) listener();
  });
});
afterEach(cleanup);

describe(`Saved Activities (${import.meta.env.VITE_DISTRIBUTION || 'web'})`, () => {
  it('saves an activity, opens the saved list through Activities, and unsaves it', async () => {
    open('/activities');
    fireEvent.click(await screen.findByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('aria-pressed', 'true'));
    fireEvent.click(screen.getByRole('link', { name: 'Saved activities' }));
    await screen.findByRole('heading', { name: 'favorites.title' });
    const saved = await screen.findByRole('link', { name: /Play with blocks/ });
    expect(saved).toHaveAttribute('href', '/content/play-with-blocks');
    fireEvent.click(screen.getByRole('button', { name: 'Remove from saved activities' }));
    await screen.findByText('favorites.empty');
    expect(mock.toggle.mock.calls).toEqual([[{ activityKey: 'play-with-blocks' }], [{ activityKey: 'play-with-blocks' }]]);
  });
  it('preserves offline and payment route guards for the current distribution', async () => {
    const native = ['app-store', 'play-store'].includes(import.meta.env.VITE_DISTRIBUTION ?? '');
    open('/offline');
    await screen.findByRole('heading', { name: native ? 'Home route' : 'Offline route' });
    cleanup();
    open('/subscription');
    await screen.findByRole('heading', { name: native ? 'Home route' : 'Subscription route' });
  });
  it('opens /favorites directly without redirecting to Home', async () => {
    mock.keys = ['play-with-blocks'];
    open('/favorites');
    expect(await screen.findByRole('link', { name: /Play with blocks/ })).toBeVisible();
    expect(screen.queryByText('Home route')).toBeNull();
  });
  it('opens the saved list from Profile', async () => {
    mock.keys = ['play-with-blocks'];
    open('/profile');
    fireEvent.click(await screen.findByRole('link', { name: /Saved activities/ }));
    expect(await screen.findByRole('link', { name: /Play with blocks/ })).toBeVisible();
  });
  it('keeps the Myanmar Saved Activities entry points available', async () => {
    mock.locale = 'mm';
    open('/activities');
    expect(await screen.findByRole('link', { name: 'သိမ်းထားသော လှုပ်ရှားမှုများ' })).toHaveAttribute('href', '/favorites');
    cleanup();
    open('/profile');
    expect(await screen.findByRole('link', { name: /သိမ်းထားသော လှုပ်ရှားမှုများ/ })).toHaveAttribute('href', '/favorites');
  });
  it('does not report an empty list while saved content is loading', async () => {
    mock.keys = ['play-with-blocks'];
    mock.loading = true;
    open('/favorites');
    await screen.findByRole('heading', { name: 'favorites.title' });
    expect(screen.getByRole('status')).toBeVisible();
    expect(screen.queryByText('favorites.empty')).toBeNull();
  });
  it('allows removing unavailable and legacy keys without exposing seed content', async () => {
    mock.keys = ['withdrawn-slug', 'act-0'];
    open('/favorites');
    await screen.findByRole('heading', { name: 'favorites.title' });
    expect(screen.getAllByText('This activity is currently unavailable.')).toHaveLength(2);
    expect(screen.queryByRole('link')).toBeNull();
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove from saved activities' })[0]);
    await waitFor(() => expect(mock.keys).toEqual(['act-0']));
  });
  it('retains the saved item and allows retry after an unsave failure', async () => {
    mock.keys = ['play-with-blocks'];
    mock.toggle.mockRejectedValueOnce(new Error('offline'));
    open('/favorites');
    fireEvent.click(await screen.findByRole('button', { name: 'Remove from saved activities' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not remove');
    expect(screen.getByRole('link', { name: /Play with blocks/ })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Remove from saved activities' }));
    await screen.findByText('favorites.empty');
  });
  it('keeps unsave disabled while its mutation is pending', async () => {
    mock.keys = ['play-with-blocks'];
    let finish: (() => void) | undefined;
    mock.toggle.mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve; }));
    open('/favorites');
    const button = await screen.findByRole('button', { name: 'Remove from saved activities' });
    fireEvent.click(button);
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(mock.toggle).toHaveBeenCalledTimes(1);
    finish?.();
    await waitFor(() => expect(button).not.toBeDisabled());
  });
});
