import { existsSync } from 'node:fs';
import path from 'node:path';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ActivityScene } from '../ActivityScene';
import { DOMAIN_KEYS } from '../../content/taxonomy';

// jsdom does not fetch <img src>, so a renamed or deleted asset would 404 at
// runtime without failing here unless the file's actual presence is checked.
const ASSET_DIR = path.resolve(__dirname, '../../../public/illustrations/activities');

// A parent who cannot read the instructions still needs to understand the
// activity from the picture alone, so this scene must show a parent AND a
// child, not just a symbol for the topic. Every taxonomy domain needs its own
// pre-generated illustration, same guard as DomainArt.test.tsx: adding a
// seventeenth domain without one must fail CI, not silently fall back.

afterEach(cleanup);

describe('ActivityScene', () => {
  it.each(DOMAIN_KEYS)('renders the illustration for %s', (key) => {
    const { container } = render(<ActivityScene domainKey={key} />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe(`/illustrations/activities/${key}.webp`);
    // Decorative: the surrounding page text carries the meaning, not the image.
    expect(img?.getAttribute('aria-hidden')).toBe('true');
    expect(img?.getAttribute('alt')).toBe('');
    expect(existsSync(path.join(ASSET_DIR, `${key}.webp`))).toBe(true);
  });

  it('falls back to the play illustration rather than a broken image for an unknown domain', () => {
    const { container } = render(<ActivityScene domainKey="not_a_real_domain" />);
    const img = container.querySelector('img');
    expect(img?.getAttribute('src')).toBe('/illustrations/activities/play.webp');
  });

  it('still renders an illustration when no domain is known at all', () => {
    const { container } = render(<ActivityScene />);
    expect(container.querySelector('img')).not.toBeNull();
  });
});
