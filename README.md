# pdf-signature

แอปเว็บสำหรับใส่ลายเซ็น (รูปภาพ) ลงในไฟล์ PDF — อัปโหลด PDF, เพิ่มลายเซ็นจากรูป, วางและปรับตำแหน่งบนแต่ละหน้า, แล้วบันทึกเป็น PDF ใหม่

## ฟีเจอร์หลัก

- **อัปโหลด PDF** — รองรับไฟล์ขนาดไม่เกิน 200MB
- **เพิ่มลายเซ็นจากรูป** — อัปโหลดไฟล์รูปใช้เป็นลายเซ็น (Signature Asset)
- **วางและแก้ไขบนหน้า PDF** — ลาก, ปรับขนาด, หมุนลายเซ็นบนหน้า PDF (EditorPanel + PageCanvas)
- **ซูมและ Snap** — ซูมหน้า 50%–200%, เปิด/ปิด Snap
- **บันทึก PDF** — export เป็น PDF ที่มีลายเซ็นแล้ว (ใช้ pdf-lib)

## เทคโนโลยีที่ใช้

- **Framework:** Next.js 16, React 19
- **UI:** Ant Design (locale ไทย), Tailwind CSS
- **PDF:** pdf-lib, pdfjs-dist
- **State:** Zustand (`src/store/useEditorStore.ts`)
- อื่นๆ: nanoid, react-window

## การรันโปรเจกต์

```bash
yarn dev
# หรือ
npm run dev
# หรือ
pnpm dev
```

เปิดเบราว์เซอร์ที่ [http://localhost:40000](http://localhost:40000) (แอปรันที่ port 40000)

## การ deploy (GitHub Pages)

แอปนี้ deploy ผ่าน GitHub Actions ไปยัง GitHub Pages เมื่อ push ขึ้น branch `main`

- **Live demo:** https://\<username\>.github.io/pdf-signature/  
  (แทน \<username\> ด้วยชื่อ GitHub ของคุณ)

หลัง push แล้ว ไปที่ repo → **Settings → Pages** → **Build and deployment** เลือก **Source:** GitHub Actions

## โครงสร้างโปรเจกต์

- `src/app/` — หน้า Next.js (page, layout)
- `src/components/` — PdfSignatureEditor, Toolbar, EditorPanel, PreviewPanel, PageCanvas, InteractiveSignature, StaticSignature
- `src/store/` — Zustand store สำหรับ PDF, signature assets/items, UI state
- `src/utils/` — pdfRenderer, pdfSaver, coordinates
- `src/hooks/` — usePdfJs
- `src/types/` — PdfMeta, SignatureAsset, SignatureItem
