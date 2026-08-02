import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DomainArt, resolveArtKey } from '../DomainArt';
import { DOMAIN_KEYS } from '../../content/taxonomy';

// Every developmental domain in the taxonomy must have artwork: the scenes are
// keyed by domain, so adding a domain without a scene would silently fall back
// to the generic one. These tests turn that drift into a failure.

afterEach(cleanup);

describe('resolveArtKey', () => {
  it.each(DOMAIN_KEYS)('maps the %s domain to its own scene', (key) => {
    expect(resolveArtKey(key)).toBe(key);
  });

  it('falls back to the generic play scene for unknown or missing domains', () => {
    expect(resolveArtKey('not_a_domain')).toBe('play');
    expect(resolveArtKey(undefined)).toBe('play');
    expect(resolveArtKey(null)).toBe('play');
  });
});

describe('DomainArt', () => {
  it.each(DOMAIN_KEYS)('renders a decorative svg for %s', (key) => {
    const { container } = render(<DomainArt domainKey={key} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    // Decorative: the adjacent title carries the meaning.
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    // A background plus at least one scene shape — an empty card is a bug.
    expect((svg?.children.length ?? 0)).toBeGreaterThan(1);
  });

  it('renders the fallback scene rather than crashing on an unknown domain', () => {
    const { container } = render(<DomainArt domainKey="mystery" />);
    expect(container.querySelector('svg')).not.toBeNull();
  });
});
