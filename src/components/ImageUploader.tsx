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

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import clsx from 'clsx';

export const ImageUploader: React.FC = () => {
    const setOriginalImage = useAppStore((state) => state.setOriginalImage);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                setOriginalImage(result);
            };
            reader.readAsDataURL(file);
        }
    }, [setOriginalImage]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp']
        },
        maxFiles: 1,
        multiple: false
    });

    return (
        <div
            {...getRootProps()}
            className={clsx(
                "border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ease-in-out",
                isDragActive
                    ? "border-lime-500 bg-lime-500/10 scale-[1.02]"
                    : "border-zinc-800 hover:border-lime-500/50 hover:bg-zinc-900 bg-zinc-900/50"
            )}
        >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
                <div className={clsx(
                    "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
                    isDragActive ? "bg-lime-500/20 text-lime-400" : "bg-zinc-800 text-zinc-500"
                )}>
                    <Upload className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                    <p className="text-lg font-medium text-zinc-200">
                        {isDragActive ? "Drop image here" : "Click or drag image to upload"}
                    </p>
                    <p className="text-sm text-zinc-500">
                        Supports JPG, PNG, WEBP (Max 10MB)
                    </p>
                </div>
            </div>
        </div>
    );
};
