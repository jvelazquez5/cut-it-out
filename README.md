# CutItOut - Free AI Background Remover

**CutItOut** is a free, open-source, and privacy-focused tool that removes image backgrounds instantly directly in your browser. Powered by WebAssembly and the U2-Net deep learning model, it ensures your images never leave your device.

![CutItOut Demo](/og-image.png)

## 🚀 Features

-   **100% Client-Side**: No server uploads. Your photos stay private.
-   **AI-Powered**: Uses the state-of-the-art U2-Net model via `@imgly/background-removal`.
    - This library loads the ONNX runtime via WebAssembly (WASM) to execute the U2-Net model directly in the browser.
    - There is no need for a backend server, reducing costs to zero and guaranteeing user privacy.
-   **Smart Editing**:
    -   **Magic Brush**: Select areas to restore or erase based on color similarity.
    -   **Restore Mode**: "Ghost" overlay helps you see what you're restoring.
    -   **Zoom & Pan**: Precise control for detailed editing.
-   **High Quality**: Exports full-resolution transparent PNGs. No restrictions! No watermarks!

## 💻 Local Development

Follow these steps to run CutItOut locally on your machine.

### Prerequisites

-   Node.js (v18 or higher)
-   npm (v9 or higher)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Suvink/cut-it-out.git
    cd cut-it-out
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the development server**
    ```bash
    npm run dev
    ```
    Open `http://localhost:5173` in your browser.

### Building for Production

To create a production build:

```bash
npm run build
```

The output will be in the `dist` folder, ready to be deployed to any static host (Vercel, Netlify, GitHub Pages, etc.).

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to get started.

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
