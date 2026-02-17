'use client';

import React, { useCallback } from 'react';
import {
  Button,
  Upload,
  Select,
  Switch,
  Space,
  message,
  Tooltip,
  Typography,
} from 'antd';
import {
  UploadOutlined,
  FileImageOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  SaveOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';
import { useEditorStore } from '@/store/useEditorStore';
import { usePdfJs } from '@/hooks/usePdfJs';
import { savePdf } from '@/utils/pdfSaver';

const { Text } = Typography;

// No file size limit

const ZOOM_OPTIONS = [
  { value: 0.5, label: '50%' },
  { value: 0.75, label: '75%' },
  { value: 1, label: '100%' },
  { value: 1.25, label: '125%' },
  { value: 1.5, label: '150%' },
  { value: 1.75, label: '175%' },
  { value: 2, label: '200%' },
];

export default function Toolbar() {
  const pdfjsLib = usePdfJs();
  const {
    pdfMeta,
    pdfArrayBuffer,
    signatureAssets,
    signatureItems,
    zoom,
    snapEnabled,
    setPdf,
    addAsset,
    addItem,
    setZoom,
    toggleSnap,
  } = useEditorStore();

  const [saving, setSaving] = React.useState(false);

  const handlePdfUpload = useCallback(
    async (file: File) => {
      if (file.type !== 'application/pdf') {
        message.error('กรุณาอัปโหลดไฟล์ PDF เท่านั้น');
        return false;
      }
      if (!pdfjsLib) {
        message.error('กำลังโหลด PDF engine กรุณารอสักครู่');
        return false;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        const arrayBufferForSave = arrayBuffer.slice(0);
        const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page1 = await doc.getPage(1);
        const vp = page1.getViewport({ scale: 1 });

        const nameBase = file.name.replace(/\.pdf$/i, '');

        setPdf(
          {
            file,
            fileNameBase: nameBase,
            pageCount: doc.numPages,
            pageWidthPts: vp.width,
            pageHeightPts: vp.height,
          },
          doc,
          arrayBufferForSave,
        );

        message.success(`โหลด "${file.name}" สำเร็จ (${doc.numPages} หน้า)`);
      } catch {
        message.error('ไม่สามารถอ่านไฟล์ PDF ได้');
      }

      return false;
    },
    [pdfjsLib, setPdf],
  );

  const handleSignatureUpload = useCallback(
    async (file: File) => {
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        message.error('กรุณาอัปโหลดรูปภาพ PNG หรือ JPG เท่านั้น');
        return false;
      }

      if (!pdfMeta) {
        message.error('กรุณาอัปโหลด PDF ก่อน');
        return false;
      }

      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const { naturalWidth, naturalHeight } = await new Promise<{
          naturalWidth: number;
          naturalHeight: number;
        }>((resolve, reject) => {
          const img = new Image();
          img.onload = () =>
            resolve({
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
            });
          img.onerror = reject;
          img.src = dataUrl;
        });

        const asset = addAsset({
          name: file.name,
          file,
          dataUrl,
          mimeType: file.type,
          naturalWidth,
          naturalHeight,
        });

        const targetWidth = pdfMeta.pageWidthPts * 0.25;
        const aspect = naturalHeight / naturalWidth;
        const targetHeight = targetWidth * aspect;

        addItem({
          assetId: asset.id,
          xPts: (pdfMeta.pageWidthPts - targetWidth) / 2,
          yPts: (pdfMeta.pageHeightPts - targetHeight) / 2,
          widthPts: targetWidth,
          heightPts: targetHeight,
          rotationDeg: 0,
        });

        message.success(`เพิ่มลายเซ็น "${file.name}" แล้ว`);
      } catch {
        message.error('ไม่สามารถอ่านรูปภาพได้');
      }

      return false;
    },
    [pdfMeta, addAsset, addItem],
  );

  const handleSave = useCallback(async () => {
    if (!pdfMeta || !pdfArrayBuffer || signatureItems.length === 0) return;

    setSaving(true);
    try {
      await savePdf(
        pdfArrayBuffer,
        signatureAssets,
        signatureItems,
        pdfMeta.pageHeightPts,
        pdfMeta.fileNameBase,
      );
      message.success('บันทึกไฟล์เรียบร้อย!');
    } catch {
      message.error('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  }, [pdfMeta, pdfArrayBuffer, signatureAssets, signatureItems]);

  const handleZoomIn = () => {
    const next = Math.min(zoom + 0.1, 2);
    setZoom(Math.round(next * 100) / 100);
  };

  const handleZoomOut = () => {
    const next = Math.max(zoom - 0.1, 0.5);
    setZoom(Math.round(next * 100) / 100);
  };

  const canSave = !!pdfMeta && signatureItems.length > 0;

  return (
    <div className="flex items-center gap-3 bg-white px-4 py-2 shadow-sm border-b border-gray-200 flex-wrap">
      {/* PDF Upload */}
      <Upload
        accept=".pdf"
        showUploadList={false}
        beforeUpload={(file) => handlePdfUpload(file as unknown as File)}
        maxCount={1}
      >
        <Button icon={<FilePdfOutlined />} type={pdfMeta ? 'default' : 'primary'}>
          {pdfMeta ? 'เปลี่ยน PDF' : 'อัปโหลด PDF'}
        </Button>
      </Upload>

      {/* PDF info */}
      {pdfMeta && (
        <Text type="secondary" className="text-xs max-w-[160px] truncate">
          {pdfMeta.file.name} ({pdfMeta.pageCount} หน้า)
        </Text>
      )}

      <div className="w-px h-6 bg-gray-300" />

      {/* Signature Upload */}
      <Upload
        accept=".png,.jpg,.jpeg"
        showUploadList={false}
        multiple
        beforeUpload={(file) => handleSignatureUpload(file as unknown as File)}
        disabled={!pdfMeta}
      >
        <Tooltip title={!pdfMeta ? 'อัปโหลด PDF ก่อน' : ''}>
          <Button icon={<FileImageOutlined />} disabled={!pdfMeta}>
            เพิ่มลายเซ็น
          </Button>
        </Tooltip>
      </Upload>

      {signatureAssets.length > 0 && (
        <Text type="secondary" className="text-xs">
          {signatureAssets.length} รูป, {signatureItems.length} รายการ
        </Text>
      )}

      <div className="w-px h-6 bg-gray-300" />

      {/* Zoom Controls */}
      <Space.Compact>
        <Button
          icon={<ZoomOutOutlined />}
          onClick={handleZoomOut}
          disabled={zoom <= 0.5}
          size="small"
        />
        <Select
          value={zoom}
          onChange={setZoom}
          options={ZOOM_OPTIONS}
          size="small"
          style={{ width: 80 }}
          popupMatchSelectWidth={false}
        />
        <Button
          icon={<ZoomInOutlined />}
          onClick={handleZoomIn}
          disabled={zoom >= 2}
          size="small"
        />
      </Space.Compact>

      <div className="w-px h-6 bg-gray-300" />

      {/* Snap Toggle */}
      <Space size="small">
        <Text className="text-xs">Snap</Text>
        <Switch size="small" checked={snapEnabled} onChange={toggleSnap} />
      </Space>

      <div className="flex-1" />

      {/* Save */}
      <Button
        type="primary"
        icon={<SaveOutlined />}
        onClick={handleSave}
        disabled={!canSave}
        loading={saving}
      >
        บันทึก PDF
      </Button>
    </div>
  );
}
