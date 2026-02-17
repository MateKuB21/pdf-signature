import { PDFDocument, degrees } from 'pdf-lib';
import type { SignatureAsset, SignatureItem } from '@/types';
import { toBottomLeftY } from './coordinates';

export async function savePdf(
  pdfArrayBuffer: ArrayBuffer,
  assets: SignatureAsset[],
  items: SignatureItem[],
  pageHeightPts: number,
  fileName: string,
): Promise<void> {
  const pdfDoc = await PDFDocument.load(pdfArrayBuffer);

  const embeddedImages = new Map<string, Awaited<ReturnType<typeof pdfDoc.embedPng>>>();

  for (const asset of assets) {
    const usedByItem = items.some((i) => i.assetId === asset.id);
    if (!usedByItem) continue;

    const imgBytes = await asset.file.arrayBuffer();
    const img = asset.mimeType.includes('png')
      ? await pdfDoc.embedPng(imgBytes)
      : await pdfDoc.embedJpg(imgBytes);
    embeddedImages.set(asset.id, img);
  }

  const pages = pdfDoc.getPages();

  for (const page of pages) {
    for (const item of items) {
      const img = embeddedImages.get(item.assetId);
      if (!img) continue;

      const yBL = toBottomLeftY(item.yPts, item.heightPts, pageHeightPts);

      if (item.rotationDeg === 0) {
        page.drawImage(img, {
          x: item.xPts,
          y: yBL,
          width: item.widthPts,
          height: item.heightPts,
          opacity: item.opacity,
        });
      } else {
        const cx = item.xPts + item.widthPts / 2;
        const cy = yBL + item.heightPts / 2;
        const rad = (-item.rotationDeg * Math.PI) / 180;

        const halfW = item.widthPts / 2;
        const halfH = item.heightPts / 2;
        const cosR = Math.cos(rad);
        const sinR = Math.sin(rad);
        const drawX = cx - halfW * cosR + halfH * sinR;
        const drawY = cy - halfW * sinR - halfH * cosR;

        page.drawImage(img, {
          x: drawX,
          y: drawY,
          width: item.widthPts,
          height: item.heightPts,
          rotate: degrees(-item.rotationDeg),
          opacity: item.opacity,
        });
      }
    }
  }

  const savedBytes = await pdfDoc.save();
  const blob = new Blob([new Uint8Array(savedBytes)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}-edit.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
