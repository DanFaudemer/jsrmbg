import './style.css';

import process from './process';
import { get2DContext, loadModel, sleep } from './utils';

let onnxModel: ArrayBuffer;

const removeBackgrond = async (img: HTMLCanvasElement) => {
  const loadingModel = document.getElementById('loading-model');
  const loadingProcessing = document.getElementById('processing');
  const outputCanvas = document.getElementById('output-canvas') as HTMLCanvasElement;

  loadingModel?.classList.remove('hidden');
  loadingProcessing?.classList.add('hidden');
  outputCanvas.classList.add('hidden');

  if (!onnxModel) {
    onnxModel = await loadModel('/u2net.onnx', (progress) => {
      const progressElement = document.getElementById('model-download-progress');
      if (progressElement) progressElement.textContent = `${progress}`;
    });
  }

  loadingModel?.classList.add('hidden');
  loadingProcessing?.classList.remove('hidden');

  await sleep(0); // DOM Refresh

  const ouputImg = await process(onnxModel, img);

  outputCanvas.width = img.width;
  outputCanvas.height = img.height;
  const context = get2DContext(outputCanvas);

  context.drawImage(ouputImg, 0, 0);

  loadingProcessing?.classList.add('hidden');
  outputCanvas.classList.remove('hidden');
};

const onImageAdded = (event: DragEvent | Event): void => {
  event.preventDefault();
  event.stopPropagation();

  const canvas = document.getElementById('input-canvas') as HTMLCanvasElement;
  const context = get2DContext(canvas);

  // Check if the event is from drag and drop or input file change
  let file: File | undefined;
  if ('dataTransfer' in event) {
    // Event from drag and drop
    file = event.dataTransfer?.files[0];
  } else if ('target' in event) {
    // Event from input file change
    const target = (event.target as HTMLInputElement);
    file = (target && target.files && target.files[0]) || undefined;
  }

  // Load the image file onto the canvas
  if (file) {
    const img = new Image();

    // Handle image load event
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      context.drawImage(img, 0, 0);

      canvas.classList.remove('hidden');
      document.getElementById('input-label')?.classList.add('hidden');
      removeBackgrond(canvas);
    };

    // Read the image file as a data URL
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  }
};

const onDragEnter = (event: Event) => {
  event.preventDefault();
};

const onDragLeave = (event: Event) => {
  event.preventDefault();
};

document.getElementById('input-image')?.addEventListener('change', onImageAdded);

const inputArea = document.getElementById('input-area');

if (!inputArea) throw new Error('Missing input area');

inputArea.addEventListener('drop', onImageAdded);

// Only required for dragover
['dragenter', 'dragover'].forEach((eventName: string) => {
  inputArea.addEventListener(eventName, onDragEnter);
});

// Remove the highlighting when a file is dragged out of the drop area
['dragleave', 'drop'].forEach((eventName) => {
  inputArea.addEventListener(eventName, onDragLeave);
});
