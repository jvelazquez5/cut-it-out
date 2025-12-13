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

import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { backgroundRemovalService } from '../services/backgroundRemovalService';

export const useBackgroundRemoval = () => {
    const originalImage = useAppStore((state) => state.originalImage);
    const setProcessedImage = useAppStore((state) => state.setProcessedImage);
    const setIsProcessing = useAppStore((state) => state.setIsProcessing);
    const setProcessingProgress = useAppStore((state) => state.setProcessingProgress);
    const setError = useAppStore((state) => state.setError);

    useEffect(() => {
        if (!originalImage) return;

        const processImage = async () => {
            setIsProcessing(true);
            setError(null);
            setProcessingProgress(0);

            try {
                // @imgly/background-removal accepts the data URL directly
                const blob = await backgroundRemovalService.removeBackground(originalImage);

                // Convert Blob to Data URL for display
                const url = URL.createObjectURL(blob);
                setProcessedImage(url);
            } catch (err) {
                console.error("Background removal failed:", err);
                setError("Failed to remove background. Please try again.");
            } finally {
                setIsProcessing(false);
            }
        };

        processImage();
    }, [originalImage, setProcessedImage, setIsProcessing, setError, setProcessingProgress]);
};
