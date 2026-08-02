import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ActivityScene } from '../ActivityScene';
import { DOMAIN_KEYS } from '../../content/taxonomy';

// A parent who cannot read the instructions still needs to understand the
// activity from the picture alone, so this scene must show a parent AND a
// child, not just a symbol for the topic. Every taxonomy domain needs a scene,
// same guard as DomainArt.test.tsx: adding a seventeenth domain without one
// must fail CI, not silently render nothing.

afterEach(cleanup);

describe('ActivityScene', () => {
  it.each(DOMAIN_KEYS)('renders a decorative 16:9 scene for %s', (key) => {
    const { container } = render(<ActivityScene domainKey={key} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 320 180');
    // Decorative: the surrounding page text carries the meaning, not the image.
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    // Every scene must be more than an empty frame.
    expect((svg?.children.length ?? 0)).toBeGreaterThan(1);
  });

  it('falls back to a scene rather than rendering nothing for an unknown domain', () => {
    const { container } = render(<ActivityScene domainKey="not_a_real_domain" />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect((svg?.children.length ?? 0)).toBeGreaterThan(1);
  });

  it('still renders a scene when no domain is known at all', () => {
    const { container } = render(<ActivityScene />);
    expect(container.querySelector('svg')).not.toBeNull();
  });
});
