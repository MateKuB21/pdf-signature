export type PdfMeta = {
  file: File;
  fileNameBase: string;
  pageCount: number;
  pageWidthPts: number;
  pageHeightPts: number;
};

export type SignatureAsset = {
  id: string;
  name: string;
  file: File;
  dataUrl: string;
  mimeType: string;
  naturalWidth: number;
  naturalHeight: number;
};

export type SignatureItem = {
  id: string;
  assetId: string;
  xPts: number;
  yPts: number;
  widthPts: number;
  heightPts: number;
  rotationDeg: number;
  zIndex: number;
  opacity: number;
};
