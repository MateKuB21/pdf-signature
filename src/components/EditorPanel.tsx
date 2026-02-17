'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Typography, Empty } from 'antd';
import { useEditorStore } from '@/store/useEditorStore';
import { getScale } from '@/utils/coordinates';
import PageCanvas from './PageCanvas';
import InteractiveSignature from './InteractiveSignature';

const { Text } = Typography;

const CONTAINER_PADDING = 24;

export default function EditorPanel() {
  const {
    pdfMeta,
    pdfDoc,
    signatureAssets,
    signatureItems,
    selectedItemId,
    zoom,
    deselectAll,
  } = useEditorStore();

  const outerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const measuredRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    outerRef.current = node;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setContainerWidth(w);
    });
    ro.observe(node);
    setContainerWidth(node.clientWidth);
  }, []);

  const scale = useMemo(() => {
    if (!pdfMeta || containerWidth === 0) return 1;
    const available = containerWidth - CONTAINER_PADDING * 2;
    return getScale(available, pdfMeta.pageWidthPts, zoom);
  }, [pdfMeta, containerWidth, zoom]);

  const canvasWidth = pdfMeta ? pdfMeta.pageWidthPts * scale : 0;
  const canvasHeight = pdfMeta ? pdfMeta.pageHeightPts * scale : 0;

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      deselectAll();
    }
  };

  if (!pdfMeta || !pdfDoc) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 border-r border-gray-200">
        <Empty description="อัปโหลดไฟล์ PDF เพื่อเริ่มแก้ไข" />
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex flex-col border-r border-gray-200 min-w-0"
    >
      <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <Text strong className="text-sm">
          Editor — หน้า 1
        </Text>
        <Text type="secondary" className="text-xs">
          {Math.round(canvasWidth)} × {Math.round(canvasHeight)} px
        </Text>
      </div>

      <div
        ref={measuredRef}
        className="flex-1 overflow-auto bg-gray-100"
        style={{ padding: CONTAINER_PADDING }}
      >
        <div
          ref={wrapperRef}
          className="relative mx-auto shadow-lg"
          style={{
            width: canvasWidth,
            height: canvasHeight,
          }}
          onClick={handleCanvasClick}
        >
          {/* PDF Page 1 */}
          <PageCanvas
            pdfDoc={pdfDoc}
            pageNumber={1}
            scale={scale}
          />

          {/* Interactive signature overlay */}
          <div
            className="absolute inset-0"
            style={{ zIndex: 5 }}
            onClick={handleCanvasClick}
          >
            {signatureItems.map((item) => {
              const asset = signatureAssets.find((a) => a.id === item.assetId);
              if (!asset) return null;
              return (
                <InteractiveSignature
                  key={item.id}
                  item={item}
                  asset={asset}
                  scale={scale}
                  pageWidthPts={pdfMeta.pageWidthPts}
                  pageHeightPts={pdfMeta.pageHeightPts}
                  isSelected={selectedItemId === item.id}
                  containerRef={wrapperRef}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
