import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ManualReviewPanel } from '../ManualReviewPanel';

vi.mock('../../../app/LocaleContext', () => ({
  useLocale: () => ({ locale: 'mm' as const }),
}));

describe('ManualReviewPanel', () => {
  it('renders the 13 unresolved Batch 4 findings as review prompts', () => {
    render(<ManualReviewPanel onSearchContent={() => undefined} />);

    expect(screen.getByText('မပြီးသေး 13 ခု')).toBeInTheDocument();
    expect(screen.getByTestId('manual-review-78')).toBeInTheDocument();
    expect(screen.getByTestId('manual-review-90')).toBeInTheDocument();
    expect(screen.getByText(/အတည်ပြုချက်၊ ဆေးဘက်ဆိုင်ရာ ခွင့်ပြုချက်/)).toBeInTheDocument();
  });

  it('searches the manual queue and hands the related query to the normal content search', () => {
    const onSearchContent = vi.fn();
    render(<ManualReviewPanel onSearchContent={onSearchContent} />);

    fireEvent.change(screen.getByPlaceholderText('Claim ID၊ အကြောင်းအရာ သို့မဟုတ် စာသား ရိုက်ပါ'), {
      target: { value: 't2.sleep.pacifier' },
    });
    expect(screen.getByText('ပြထားသည် 1 / 13')).toBeInTheDocument();
    expect(screen.getByTestId('manual-review-89')).toBeInTheDocument();
    expect(screen.queryByTestId('manual-review-78')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'ဆက်စပ်အကြောင်းအရာ ရှာမည်' }));
    expect(onSearchContent).toHaveBeenCalledWith('sleep safe');
  });
});
