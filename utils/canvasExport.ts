import { coloringArtwork } from "@/data/coloringArtwork";

export async function exportShareCard(options: {
  paintCanvas: HTMLCanvasElement;
  lineCanvas: HTMLCanvasElement;
  score: number;
  colorSimilarity: number;
  completion: number;
}): Promise<Blob> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#D2CABC";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#213338";
  ctx.font = "600 42px 'Noto Serif SC', serif";
  ctx.fillText(coloringArtwork.pageTitle, 64, 100);
  ctx.font = "500 22px 'IBM Plex Sans', sans-serif";
  ctx.fillStyle = "#213338";
  ctx.fillText(coloringArtwork.titleEn, 64, 140);

  const artW = W - 128;
  const artH = 820;
  const artX = 64;
  const artY = 180;

  ctx.fillStyle = "#E2DDD3";
  ctx.fillRect(artX, artY, artW, artH);

  const aspect = options.paintCanvas.width / options.paintCanvas.height;
  let dw = artW;
  let dh = artW / aspect;
  if (dh > artH) {
    dh = artH;
    dw = artH * aspect;
  }
  const dx = artX + (artW - dw) / 2;
  const dy = artY + (artH - dh) / 2;

  ctx.drawImage(options.paintCanvas, dx, dy, dw, dh);
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(options.lineCanvas, dx, dy, dw, dh);
  ctx.globalCompositeOperation = "source-over";

  ctx.strokeStyle = "rgb(33 51 56 / 20%)";
  ctx.strokeRect(artX, artY, artW, artH);

  ctx.fillStyle = "#213338";
  ctx.font = "400 28px 'Noto Serif SC', serif";
  ctx.fillText(coloringArtwork.title, 64, 1060);
  ctx.font = "500 20px 'IBM Plex Sans', sans-serif";
  ctx.fillStyle = "#B88C57";
  ctx.fillText(coloringArtwork.location, 64, 1100);

  ctx.fillStyle = "#A83826";
  ctx.font = "600 48px 'IBM Plex Sans', sans-serif";
  ctx.fillText(`综合评分 ${options.score}`, 64, 1180);
  ctx.font = "500 18px 'IBM Plex Sans', sans-serif";
  ctx.fillStyle = "#213338";
  ctx.fillText(
    `色彩相似度 ${options.colorSimilarity} · 完成度 ${options.completion}%`,
    64,
    1220
  );

  ctx.fillStyle = "rgb(33 51 56 / 68%)";
  ctx.font = "500 16px 'IBM Plex Sans', sans-serif";
  ctx.fillText("看见壁上山西 · 山西寺观壁画数字文化平台", 64, 1280);
  ctx.fillText(new Date().toLocaleDateString("zh-CN"), 64, 1310);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("export failed"))),
      "image/png",
      0.92
    );
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
