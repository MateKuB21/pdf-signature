'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Button, Tooltip } from 'antd';
import { DeleteOutlined, CopyOutlined } from '@ant-design/icons';
import type { SignatureItem, SignatureAsset } from '@/types';
import { useEditorStore } from '@/store/useEditorStore';
import { ptsToPx, pxToPts, clamp } from '@/utils/coordinates';

interface InteractiveSignatureProps {
  item: SignatureItem;
  asset: SignatureAsset;
  scale: number;
  pageWidthPts: number;
  pageHeightPts: number;
  isSelected: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

type DragMode =
  | 'move'
  | 'resize-tl'
  | 'resize-tr'
  | 'resize-bl'
  | 'resize-br'
  | 'rotate'
  | null;

const HANDLE_SIZE = 10;
const ROTATE_HANDLE_OFFSET = 28;

const InteractiveSignature: React.FC<InteractiveSignatureProps> = ({
  item,
  asset,
  scale,
  pageWidthPts,
  pageHeightPts,
  isSelected,
  containerRef,
}) => {
  const { updateItem, removeItem, duplicateItem, selectItem } =
    useEditorStore();

  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [rotationTooltip, setRotationTooltip] = useState<string | null>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origXPts: number;
    origYPts: number;
    origWPts: number;
    origHPts: number;
    origRotDeg: number;
    aspect: number;
  } | null>(null);

  const xPx = ptsToPx(item.xPts, scale);
  const yPx = ptsToPx(item.yPts, scale);
  const wPx = ptsToPx(item.widthPts, scale);
  const hPx = ptsToPx(item.heightPts, scale);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, mode: DragMode) => {
      e.stopPropagation();
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      selectItem(item.id);
      setDragMode(mode);

      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origXPts: item.xPts,
        origYPts: item.yPts,
        origWPts: item.widthPts,
        origHPts: item.heightPts,
        origRotDeg: item.rotationDeg,
        aspect: item.heightPts / item.widthPts,
      };
    },
    [item, selectItem],
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragMode || !dragRef.current) return;
      const d = dragRef.current;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;

      if (dragMode === 'move') {
        const newXPts = clamp(
          d.origXPts + pxToPts(dx, scale),
          0,
          pageWidthPts - d.origWPts,
        );
        const newYPts = clamp(
          d.origYPts + pxToPts(dy, scale),
          0,
          pageHeightPts - d.origHPts,
        );
        updateItem(item.id, { xPts: newXPts, yPts: newYPts });
      } else if (dragMode.startsWith('resize')) {
        const minSizePts = 20;
        let newWPts = d.origWPts;
        let newXPts = d.origXPts;
        let newYPts = d.origYPts;

        const dxPts = pxToPts(dx, scale);

        if (dragMode === 'resize-br') {
          newWPts = Math.max(minSizePts, d.origWPts + dxPts);
        } else if (dragMode === 'resize-bl') {
          newWPts = Math.max(minSizePts, d.origWPts - dxPts);
          newXPts = d.origXPts + (d.origWPts - newWPts);
        } else if (dragMode === 'resize-tr') {
          newWPts = Math.max(minSizePts, d.origWPts + dxPts);
          const oldH = d.origHPts;
          const newH = newWPts * d.aspect;
          newYPts = d.origYPts - (newH - oldH);
        } else if (dragMode === 'resize-tl') {
          newWPts = Math.max(minSizePts, d.origWPts - dxPts);
          newXPts = d.origXPts + (d.origWPts - newWPts);
          const oldH = d.origHPts;
          const newH = newWPts * d.aspect;
          newYPts = d.origYPts - (newH - oldH);
        }

        const newHPts = newWPts * d.aspect;

        newXPts = clamp(newXPts, 0, pageWidthPts - newWPts);
        newYPts = clamp(newYPts, 0, pageHeightPts - newHPts);

        updateItem(item.id, {
          xPts: newXPts,
          yPts: newYPts,
          widthPts: newWPts,
          heightPts: newHPts,
        });
      } else if (dragMode === 'rotate') {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const cxPx = ptsToPx(d.origXPts + d.origWPts / 2, scale);
        const cyPx = ptsToPx(d.origYPts + d.origHPts / 2, scale);

        const angle =
          (Math.atan2(
            e.clientY - (rect.top + cyPx),
            e.clientX - (rect.left + cxPx),
          ) *
            180) /
            Math.PI +
          90;

        const normalized = ((angle % 360) + 360) % 360;
        const snapped = Math.round(normalized);

        updateItem(item.id, { rotationDeg: snapped });
        setRotationTooltip(`${snapped}°`);
      }
    },
    [
      dragMode,
      item.id,
      scale,
      pageWidthPts,
      pageHeightPts,
      updateItem,
      containerRef,
    ],
  );

  const handlePointerUp = useCallback(() => {
    setDragMode(null);
    dragRef.current = null;
    setRotationTooltip(null);
  }, []);

  useEffect(() => {
    if (dragMode) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [dragMode, handlePointerMove, handlePointerUp]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectItem(item.id);
  };

  const cornerCursor = (corner: string) => {
    switch (corner) {
      case 'tl':
        return 'nwse-resize';
      case 'tr':
        return 'nesw-resize';
      case 'bl':
        return 'nesw-resize';
      case 'br':
        return 'nwse-resize';
      default:
        return 'default';
    }
  };

  const corners: Array<{ key: DragMode; top: number; left: number }> = [
    { key: 'resize-tl', top: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2 },
    {
      key: 'resize-tr',
      top: -HANDLE_SIZE / 2,
      left: wPx - HANDLE_SIZE / 2,
    },
    {
      key: 'resize-bl',
      top: hPx - HANDLE_SIZE / 2,
      left: -HANDLE_SIZE / 2,
    },
    {
      key: 'resize-br',
      top: hPx - HANDLE_SIZE / 2,
      left: wPx - HANDLE_SIZE / 2,
    },
  ];

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: wPx,
        height: hPx,
        transform: `translate(${xPx}px, ${yPx}px) rotate(${item.rotationDeg}deg)`,
        transformOrigin: 'center center',
        zIndex: item.zIndex,
        cursor: dragMode === 'move' ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      {/* Signature image */}
      <img
        src={asset.dataUrl}
        alt={asset.name}
        draggable={false}
        onPointerDown={(e) => handlePointerDown(e, 'move')}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          pointerEvents: 'auto',
        }}
      />

      {/* Selection bounding box + handles */}
      {isSelected && (
        <>
          {/* Bounding box */}
          <div
            style={{
              position: 'absolute',
              inset: -2,
              border: '2px solid #1677ff',
              borderRadius: 2,
              pointerEvents: 'none',
            }}
          />

          {/* Corner resize handles */}
          {corners.map((c) => (
            <div
              key={c.key}
              onPointerDown={(e) => handlePointerDown(e, c.key)}
              style={{
                position: 'absolute',
                top: c.top,
                left: c.left,
                width: HANDLE_SIZE,
                height: HANDLE_SIZE,
                background: '#fff',
                border: '2px solid #1677ff',
                borderRadius: 2,
                cursor: cornerCursor(c.key!.replace('resize-', '')),
                zIndex: 10,
              }}
            />
          ))}

          {/* Rotate handle line + circle */}
          <div
            style={{
              position: 'absolute',
              top: -ROTATE_HANDLE_OFFSET,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 1,
              height: ROTATE_HANDLE_OFFSET - HANDLE_SIZE / 2,
              background: '#1677ff',
              pointerEvents: 'none',
            }}
          />
          <div
            onPointerDown={(e) => handlePointerDown(e, 'rotate')}
            style={{
              position: 'absolute',
              top: -ROTATE_HANDLE_OFFSET - HANDLE_SIZE / 2,
              left: '50%',
              transform: 'translateX(-50%)',
              width: HANDLE_SIZE + 4,
              height: HANDLE_SIZE + 4,
              background: '#1677ff',
              borderRadius: '50%',
              cursor: 'crosshair',
              zIndex: 10,
            }}
          />

          {/* Rotation tooltip */}
          {rotationTooltip && (
            <div
              style={{
                position: 'absolute',
                top: -ROTATE_HANDLE_OFFSET - 32,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.75)',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 11,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
              }}
            >
              {rotationTooltip}
            </div>
          )}

          {/* Mini action bar */}
          <div
            className="flex items-center gap-1"
            style={{
              position: 'absolute',
              bottom: -32,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 20,
            }}
          >
            <Tooltip title="ลบ">
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  removeItem(item.id);
                }}
              />
            </Tooltip>
            <Tooltip title="ทำซ้ำ">
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateItem(item.id);
                }}
              />
            </Tooltip>
          </div>
        </>
      )}
    </div>
  );
};

export default InteractiveSignature;
