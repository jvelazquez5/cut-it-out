/*
 * Copyright 2025 Suvink
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { create } from 'zustand';

interface AppState {
    originalImage: string | null; // URL or base64
    processedImage: string | null; // URL or base64
    maskImage: string | null; // URL or base64 of the mask
    isProcessing: boolean;
    processingProgress: number; // 0-100
    error: string | null;

    // Editing State
    brushSize: number;
    brushMode: 'erase' | 'restore';
    zoom: number;
    pan: { x: number; y: number };

    // History
    history: string[]; // Array of maskImage URLs
    historyIndex: number;

    setOriginalImage: (image: string | null) => void;
    setProcessedImage: (image: string | null) => void;
    setMaskImage: (image: string | null) => void;
    setIsProcessing: (isProcessing: boolean) => void;
    setProcessingProgress: (progress: number) => void;
    setError: (error: string | null) => void;

    setBrushSize: (size: number) => void;
    setBrushMode: (mode: 'erase' | 'restore') => void;
    setZoom: (zoom: number) => void;
    setPan: (pan: { x: number; y: number }) => void;

    addToHistory: (maskImage: string) => void;
    undo: () => void;
    redo: () => void;

    reset: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
    originalImage: null,
    processedImage: null,
    maskImage: null,
    isProcessing: false,
    processingProgress: 0,
    error: null,

    brushSize: 50,
    brushMode: 'erase',
    zoom: 1,
    pan: { x: 0, y: 0 },

    history: [],
    historyIndex: -1,

    setOriginalImage: (image) => set({ originalImage: image, processedImage: null, maskImage: null, error: null, history: [], historyIndex: -1 }),
    setProcessedImage: (image) => {
        set({ processedImage: image, maskImage: image });
        // Initialize history with the first processed image
        if (image) {
            set({ history: [image], historyIndex: 0 });
        }
    },
    setMaskImage: (image) => set({ maskImage: image }),
    setIsProcessing: (isProcessing) => set({ isProcessing }),
    setProcessingProgress: (progress) => set({ processingProgress: progress }),
    setError: (error) => set({ error }),

    setBrushSize: (size) => set({ brushSize: size }),
    setBrushMode: (mode) => set({ brushMode: mode }),
    setZoom: (zoom) => set({ zoom }),
    setPan: (pan) => set({ pan }),

    addToHistory: (maskImage) => {
        const { history, historyIndex } = get();
        // Slice history if we are in the middle
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(maskImage);

        // Limit history size to 10 steps to save memory
        if (newHistory.length > 10) {
            newHistory.shift();
        }

        set({
            history: newHistory,
            historyIndex: newHistory.length - 1,
            maskImage: maskImage,
            processedImage: maskImage // Update processedImage to reflect current state
        });
    },

    undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            const prevImage = history[newIndex];
            set({
                historyIndex: newIndex,
                maskImage: prevImage,
                processedImage: prevImage
            });
        }
    },

    redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            const nextImage = history[newIndex];
            set({
                historyIndex: newIndex,
                maskImage: nextImage,
                processedImage: nextImage
            });
        }
    },

    reset: () => set({
        originalImage: null,
        processedImage: null,
        maskImage: null,
        isProcessing: false,
        processingProgress: 0,
        error: null,
        zoom: 1,
        pan: { x: 0, y: 0 },
        history: [],
        historyIndex: -1
    }),
}));
