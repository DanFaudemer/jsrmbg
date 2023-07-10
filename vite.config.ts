import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import fs from 'fs/promises';
import axios from 'axios';

const fileExists = async (path: string) => {
  try {
    await fs.access(path);
    return true;
  } catch (err) {
    return false;
  }
};

export default defineConfig({
  plugins: [
    {
      name: 'download-model',
      async buildStart() {
        const modelUrl = 'https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2net.onnx';
        const modelPath = './public/u2net.onnx';

        if (!await fileExists(modelPath)) {
          // eslint-disable-next-line no-console
          console.log('Downloading u2net model:');
          const response = await axios.get(modelUrl, {
            responseType: 'arraybuffer',
            onDownloadProgress: (progressEvent) => {
              const percentage = progressEvent.total
                ? (Math.floor((progressEvent.loaded * 100) / progressEvent.total)) : 0;
              process.stdout.write(`${percentage}%\r`);
            },
          });
          await fs.writeFile(modelPath, response.data);
        }
      },
    },
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/onnxruntime-web/dist/*.wasm',
          dest: '.',
        },
      ],
    }),
  ],
});
