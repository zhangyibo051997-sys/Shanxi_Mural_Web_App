import type { ColoringRegion } from "@/data/coloringRegions";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`无法加载图片：${src}`));
    image.src = src;
  });
}

function drawRegion(
  ctx: CanvasRenderingContext2D,
  region: ColoringRegion,
  color: string,
  width: number,
  height: number
) {
  ctx.fillStyle = color;
  const path = region.svgPath;
  if (path) {
    const svgPath = new Path2D(path);
    ctx.save();
    ctx.scale(width, height);
    ctx.fill(svgPath);
    ctx.restore();
    return;
  }

  const shape = region.shape;
  if (!shape) return;
  ctx.beginPath();
  if (shape.type === "ellipse") {
    ctx.ellipse(
      shape.cx * width,
      shape.cy * height,
      shape.rx * width,
      shape.ry * height,
      0,
      0,
      Math.PI * 2
    );
  } else {
    ctx.rect(
      shape.x * width,
      shape.y * height,
      shape.w * width,
      shape.h * height
    );
  }
  ctx.fill();
}

export async function exportColoredArtwork(options: {
  lineArtUrl: string;
  paperColor?: string;
  regions: ColoringRegion[];
  regionColors: Record<string, string>;
}): Promise<HTMLCanvasElement> {
  const line = await loadImage(options.lineArtUrl);
  const width = line.naturalWidth;
  const height = line.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("无法创建画布");

  ctx.fillStyle = options.paperColor ?? "#E2DDD3";
  ctx.fillRect(0, 0, width, height);

  const paintOrder = [...options.regions].reverse();
  for (const region of paintOrder) {
    const color = options.regionColors[region.id];
    if (!color) continue;
    drawRegion(ctx, region, color, width, height);
  }

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(line, 0, 0, width, height);
  ctx.restore();

  return canvas;
}

export function canvasToPngDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/png");
}

export function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  link.click();
}
