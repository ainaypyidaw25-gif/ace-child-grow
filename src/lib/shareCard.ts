// Renders a square, social-media-ready PNG for a milestone keepsake: the
// child's photo plus a caption banner (child name, milestone, date, app
// wordmark). Canvas-only — there is no canvas polyfill in this repo's test
// environment, so this file is intentionally thin; testable copy logic lives
// in src/domain/share/shareCaption.ts instead.
import { formatShareCardDate } from '../domain/share/shareCaption';

const SIZE = 1080;
const MARGIN = 48;
const BANNER_HEIGHT = 300;
const FONT_STACK = "'Noto Sans Myanmar', 'Pyidaungsu', 'Myanmar Text', sans-serif";

// Fetch-then-decode (rather than an <img crossorigin> element) so a Convex
// storage URL that omits permissive CORS headers on the *image* response
// still works here as long as fetch() itself succeeds — the bitmap is
// decoded locally from an already-fetched blob, so the canvas is never
// tainted regardless of the origin's CORS policy on image requests.
async function loadImageBitmap(url: string): Promise<ImageBitmap> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Unable to load photo');
  const blob = await response.blob();
  return createImageBitmap(blob);
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: ImageBitmap,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;
  if (imgRatio > boxRatio) {
    sw = img.height * boxRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / boxRatio;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export interface MilestoneShareCardInput {
  photoUrl: string | null;
  childNickname: string;
  title: string;
  achievedAt: number;
  locale: 'mm' | 'en';
}

export async function renderMilestoneShareCard(input: MilestoneShareCardInput): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported on this device');

  const gradient = ctx.createLinearGradient(0, 0, 0, SIZE);
  gradient.addColorStop(0, '#1E5A52');
  gradient.addColorStop(1, '#123B36');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SIZE, SIZE);

  const photoBoxY = MARGIN;
  const photoBoxH = SIZE - BANNER_HEIGHT - MARGIN * 2;
  const photoBoxW = SIZE - MARGIN * 2;
  ctx.save();
  roundedRectPath(ctx, MARGIN, photoBoxY, photoBoxW, photoBoxH, 32);
  ctx.clip();
  if (input.photoUrl) {
    const img = await loadImageBitmap(input.photoUrl);
    drawCover(ctx, img, MARGIN, photoBoxY, photoBoxW, photoBoxH);
  } else {
    ctx.fillStyle = '#E7F5EF';
    ctx.fillRect(MARGIN, photoBoxY, photoBoxW, photoBoxH);
  }
  ctx.restore();

  const bannerY = SIZE - BANNER_HEIGHT;
  ctx.textAlign = 'center';

  ctx.font = `700 30px ${FONT_STACK}`;
  ctx.fillStyle = '#73C7A5';
  ctx.fillText('ACE Child Grow', SIZE / 2, bannerY + 56);

  ctx.font = `700 56px ${FONT_STACK}`;
  ctx.fillStyle = '#FBFAF5';
  const headline = `${input.childNickname} — ${input.title}`;
  const headlineLines = wrapText(ctx, headline, SIZE - MARGIN * 2).slice(0, 3);
  let lineY = bannerY + 120;
  for (const line of headlineLines) {
    ctx.fillText(line, SIZE / 2, lineY);
    lineY += 64;
  }

  ctx.font = `500 32px ${FONT_STACK}`;
  ctx.fillStyle = '#E7F5EF';
  ctx.fillText(formatShareCardDate(input.achievedAt, input.locale), SIZE / 2, SIZE - MARGIN);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Unable to render the image'))),
      'image/png',
      0.95,
    );
  });
}
