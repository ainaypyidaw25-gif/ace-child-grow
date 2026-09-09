import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(import.meta.dirname, '..')
const generatorFile = path.join(root, 'scripts/generate-social-calendar.mjs')
const outputDir = path.join(root, 'public/social/ace-child-grow/posts/monthly-calendar-v1')
const fontDir = path.join(root, 'public/social/ace-child-grow/assets/fonts/noto-sans-myanmar')
const previewFile = path.join(root, 'public/social/ace-child-grow/calendar-phone-preview.png')
const ids = Array.from({ length: 12 }, (_, index) => `ACE-CAL-${String(index + 7).padStart(2, '0')}`)

const generator = await readFile(generatorFile, 'utf8')
if (/padStart\(2,\s*['"]0['"]\).*\/\s*18/.test(generator) || /\$\{[^}]+\}\s*\/\s*18/.test(generator)) {
  throw new Error('Internal calendar numbering must not appear in customer-facing cards')
}
if (!generator.includes('fontfile: font')) {
  throw new Error('Myanmar text must use Sharp fontfile for deterministic shaping')
}

for (const filename of ['NotoSansMyanmar-400.woff2', 'NotoSansMyanmar-700.woff2', 'OFL-1.1.txt']) {
  await access(path.join(fontDir, filename))
}

const missingFontProbe = spawnSync(process.execPath, [generatorFile, '--visual-only'], {
  cwd: root,
  env: { ...process.env, SOCIAL_FONT_SOURCE_DIR: path.join(root, '.definitely-missing-social-font') },
  encoding: 'utf8',
})
if (missingFontProbe.status === 0 || !missingFontProbe.stderr.includes('Required licensed Myanmar font is missing')) {
  throw new Error('Generation must fail clearly when the licensed Myanmar font package is unavailable')
}

const firstHashes = new Map()
for (const id of ids) {
  const file = path.join(outputDir, `${id}.png`)
  const buffer = await readFile(file)
  const metadata = await sharp(buffer).metadata()
  if (metadata.width !== 1080 || metadata.height !== 1350) {
    throw new Error(`${id} must be 1080x1350, got ${metadata.width}x${metadata.height}`)
  }
  firstHashes.set(id, createHash('sha256').update(buffer).digest('hex'))
}

const preview = await sharp(previewFile).metadata()
if (preview.width !== 1098 || preview.height !== 1017) {
  throw new Error(`Phone preview dimensions changed unexpectedly: ${preview.width}x${preview.height}`)
}

// Future scheduled cards are the release-critical phone-scale regression set.
for (const id of ['ACE-CAL-16', 'ACE-CAL-17', 'ACE-CAL-18']) {
  if (!firstHashes.get(id)) throw new Error(`Missing future-card regression asset: ${id}`)
}

console.log(JSON.stringify({ verified: ids.length, dimensions: '1080x1350', phonePreview: `${preview.width}x${preview.height}`, futureCards: ['ACE-CAL-16', 'ACE-CAL-17', 'ACE-CAL-18'] }, null, 2))
