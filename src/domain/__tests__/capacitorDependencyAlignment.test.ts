import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const manifest = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const version: string = manifest.dependencies['@capacitor/core'];

describe('native Capacitor dependency alignment', () => {
  it('keeps the bridge, native platforms and CLI on the same exact patched release', () => {
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    const [major, minor, patch] = version.split('.').map(Number);
    expect(major > 8 || (major === 8 && (minor > 5 || (minor === 5 && patch >= 2)))).toBe(true);
    for (const name of ['@capacitor/core', '@capacitor/android', '@capacitor/ios', '@capacitor/cli']) {
      expect(manifest.dependencies[name] ?? manifest.devDependencies[name]).toBe(version);
      expect(lock.packages[`node_modules/${name}`].version).toBe(version);
    }
  });

  it('pins the separate Swift dependency to the same native release', () => {
    expect(read('ios/App/CapApp-SPM/Package.swift')).toContain(
      `.package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "${version}")`,
    );
    const resolved = JSON.parse(read('ios/App/App.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved'));
    const pin = resolved.pins.find((item: { identity: string }) => item.identity === 'capacitor-swift-pm');
    expect(pin).toEqual({
      identity: 'capacitor-swift-pm',
      kind: 'remoteSourceControl',
      location: 'https://github.com/ionic-team/capacitor-swift-pm.git',
      state: {
        version,
        // Verify the upstream tag again when changing the pinned native release.
        revision: '0b6882e9a3288342aacf36348e5a94e4f1dd7b13',
      },
    });
  });
});
