'use client';

import dynamic from 'next/dynamic';
import { Spin } from 'antd';

const PdfSignatureEditor = dynamic(
  () => import('@/components/PdfSignatureEditor'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spin size="large" />
      </div>
    ),
  },
);

export default function Page() {
  return <PdfSignatureEditor />;
}
