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

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Loader2, Download, X, ZoomIn, ZoomOut, Minus, Plus, Undo, Redo } from 'lucide-react';
import clsx from 'clsx';

export const CanvasViewer: React.FC = () => {
    const originalImage = useAppStore((state) => state.originalImage);
    const processedImage = useAppStore((state) => state.processedImage);
    const isProcessing = useAppStore((state) => state.isProcessing);
    const reset = useAppStore((state) => state.reset);

    // Editing state
    const brushSize = useAppStore((state) => state.brushSize);
    const brushMode = useAppStore((state) => state.brushMode);
    const zoom = useAppStore((state) => state.zoom);
    const pan = useAppStore((state) => state.pan);

    // History
    const history = useAppStore((state) => state.history);
    const historyIndex = useAppStore((state) => state.historyIndex);
    const addToHistory = useAppStore((state) => state.addToHistory);
    const undo = useAppStore((state) => state.undo);
    const redo = useAppStore((state) => state.redo);

    const setBrushSize = useAppStore((state) => state.setBrushSize);
    const setBrushMode = useAppStore((state) => state.setBrushMode);
    const setZoom = useAppStore((state) => state.setZoom);
    const setPan = useAppStore((state) => state.setPan);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cursorCanvasRef = useRef<HTMLCanvasElement>(null);
    const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const selectionCanvasRef = useRef<HTMLCanvasElement | null>(null); // New: For painting selection
    const containerRef = useRef<HTMLDivElement>(null);

    const [isDragging, setIsDragging] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
    const [cursorPos, setCursorPos] = useState<{ x: number, y: number } | null>(null);

    // Load images
    const [imgObj, setImgObj] = useState<HTMLImageElement | null>(null);

    // Initialize
    useEffect(() => {
        if (originalImage) {
            const img = new Image();
            img.src = originalImage;
            img.onload = () => {
                setImgObj(img);

                // Initialize offscreen canvas (edited image)
                const osc = document.createElement('canvas');
                osc.width = img.width;
                osc.height = img.height;
                const ctx = osc.getContext('2d');
                if (ctx) ctx.drawImage(img, 0, 0);
                offscreenCanvasRef.current = osc;

                // Initialize selection canvas (mask)
                const sc = document.createElement('canvas');
                sc.width = img.width;
                sc.height = img.height;
                selectionCanvasRef.current = sc;
            };
        }
    }, [originalImage]);

    // Sync Offscreen Canvas with History
    useEffect(() => {
        if (history.length > 0 && historyIndex >= 0 && historyIndex < history.length) {
            const imgSrc = history[historyIndex];
            const img = new Image();
            img.src = imgSrc;
            img.onload = () => {
                const osc = offscreenCanvasRef.current;
                if (osc) {
                    const ctx = osc.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(0, 0, osc.width, osc.height);
                        ctx.drawImage(img, 0, 0);
                        render();
                    }
                }
            };
        }
    }, [history, historyIndex]);

    // Update offscreen canvas when processed image arrives
    useEffect(() => {
        if (processedImage && imgObj) {
            const img = new Image();
            img.src = processedImage;
            img.onload = () => {
                const osc = offscreenCanvasRef.current;
                if (osc) {
                    const ctx = osc.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(0, 0, osc.width, osc.height);
                        ctx.drawImage(img, 0, 0);
                        render();
                    }
                }
            };
        }
    }, [processedImage, imgObj]);

    // Main Render Function
    const render = useCallback(() => {
        const canvas = canvasRef.current;
        const osc = offscreenCanvasRef.current;
        const sc = selectionCanvasRef.current;
        if (!canvas || !osc || !imgObj) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Match dimensions
        if (canvas.width !== imgObj.width) canvas.width = imgObj.width;
        if (canvas.height !== imgObj.height) canvas.height = imgObj.height;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Draw Ghost Overlay (Bottom Layer)
        // Only visible in Restore Mode. Drawn first so it appears behind the edited image.
        if (brushMode === 'restore') {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.filter = 'opacity(0.3)';
            ctx.drawImage(imgObj, 0, 0);
            ctx.restore();
        }

        // 2. Draw Current Edited Image (Middle Layer)
        // Drawn normally. Transparent pixels will show the Ghost layer behind.
        ctx.drawImage(osc, 0, 0);

        // 3. Draw Selection Overlay (Top Layer)
        if (sc && isDragging) {
            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.drawImage(sc, 0, 0);
            ctx.restore();
        }

    }, [imgObj, brushMode, isDragging]);

    // Re-render when modes change or initial load completes
    useEffect(() => {
        render();
    }, [render]);

    // Helper: Color Distance
    const colorDistance = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) => {
        return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
    };

    // Handle Painting Selection
    const paintSelection = (e: React.MouseEvent) => {
        const sc = selectionCanvasRef.current;
        const canvas = canvasRef.current;
        if (!sc || !canvas || !imgObj) return;

        const ctx = sc.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        ctx.beginPath();
        ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = brushMode === 'erase' ? '#ef4444' : '#22c55e'; // Red for erase, Green for restore
        ctx.fill();

        render();
    };

    // Apply Smart Logic on Mouse Up
    const applySmartSelection = () => {
        const osc = offscreenCanvasRef.current;
        const sc = selectionCanvasRef.current;
        const canvas = canvasRef.current;

        if (!osc || !sc || !canvas || !imgObj) return;

        const ctx = osc.getContext('2d');
        const scCtx = sc.getContext('2d');
        if (!ctx || !scCtx) return;

        const width = canvas.width;
        const height = canvas.height;

        // Get all necessary image data
        const maskImageData = ctx.getImageData(0, 0, width, height);
        const maskData = maskImageData.data;

        const selectionImageData = scCtx.getImageData(0, 0, width, height);
        const selectionData = selectionImageData.data;

        // Get original image data
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;
        tempCtx.drawImage(imgObj, 0, 0);
        const originalImageData = tempCtx.getImageData(0, 0, width, height);
        const originalData = originalImageData.data;

        // Calculate Average Color of Selection
        let totalR = 0, totalG = 0, totalB = 0, count = 0;

        for (let i = 0; i < selectionData.length; i += 4) {
            if (selectionData[i + 3] > 0) {
                totalR += originalData[i];
                totalG += originalData[i + 1];
                totalB += originalData[i + 2];
                count++;
            }
        }

        if (count === 0) return; // Nothing selected

        const avgR = totalR / count;
        const avgG = totalG / count;
        const avgB = totalB / count;

        const tolerance = 80; // Increased tolerance for better coverage

        // Iterate through pixels
        for (let i = 0; i < selectionData.length; i += 4) {
            // Check if this pixel is selected (alpha > 0)
            if (selectionData[i + 3] > 0) {
                const r = originalData[i];
                const g = originalData[i + 1];
                const b = originalData[i + 2];

                // Check color similarity to AVERAGE color
                if (colorDistance(r, g, b, avgR, avgG, avgB) < tolerance) {
                    if (brushMode === 'erase') {
                        maskData[i + 3] = 0; // Transparent
                    } else {
                        // Restore
                        maskData[i] = r;
                        maskData[i + 1] = g;
                        maskData[i + 2] = b;
                        maskData[i + 3] = 255; // Opaque
                    }
                }
            }
        }

        // Apply changes
        ctx.putImageData(maskImageData, 0, 0);

        // Clear selection canvas
        scCtx.clearRect(0, 0, width, height);

        // Save history
        addToHistory(osc.toDataURL());

        render();
    };

    // Cursor Rendering
    useEffect(() => {
        const cursorCanvas = cursorCanvasRef.current;
        const canvas = canvasRef.current;
        if (!cursorCanvas || !canvas || !cursorPos) return;

        const ctx = cursorCanvas.getContext('2d');
        if (!ctx) return;

        // Set cursor canvas dimensions to match main canvas
        cursorCanvas.width = canvas.width;
        cursorCanvas.height = canvas.height;
        ctx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);

        // Draw Brush Cursor
        const rect = canvas.getBoundingClientRect();

        // Map screen cursor pos to canvas coords
        const x = (cursorPos.x - rect.left) * (canvas.width / rect.width);
        const y = (cursorPos.y - rect.top) * (canvas.height / rect.height);

        ctx.beginPath();
        ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        ctx.strokeStyle = brushMode === 'erase' ? '#ef4444' : '#22c55e';
        ctx.lineWidth = 2 / zoom; // Keep line width constant visually
        ctx.stroke();

        // Crosshair center
        ctx.beginPath();
        ctx.moveTo(x - 5 / zoom, y);
        ctx.lineTo(x + 5 / zoom, y);
        ctx.moveTo(x, y - 5 / zoom);
        ctx.lineTo(x, y + 5 / zoom);
        ctx.stroke();

    }, [cursorPos, brushSize, brushMode, zoom]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '[') {
                setBrushSize(Math.max(brushSize - 10, 10));
            } else if (e.key === ']') {
                setBrushSize(Math.min(brushSize + 10, 200));
            } else if (e.key === 'e') {
                setBrushMode('erase');
            } else if (e.key === 'r') {
                setBrushMode('restore');
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [brushSize, setBrushSize, setBrushMode, undo, redo]);

    // Handle Zoom
    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            const newZoom = Math.min(Math.max(zoom * delta, 0.1), 5);
            setZoom(newZoom);
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            setIsDragging(true);
            setLastMousePos({ x: e.clientX, y: e.clientY });
        } else if (e.button === 0) {
            setIsDragging(true);
            paintSelection(e);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        setCursorPos({ x: e.clientX, y: e.clientY });

        if (!isDragging) return;

        if (e.buttons === 4 || (e.buttons === 1 && e.altKey)) {
            const dx = e.clientX - lastMousePos.x;
            const dy = e.clientY - lastMousePos.y;
            setPan({ x: pan.x + dx, y: pan.y + dy });
            setLastMousePos({ x: e.clientX, y: e.clientY });
        } else if (e.buttons === 1) {
            paintSelection(e);
        }
    };

    const handleMouseUp = () => {
        if (isDragging) {
            applySmartSelection();
        }
        setIsDragging(false);
    };

    // GitHub Star Toast Logic
    const [showToast, setShowToast] = useState(false);

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const link = document.createElement('a');
            link.download = 'removed-background.png';
            link.href = canvas.toDataURL('image/png');
            link.click();

            // Show toast after download
            setTimeout(() => setShowToast(true), 1000);
        }
    };

    return (
        <div className="flex flex-col h-full max-w-6xl mx-auto gap-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-zinc-900 p-2 rounded-xl border border-zinc-800 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 border-r border-zinc-800">
                        <span className="text-sm font-medium text-zinc-400">Brush Size</span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setBrushSize(Math.max(brushSize - 10, 10))}
                                className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-lime-400 transition-colors"
                                title="Decrease size ([)"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-mono text-sm text-zinc-200">{brushSize}</span>
                            <button
                                onClick={() => setBrushSize(Math.min(brushSize + 10, 200))}
                                className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-lime-400 transition-colors"
                                title="Increase size (])"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setBrushMode('erase')}
                            className={clsx(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                brushMode === 'erase'
                                    ? "bg-red-500/10 text-red-500 ring-1 ring-red-500/50"
                                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                            )}
                            title="Erase Mode (E)"
                        >
                            <div className={clsx("w-2 h-2 rounded-full", brushMode === 'erase' ? "bg-red-500" : "bg-zinc-600")} />
                            Erase
                        </button>
                        <button
                            onClick={() => setBrushMode('restore')}
                            className={clsx(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                brushMode === 'restore'
                                    ? "bg-lime-500/10 text-lime-400 ring-1 ring-lime-500/50"
                                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                            )}
                            title="Restore Mode (R)"
                        >
                            <div className={clsx("w-2 h-2 rounded-full", brushMode === 'restore' ? "bg-lime-500" : "bg-zinc-600")} />
                            Restore
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                        <button
                            onClick={undo}
                            disabled={historyIndex <= 0}
                            className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                            title="Undo (Ctrl+Z)"
                        >
                            <Undo className="w-4 h-4" />
                        </button>
                        <button
                            onClick={redo}
                            disabled={historyIndex >= history.length - 1}
                            className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                            title="Redo (Ctrl+Shift+Z)"
                        >
                            <Redo className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="h-6 w-px bg-zinc-800 mx-2" />

                    <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                        <button onClick={() => setZoom(Math.max(zoom - 0.1, 0.1))} className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-all">
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-mono text-xs text-zinc-400">{Math.round(zoom * 100)}%</span>
                        <button onClick={() => setZoom(Math.min(zoom + 0.1, 5))} className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-all">
                            <ZoomIn className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Canvas Container */}
            <div
                ref={containerRef}
                className="relative w-full h-[65vh] bg-zinc-900/50 rounded-xl overflow-hidden shadow-inner border border-zinc-800 cursor-none"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onContextMenu={(e) => e.preventDefault()}
            >
                <div
                    style={{
                        transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                        transformOrigin: 'center',
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                    }}
                    className="w-full h-full flex items-center justify-center"
                >
                    {/* Checkerboard Background - Dark Mode Optimized */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            backgroundImage: `
                                linear-gradient(45deg, #18181b 25%, transparent 25%), 
                                linear-gradient(-45deg, #18181b 25%, transparent 25%), 
                                linear-gradient(45deg, transparent 75%, #18181b 75%), 
                                linear-gradient(-45deg, transparent 75%, #18181b 75%)
                            `,
                            backgroundSize: '20px 20px',
                            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                        }}
                    />

                    <canvas ref={canvasRef} className="relative z-10" />
                    <canvas ref={offscreenCanvasRef} className="hidden" />
                    <canvas ref={cursorCanvasRef} className="absolute inset-0 z-50 pointer-events-none" />
                </div>

                {isProcessing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm z-20">
                        <Loader2 className="w-10 h-10 text-lime-500 animate-spin mb-4" />
                        <p className="text-zinc-400 font-medium">Removing background...</p>
                    </div>
                )}
            </div>

            {/* Bottom Bar */}
            <div className="flex justify-between items-center">
                <button
                    onClick={reset}
                    className="px-4 py-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 rounded-lg transition-colors text-sm font-medium"
                >
                    Start Over
                </button>

                <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-6 py-2.5 bg-lime-500 hover:bg-lime-400 text-black rounded-lg font-bold transition-all shadow-lg shadow-lime-500/20 active:scale-95"
                >
                    <Download className="w-4 h-4" />
                    Download Image
                </button>
            </div>

            {/* GitHub Star Toast */}
            {showToast && (
                <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className="bg-zinc-900 text-zinc-100 p-4 rounded-xl shadow-2xl flex items-center gap-4 max-w-sm border border-zinc-800 ring-1 ring-lime-500/20">
                        <div className="flex-1">
                            <p className="font-semibold text-sm">Happy with the result?</p>
                            <p className="text-xs text-zinc-400 mt-0.5">Support us with a star on GitHub! ⭐</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <a
                                href="https://github.com/Suvink/cut-it-out"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-lime-500 text-black text-xs font-bold rounded-lg hover:bg-lime-400 transition-colors"
                            >
                                Star
                            </a>
                            <button
                                onClick={() => setShowToast(false)}
                                className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
