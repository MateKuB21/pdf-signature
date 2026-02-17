'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Spin } from 'antd';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { renderPageToCanvas, type RenderHandle } from '@/utils/pdfRenderer';

interface PageCanvasProps {
  pdfDoc: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  className?: string;
  onRendered?: (dims: { width: number; height: number }) => void;
}

const PageCanvas: React.FC<PageCanvasProps> = React.memo(
  ({ pdfDoc, pageNumber, scale, className, onRendered }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loading, setLoading] = useState(true);
    const handleRef = useRef<RenderHandle | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !pdfDoc) return;

      handleRef.current?.cancel();
      handleRef.current = null;

      setLoading(true);

      const handle = renderPageToCanvas(pdfDoc, pageNumber, canvas, scale);
      handleRef.current = handle;

      handle.promise
        .then((dims) => {
          if (handleRef.current !== handle) return;
          setLoading(false);
          onRendered?.(dims);
        })
        .catch(() => {
          if (handleRef.current !== handle) return;
          setLoading(false);
        });

      return () => {
        handle.cancel();
      };
    }, [pdfDoc, pageNumber, scale, onRendered]);

    return (
      <div className={`relative inline-block ${className ?? ''}`}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
            <Spin size="small" />
          </div>
        )}
        <canvas ref={canvasRef} className="block" />
      </div>
    );
  },
);

PageCanvas.displayName = 'PageCanvas';

export default PageCanvas;
