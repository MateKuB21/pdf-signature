'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Typography, Empty } from 'antd';
import { List } from 'react-window';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useEditorStore } from '@/store/useEditorStore';
import { getScale } from '@/utils/coordinates';
import type { PdfMeta, SignatureAsset, SignatureItem } from '@/types';
import PageCanvas from './PageCanvas';
import StaticSignature from './StaticSignature';

const { Text } = Typography;

const CONTAINER_PADDING = 16;
const PAGE_GAP = 12;

interface RowExtraProps {
  pdfDoc: PDFDocumentProxy;
  pdfMeta: PdfMeta;
  pageWidthPx: number;
  pageHeightPx: number;
  scale: number;
  signatureItems: SignatureItem[];
  signatureAssets: SignatureAsset[];
}

function PageRow({
  index,
  style,
  pdfDoc,
  pdfMeta,
  pageWidthPx,
  pageHeightPx,
  scale,
  signatureItems,
  signatureAssets,
}: {
  index: number;
  style: React.CSSProperties;
  ariaAttributes: Record<string, unknown>;
} & RowExtraProps) {
  const pageNum = index + 1;

  return (
    <div style={style}>
      <div
        className="relative mx-auto shadow"
        style={{
          width: pageWidthPx,
          height: pageHeightPx,
          marginTop: PAGE_GAP / 2,
          marginBottom: PAGE_GAP / 2,
        }}
      >
        <PageCanvas pdfDoc={pdfDoc} pageNumber={pageNum} scale={scale} />

        <div className="absolute inset-0" style={{ zIndex: 5 }}>
          {signatureItems.map((item) => {
            const asset = signatureAssets.find((a) => a.id === item.assetId);
            if (!asset) return null;
            return (
              <StaticSignature
                key={item.id}
                item={item}
                asset={asset}
                scale={scale}
              />
            );
          })}
        </div>

        <div
          className="absolute bottom-1 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded"
          style={{ zIndex: 10 }}
        >
          {pageNum}/{pdfMeta.pageCount}
        </div>
      </div>
    </div>
  );
}

export default function PreviewPanel() {
  const { pdfMeta, pdfDoc, signatureAssets, signatureItems, zoom } =
    useEditorStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const measuredRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    containerRef.current = node;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect) {
        setContainerWidth(rect.width);
        setContainerHeight(rect.height);
      }
    });
    ro.observe(node);
    setContainerWidth(node.clientWidth);
    setContainerHeight(node.clientHeight);
  }, []);

  const scale = useMemo(() => {
    if (!pdfMeta || containerWidth === 0) return 1;
    const available = containerWidth - CONTAINER_PADDING * 2;
    return getScale(available, pdfMeta.pageWidthPts, zoom);
  }, [pdfMeta, containerWidth, zoom]);

  const pageHeightPx = pdfMeta ? pdfMeta.pageHeightPts * scale : 0;
  const pageWidthPx = pdfMeta ? pdfMeta.pageWidthPts * scale : 0;
  const itemSize = pageHeightPx + PAGE_GAP;

  const rowProps: RowExtraProps = useMemo(
    () => ({
      pdfDoc: pdfDoc!,
      pdfMeta: pdfMeta!,
      pageWidthPx,
      pageHeightPx,
      scale,
      signatureItems,
      signatureAssets,
    }),
    [pdfDoc, pdfMeta, pageWidthPx, pageHeightPx, scale, signatureItems, signatureAssets],
  );

  if (!pdfMeta || !pdfDoc) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <Empty description="ยังไม่มี PDF ให้ดูตัวอย่าง" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <Text strong className="text-sm">
          Preview — ทุกหน้า
        </Text>
        <Text type="secondary" className="text-xs">
          {pdfMeta.pageCount} หน้า
        </Text>
      </div>

      <div ref={measuredRef} className="flex-1 bg-gray-200 overflow-hidden">
        {containerHeight > 0 && (
          <List<RowExtraProps>
            style={{ padding: CONTAINER_PADDING }}
            rowComponent={PageRow}
            rowCount={pdfMeta.pageCount}
            rowHeight={itemSize}
            rowProps={rowProps}
            overscanCount={2}
          />
        )}
      </div>
    </div>
  );
}
