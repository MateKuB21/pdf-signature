'use client';

import React from 'react';
import type { SignatureItem, SignatureAsset } from '@/types';
import { ptsToPx } from '@/utils/coordinates';

interface StaticSignatureProps {
  item: SignatureItem;
  asset: SignatureAsset;
  scale: number;
}

const StaticSignature: React.FC<StaticSignatureProps> = React.memo(
  ({ item, asset, scale }) => {
    const xPx = ptsToPx(item.xPts, scale);
    const yPx = ptsToPx(item.yPts, scale);
    const wPx = ptsToPx(item.widthPts, scale);
    const hPx = ptsToPx(item.heightPts, scale);

    return (
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: wPx,
          height: hPx,
          transform: `translate(${xPx}px, ${yPx}px) rotate(${item.rotationDeg}deg)`,
          transformOrigin: 'center center',
          zIndex: item.zIndex,
          pointerEvents: 'none',
        }}
      >
        <img
          src={asset.dataUrl}
          alt={asset.name}
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            opacity: item.opacity,
          }}
        />
      </div>
    );
  },
);

StaticSignature.displayName = 'StaticSignature';

export default StaticSignature;
