import axios from 'axios';

export const sleep = (ms: number) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

export const loadModel = async (
  modelUrl: string,
  progress?: (progress: number) => void,
) => (await axios.get(
  modelUrl,
  {
    responseType: 'arraybuffer',
    onDownloadProgress: (progressEvent) => {
      if (progress) {
        progress(progressEvent.total
          ? (Math.floor((progressEvent.loaded * 100) / progressEvent.total)) : 0);
      }
    },
  },
)).data as ArrayBuffer;

export const get2DContext = (canvas: HTMLCanvasElement) => {
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Context is not availabe');
  }

  return context;
};
