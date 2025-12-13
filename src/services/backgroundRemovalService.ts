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

import { removeBackground, type Config } from '@imgly/background-removal';

class BackgroundRemovalService {

    async removeBackground(imageSource: string | HTMLImageElement | Blob): Promise<Blob> {
        const config: Config = {
            progress: () => {
                // Progress callback
            },
            debug: false,
            // Default model is 'isnet' which is good quality
        };

        try {
            // removeBackground returns a Blob
            const blob = await removeBackground(imageSource, config);
            return blob;
        } catch (error) {
            console.error("Error removing background:", error);
            throw error;
        }
    }
}

export const backgroundRemovalService = new BackgroundRemovalService();
