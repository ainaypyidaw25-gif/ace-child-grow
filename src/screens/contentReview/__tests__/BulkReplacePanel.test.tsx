import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { LocaleProvider } from '../../../app/LocaleContext';
import { BulkReplacePanel } from '../BulkReplacePanel';

// Owner request: editing content one item at a time via the review search box
// does not scale for a wording fix that spans many items. This covers the
// preview-before-write contract — the whole point of the feature — and that
// updateDraft is only ever called for items still selected after preview.

const items = [
  {
    slug: 'ms_1',
    type: 'milestone',
    titleMm: 'ကလေးရှာစေပါ ခေါင်းစဉ်',
    titleEn: 'Untouched title one',
    summaryMm: undefined,
    summaryEn: undefined,
    data: { observeMm: 'ရှာစေပါ ဆိုသည်မှာ' },
    reviewRevision: 3,
  },
  {
    slug: 'ms_2',
    type: 'milestone',
    titleMm: 'ရှာစေပါ ခေါင်းစဉ်နှစ်',
    titleEn: 'Untouched title two',
    summaryMm: undefined,
    summaryEn: undefined,
    data: { observeMm: 'ရှာစေပါ ဆိုသည်မှာ' },
    reviewRevision: 1,
  },
  {
    slug: 'ms_3',
    type: 'milestone',
    titleMm: 'မတူညီသော စာသား',
    titleEn: 'No match here',
    summaryMm: undefined,
    summaryEn: undefined,
    data: {},
    reviewRevision: 1,
  },
];

const updateDraftCalls: unknown[] = [];

vi.mock('convex/react', () => ({
  useQuery: () => items,
  useMutation: () => vi.fn(async (args: unknown) => {
    updateDraftCalls.push(args);
    return { ok: true, reviewRevision: 2 };
  }),
}));

afterEach(() => {
  cleanup();
  updateDraftCalls.length = 0;
});

function renderPanel(canEdit = true) {
  return render(
    <LocaleProvider>
      <BulkReplacePanel canEdit={canEdit} />
    </LocaleProvider>,
  );
}

describe('BulkReplacePanel', () => {
  it('renders nothing for a role without edit permission', () => {
    const { container } = renderPanel(false);
    expect(container.firstChild).toBeNull();
  });

  it('previews every matching item and field before writing anything', () => {
    renderPanel();
    fireEvent.change(screen.getByPlaceholderText('ဥပမာ — ရှာစေပါ'), { target: { value: 'ရှာစေပါ' } });
    fireEvent.change(screen.getByPlaceholderText('ဥပမာ — ရှာပါစေ'), { target: { value: 'ရှာပါစေ' } });
    fireEvent.click(screen.getByRole('button', { name: 'ကြိုကြည့်မည်' }));

    expect(screen.getByText(/ms_1/)).toBeTruthy();
    expect(screen.getByText(/ms_2/)).toBeTruthy();
    expect(screen.queryByText(/ms_3/)).toBeNull();
    expect(updateDraftCalls).toHaveLength(0);
  });

  it('does not call updateDraft until the confirm dialog is accepted', () => {
    renderPanel();
    fireEvent.change(screen.getByPlaceholderText('ဥပမာ — ရှာစေပါ'), { target: { value: 'ရှာစေပါ' } });
    fireEvent.change(screen.getByPlaceholderText('ဥပမာ — ရှာပါစေ'), { target: { value: 'ရှာပါစေ' } });
    fireEvent.click(screen.getByRole('button', { name: 'ကြိုကြည့်မည်' }));

    fireEvent.click(screen.getByRole('button', { name: /2 ခုကို အတည်ပြုမည်/ }));
    expect(updateDraftCalls).toHaveLength(0);
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('applies only to items still selected after preview, and skips deselected ones', async () => {
    renderPanel();
    fireEvent.change(screen.getByPlaceholderText('ဥပမာ — ရှာစေပါ'), { target: { value: 'ရှာစေပါ' } });
    fireEvent.change(screen.getByPlaceholderText('ဥပမာ — ရှာပါစေ'), { target: { value: 'ရှာပါစေ' } });
    fireEvent.click(screen.getByRole('button', { name: 'ကြိုကြည့်မည်' }));

    // Deselect ms_2 — only ms_1 should be written.
    const ms2Checkbox = screen.getByText('ms_2 · milestone').closest('label')!.querySelector('input[type="checkbox"]')!;
    fireEvent.click(ms2Checkbox);

    fireEvent.click(screen.getByRole('button', { name: /1 ခုကို အတည်ပြုမည်/ }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'အတည်ပြုမည်' }));

    await waitFor(() => expect(updateDraftCalls).toHaveLength(1));
    expect(updateDraftCalls[0]).toMatchObject({
      slug: 'ms_1',
      titleMm: 'ကလေးရှာပါစေ ခေါင်းစဉ်',
      titleEn: 'Untouched title one',
      expectedReviewRevision: 3,
    });
    expect(await screen.findByText(/Updated 1 item|1 ခု ပြင်ပြီးပါပြီ/)).toBeTruthy();
  });
});
