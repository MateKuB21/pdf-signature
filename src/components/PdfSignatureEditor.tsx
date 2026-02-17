'use client';

import React from 'react';
import { ConfigProvider, App as AntApp } from 'antd';
import thTH from 'antd/locale/th_TH';
import Toolbar from './Toolbar';
import EditorPanel from './EditorPanel';
import PreviewPanel from './PreviewPanel';

export default function PdfSignatureEditor() {
  return (
    <ConfigProvider
      locale={thTH}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
        },
      }}
    >
      <AntApp>
        <div className="flex flex-col h-screen w-screen overflow-hidden">
          {/* Top Toolbar */}
          <Toolbar />

          {/* 2-Column Layout */}
          <div className="flex flex-1 min-h-0">
            <EditorPanel />
            <PreviewPanel />
          </div>
        </div>
      </AntApp>
    </ConfigProvider>
  );
}
