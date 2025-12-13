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

import { ImageUploader } from './components/ImageUploader';
import { CanvasViewer } from './components/CanvasViewer';
import { useAppStore } from './store/useAppStore';
import { useBackgroundRemoval } from './hooks/useBackgroundRemoval';
import { Layers, Github } from 'lucide-react';

function App() {
  const originalImage = useAppStore((state) => state.originalImage);

  // Initialize background removal hook
  useBackgroundRemoval();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-lime-500/30">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-lime-500 rounded-lg flex items-center justify-center">
              <img src="/cut-it-out-logo.png" alt="CutItOut Logo" className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">CutItOut</span>
          </div>
          <nav className="flex items-center gap-4">
            <a
              href="https://github.com/Suvink/cut-it-out"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-900 rounded-lg hover:bg-lime-400 hover:text-black transition-all font-medium text-sm"
            >
              <Github className="w-4 h-4" />
              Star on GitHub
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 min-h-[calc(100vh-8rem)]">
        {!originalImage ? (
          <div className="max-w-2xl mx-auto space-y-12 pt-12">
            <div className="text-center space-y-4">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
                Remove Backgrounds <br />
                <span className="text-lime-400">100% Automatically</span>
              </h1>
              <p className="text-lg text-zinc-400 max-w-lg mx-auto">
                Free, open-source, and runs entirely in your browser. No images are ever uploaded to a server.
              </p>
            </div>

            <ImageUploader />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
              {[
                { title: 'Privacy First', desc: 'Images never leave your device' },
                { title: 'AI Powered', desc: 'State-of-the-art U2-Net model' },
                { title: 'Free Forever', desc: 'Open source and no hidden costs' }
              ].map((item, i) => (
                <div key={i} className="text-center p-4 rounded-lg bg-zinc-900 border border-zinc-800 shadow-sm">
                  <h3 className="font-semibold text-zinc-100 mb-1">{item.title}</h3>
                  <p className="text-sm text-zinc-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <CanvasViewer />
        )}
      </main>

      <footer className="py-6 text-center text-zinc-500 text-sm border-t border-zinc-900">
        <p>Made with ♥️ by Suvink</p>
      </footer>
    </div>
  );
}

export default App;

