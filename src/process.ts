import { InferenceSession, Tensor, type TypedTensor } from 'onnxruntime-web';
import { get2DContext } from './utils';

const u2netSize = 320;

// Get image RGB max Pixel intensity
const getMaxPixelIntensity = (array: Uint8ClampedArray) => {
  let intensity = -Infinity;
  for (let i = 0; i < array.length; i += 4) {
    intensity = Math.max(intensity, array[i], array[i + 1], array[i + 2]);
  }
  return intensity;
};

const resizeImage = (img: HTMLImageElement | HTMLCanvasElement, width: number, height: number) => {
  const canvas = document.createElement('canvas');
  const context = get2DContext(canvas);

  canvas.width = width;
  canvas.height = height;
  context.drawImage(img, 0, 0, width, height);

  return canvas;
};

const normalizeInput = (imageData: Uint8ClampedArray) => {
  const normalizedData = new Float32Array(u2netSize * u2netSize * 3);

  // Standart values used in models pretrained on imagenet
  const maxPixelIntensity = getMaxPixelIntensity(imageData);
  const mean = [0.485, 0.456, 0.406];
  const std = [0.229, 0.224, 0.225];

  // Tensor data need to be in NCHW format (RGB channel first)
  for (let i = 0, j = 0; i < imageData.length; i += 4, j += 1) {
    const redChannel = (imageData[i] / maxPixelIntensity - mean[0]) / std[0];
    const greenChannel = (imageData[i + 1] / maxPixelIntensity - mean[1]) / std[1];
    const blueChannel = (imageData[i + 2] / maxPixelIntensity - mean[2]) / std[2];

    normalizedData[j] = redChannel;
    normalizedData[j + u2netSize * u2netSize] = greenChannel;
    normalizedData[j + 2 * u2netSize * u2netSize] = blueChannel;
  }

  return normalizedData;
};

const preprocess = async (img: HTMLCanvasElement) => {
  // u2net use 300pxx300px image as input
  const resizedImage = resizeImage(img, u2netSize, u2netSize);

  const context = get2DContext(resizedImage);
  const { data } = context.getImageData(0, 0, u2netSize, u2netSize);

  const normalizedData = normalizeInput(data);

  return new Tensor('float32', normalizedData, [1, 3, u2netSize, u2netSize]);
};

const runModel = async (session: InferenceSession, input: TypedTensor<'float32'>) => {
  const outputMap = await session.run({ [session.inputNames[0]]: input });
  return outputMap;
};

const getMask = (maskData: Float32Array) => {
  const min = Math.min(...maskData);
  const max = Math.max(...maskData);

  const canvas = document.createElement('canvas');
  canvas.width = u2netSize;
  canvas.height = u2netSize;
  const context = get2DContext(canvas);

  const pixels = new Uint8ClampedArray(maskData.length * 4);
  for (let i = 0, j = 0; i < maskData.length; i += 1, j += 4) {
    const pixelValue = ((maskData[i] - min) / (max - min)) * 255;

    pixels[j] = pixelValue;
    pixels[j + 1] = pixelValue;
    pixels[j + 2] = pixelValue;
    pixels[j + 3] = 255; // set alpha to fully opaque
  }

  const imageData = new ImageData(pixels, u2netSize, u2netSize);
  context.putImageData(imageData, 0, 0);

  return canvas;
};

const applyMask = (mask: HTMLCanvasElement, img: HTMLCanvasElement) => {
  const resizedMask = resizeImage(mask, img.width, img.height);
  const resizedMaskContext = get2DContext(resizedMask);
  const maskResizedData = resizedMaskContext.getImageData(0, 0, img.width, img.height);

  const ouputImg = document.createElement('canvas');
  ouputImg.width = img.width;
  ouputImg.height = img.height;

  const context = get2DContext(ouputImg);
  context.drawImage(img, 0, 0, img.width, img.height);

  const sourceImgData = context.getImageData(0, 0, img.width, img.height);

  // apply to alpha channel mask value
  for (let i = 3; i < sourceImgData.data.length; i += 4) {
    sourceImgData.data[i] = maskResizedData.data[i - 1];
  }

  context.putImageData(sourceImgData, 0, 0);

  return ouputImg;
};

const process = async (model: ArrayBuffer, inputCanvas: HTMLCanvasElement) => {
  const session = await InferenceSession.create(model);

  const input = await preprocess(inputCanvas);
  const outputMap = await runModel(session, input);
  const mask = getMask(outputMap[session.outputNames[0]].data as Float32Array);

  return applyMask(mask, inputCanvas);
};

export default process;
