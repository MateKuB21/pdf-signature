'use client';

import { useEffect, useState } from 'react';

type PdfJsLib = typeof import('pdfjs-dist');

let cachedLib: PdfJsLib | null = null;

export function usePdfJs(): PdfJsLib | null {
  const [lib, setLib] = useState<PdfJsLib | null>(cachedLib);

  useEffect(() => {
    if (cachedLib) {
      setLib(cachedLib);
      return;
    }

    let cancelled = false;

    import('pdfjs-dist/webpack.mjs').then((mod) => {
      if (cancelled) return;
      cachedLib = mod as unknown as PdfJsLib;
      setLib(cachedLib);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return lib;
}
