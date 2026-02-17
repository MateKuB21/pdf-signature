import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';

export interface RenderHandle {
  promise: Promise<{ width: number; height: number }>;
  cancel: () => void;
}

/**
 * Render a single PDF page onto a canvas element.
 *
 * Uses `canvasContext` (with `canvas: null`) so that pdfjs-dist does NOT
 * create its own opaque context (alpha:false → black background).
 * Returns a handle with a cancellable promise so callers can abort
 * in-flight renders before starting a new one.
 */
export function renderPageToCanvas(
  pdfDoc: PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number,
): RenderHandle {
  let renderTask: RenderTask | null = null;
  let cancelled = false;

  const promise = (async () => {
    const page = await pdfDoc.getPage(pageNumber);
    if (cancelled) throw new Error('cancelled');

    const viewport = page.getViewport({ scale });
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (cancelled) throw new Error('cancelled');

    renderTask = page.render({
      canvas: null as unknown as HTMLCanvasElement,
      canvasContext: ctx,
      viewport,
    });

    await renderTask.promise;
    return { width: viewport.width, height: viewport.height };
  })();

  return {
    promise,
    cancel: () => {
      cancelled = true;
      try {
        renderTask?.cancel();
      } catch {
        /* already finished or cancelled */
      }
    },
  };
}
