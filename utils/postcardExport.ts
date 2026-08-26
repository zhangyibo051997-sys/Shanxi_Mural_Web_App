import type { Locale } from "@/lib/i18n/locales";
import { canvasToPngDataUrl } from "@/utils/coloringExport";

const POSTCARD_WIDTH = 1080;
const POSTCARD_HEIGHT = 1350;

/** 与封面 BrandHeader 一致：中文用 zh 字标，英/意用 en 字标 */
export function postcardLogoSrc(locale: Locale): string {
  return locale === "zh"
    ? "/images/cover-logo-zh.png"
    : "/images/cover-logo-en.png";
}

/** 明信片翻转背面：中文版 / 英文版完整背面模板 */
export function postcardBackSrc(locale: Locale): string {
  return locale === "zh"
    ? "/images/postcards/back-zh.png"
    : "/images/postcards/back-en.png";
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`无法加载图片：${src}`));
    image.src = src;
  });
}

function drawContainedImage(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  x: number,
  y: number,
  boxW: number,
  boxH: number,
  sourceW: number,
  sourceH: number
) {
  const scale = Math.min(boxW / sourceW, boxH / sourceH);
  const drawW = sourceW * scale;
  const drawH = sourceH * scale;
  const dx = x + (boxW - drawW) / 2;
  const dy = y + (boxH - drawH) / 2;
  ctx.drawImage(image, dx, dy, drawW, drawH);
}

function drawBrandLogo(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement,
  x: number,
  y: number,
  maxH: number,
  maxW: number
) {
  const naturalW = logo.naturalWidth || logo.width;
  const naturalH = logo.naturalHeight || logo.height;
  if (!naturalW || !naturalH) return 0;

  const scale = Math.min(maxH / naturalH, maxW / naturalW);
  const drawW = naturalW * scale;
  const drawH = naturalH * scale;
  ctx.drawImage(logo, x, y, drawW, drawH);
  return drawH;
}

export async function exportColoringPostcard(options: {
  artworkCanvas: HTMLCanvasElement;
  title: string;
  figureName: string;
  templeName: string;
  stars: number;
  createdAt: Date;
  siteLabel?: string;
  locale?: Locale;
  heading?: string;
}): Promise<string> {
  const locale = options.locale ?? "zh";
  const canvas = document.createElement("canvas");
  canvas.width = POSTCARD_WIDTH;
  canvas.height = POSTCARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("无法创建明信片画布");

  ctx.fillStyle = "#E2DDD3";
  ctx.fillRect(0, 0, POSTCARD_WIDTH, POSTCARD_HEIGHT);

  ctx.fillStyle = "rgb(33 51 56 / 4%)";
  ctx.fillRect(48, 48, POSTCARD_WIDTH - 96, POSTCARD_HEIGHT - 96);

  let contentTop = 168;
  try {
    const logo = await loadImage(postcardLogoSrc(locale));
    const logoH = drawBrandLogo(ctx, logo, 72, 72, 64, 360);
    contentTop = Math.max(168, 72 + logoH + 36);
  } catch {
    /* logo 加载失败时仍输出明信片 */
  }

  ctx.fillStyle = "#213338";
  ctx.font = "600 42px 'Noto Serif SC', serif";
  ctx.fillText(options.heading ?? "COLOR THE MURAL", 72, contentTop);
  ctx.font = "22px 'Noto Serif SC', serif";
  ctx.fillStyle = "#B88C57";
  ctx.fillText(
    `${options.templeName} · ${options.figureName}`,
    72,
    contentTop + 40
  );

  const artTop = contentTop + 72;
  drawContainedImage(
    ctx,
    options.artworkCanvas,
    72,
    artTop,
    POSTCARD_WIDTH - 144,
    Math.max(640, 1140 - artTop - 24),
    options.artworkCanvas.width,
    options.artworkCanvas.height
  );

  const starText = `${"★".repeat(options.stars)}${"☆".repeat(5 - options.stars)}  ${options.stars} / 5`;
  ctx.fillStyle = "#B88C57";
  ctx.font = "28px serif";
  ctx.fillText(starText, 72, 1148);

  ctx.fillStyle = "rgb(33 51 56 / 68%)";
  ctx.font = "500 16px 'IBM Plex Sans', sans-serif";
  const date = options.createdAt.toISOString().slice(0, 10);
  ctx.fillText(date, 72, 1188);
  ctx.fillText(options.siteLabel ?? "murals of shanxi", 72, 1218);

  ctx.strokeStyle = "rgba(38, 36, 31, 0.18)";
  ctx.strokeRect(POSTCARD_WIDTH - 168, 1168, 88, 88);

  return canvasToPngDataUrl(canvas);
}
