import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(import.meta.dirname, '..')
const manifestPath = path.join(root, 'public/social/ace-child-grow/manifest.json')
const calendarPath = path.join(root, 'public/social/ace-child-grow/content-calendar.json')
const generatorPath = path.join(root, 'scripts/generate-social-calendar.mjs')

const provenanceReviewRequiredIds = [
  'ACE-CAL-07',
  'ACE-CAL-08',
  'ACE-CAL-09',
  'ACE-CAL-10',
  'ACE-CAL-11',
  'ACE-CAL-12',
  'ACE-CAL-13',
  'ACE-CAL-14',
  'ACE-CAL-15',
  'ACE-CAL-16',
  'ACE-CAL-17',
  'ACE-CAL-18',
  'ACE-ACT-5M-01',
  'ACE-ACT-5M-02',
  'ACE-ACT-5M-03',
  'ACE-ACT-5M-04',
  'ACE-ACT-5M-05',
  'ACE-ACT-5M-06',
]

const editorialReviewRequiredIds = provenanceReviewRequiredIds.filter(
  (id) => !/^ACE-CAL-(0[7-9]|1[0-5])$/.test(id),
)

describe('paused Facebook content queue', () => {
  it('keeps the live manifest and generator kill switch on', async () => {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
    const generator = await readFile(generatorPath, 'utf8')

    expect(manifest.killSwitch).toBe(true)
    expect(generator).toMatch(/killSwitch: true/)
  })

  it('requires fresh human review for every rebuilt future item', async () => {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
    const byId = new Map(manifest.items.map((item: { id: string }) => [item.id, item]))

    for (const id of provenanceReviewRequiredIds) {
      const item = byId.get(id) as Record<string, unknown> | undefined
      expect(item, `${id} is missing`).toBeDefined()
      expect(item?.status, id).toBe('draft')
      expect(item?.approvalStatus, id).toBe('review_required')
      expect(item?.reviewerId, id).toBeNull()
      expect(item?.approvalTimestamp, id).toBeNull()
      expect(item?.approvalExpiresAt, id).toBeNull()
      expect(item?.approvedContentHash, id).toBeNull()
    }
  })

  it('applies the same review gate to every rebuilt calendar item', async () => {
    const calendar = JSON.parse(await readFile(calendarPath, 'utf8'))
    const futurePosts = calendar.posts.filter((post: { id: string }) => post.id.startsWith('ACE-CAL-'))

    expect(futurePosts).toHaveLength(12)
    for (const post of futurePosts) {
      expect(post.status, post.id).toBe('draft')
      expect(post.approvalStatus, post.id).toBe('review_required')
    }
  })
})

describe('future Facebook brand voice', () => {
  it('uses practical, saveable and shareable captions without generic vocatives', async () => {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
    const selected = manifest.items.filter((item: { id: string }) => editorialReviewRequiredIds.includes(item.id))

    expect(selected).toHaveLength(editorialReviewRequiredIds.length)
    for (const item of selected) {
      const caption = String(item.captionMyanmar)
      const prose = caption
        .replace(/#\S+/g, '')
        .replace(/ACE Child Grow/g, '')

      expect(caption, item.id).toContain('သိမ်းထား')
      expect(caption, item.id).toContain('မျှဝေ')
      expect(caption, item.id).toContain('ACE Child Grow')
      expect(caption, item.id).not.toMatch(/မိဘတို့ရေ|ဖေဖေ\s*မေမေတို့ရေ|မိဘတို့/)
      expect(caption, item.id).not.toContain('နော်')
      expect(prose, item.id).not.toMatch(/[A-Za-z]/)
      expect(caption, item.id).not.toContain('မီးဖိုချောင်ဘေး')
    }
  })

  it('retains essential source safety guidance for the infant movement activities', async () => {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
    const byId = new Map(manifest.items.map((item: { id: string }) => [item.id, item]))
    const clapAndSing = byId.get('ACE-ACT-5M-05') as { captionMyanmar: string }

    expect(clapAndSing.captionMyanmar).toContain('လှုပ်ခါခြင်း')
    expect(clapAndSing.captionMyanmar).toContain('လေထဲပစ်တင်ခြင်း')
  })
})
