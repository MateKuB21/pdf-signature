'use client';

import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { PdfMeta, SignatureAsset, SignatureItem } from '@/types';

interface EditorState {
  /* PDF */
  pdfMeta: PdfMeta | null;
  pdfDoc: PDFDocumentProxy | null;
  pdfArrayBuffer: ArrayBuffer | null;

  /* Signatures */
  signatureAssets: SignatureAsset[];
  signatureItems: SignatureItem[];

  /* UI */
  selectedItemId: string | null;
  zoom: number;
  snapEnabled: boolean;

  /* Actions */
  setPdf: (
    meta: PdfMeta,
    doc: PDFDocumentProxy,
    arrayBuffer: ArrayBuffer,
  ) => void;
  resetPdf: () => void;

  addAsset: (asset: Omit<SignatureAsset, 'id'>) => SignatureAsset;
  removeAsset: (id: string) => void;

  addItem: (item: Omit<SignatureItem, 'id' | 'zIndex' | 'opacity'>) => void;
  updateItem: (id: string, patch: Partial<SignatureItem>) => void;
  removeItem: (id: string) => void;
  duplicateItem: (id: string) => void;

  selectItem: (id: string | null) => void;
  deselectAll: () => void;

  setZoom: (zoom: number) => void;
  toggleSnap: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  pdfMeta: null,
  pdfDoc: null,
  pdfArrayBuffer: null,

  signatureAssets: [],
  signatureItems: [],

  selectedItemId: null,
  zoom: 1,
  snapEnabled: false,

  setPdf: (meta, doc, arrayBuffer) =>
    set({
      pdfMeta: meta,
      pdfDoc: doc,
      pdfArrayBuffer: arrayBuffer,
      signatureItems: [],
      selectedItemId: null,
    }),

  resetPdf: () =>
    set({
      pdfMeta: null,
      pdfDoc: null,
      pdfArrayBuffer: null,
      signatureItems: [],
      selectedItemId: null,
    }),

  addAsset: (assetData) => {
    const asset: SignatureAsset = { ...assetData, id: nanoid() };
    set((s) => ({ signatureAssets: [...s.signatureAssets, asset] }));
    return asset;
  },

  removeAsset: (id) =>
    set((s) => ({
      signatureAssets: s.signatureAssets.filter((a) => a.id !== id),
      signatureItems: s.signatureItems.filter((i) => i.assetId !== id),
    })),

  addItem: (itemData) => {
    const maxZ = get().signatureItems.reduce(
      (max, i) => Math.max(max, i.zIndex),
      0,
    );
    const item: SignatureItem = {
      ...itemData,
      id: nanoid(),
      zIndex: maxZ + 1,
      opacity: 1,
    };
    set((s) => ({
      signatureItems: [...s.signatureItems, item],
      selectedItemId: item.id,
    }));
  },

  updateItem: (id, patch) =>
    set((s) => ({
      signatureItems: s.signatureItems.map((i) =>
        i.id === id ? { ...i, ...patch } : i,
      ),
    })),

  removeItem: (id) =>
    set((s) => ({
      signatureItems: s.signatureItems.filter((i) => i.id !== id),
      selectedItemId: s.selectedItemId === id ? null : s.selectedItemId,
    })),

  duplicateItem: (id) => {
    const state = get();
    const item = state.signatureItems.find((i) => i.id === id);
    if (!item) return;
    const maxZ = state.signatureItems.reduce(
      (max, i) => Math.max(max, i.zIndex),
      0,
    );
    const dup: SignatureItem = {
      ...item,
      id: nanoid(),
      xPts: item.xPts + 20,
      yPts: item.yPts + 20,
      zIndex: maxZ + 1,
    };
    set((s) => ({
      signatureItems: [...s.signatureItems, dup],
      selectedItemId: dup.id,
    }));
  },

  selectItem: (id) => set({ selectedItemId: id }),
  deselectAll: () => set({ selectedItemId: null }),

  setZoom: (zoom) => set({ zoom }),
  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),
}));
