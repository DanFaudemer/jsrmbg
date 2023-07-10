# jsrmbg

Jsrmbg is an entirely browser-based, no server-side operations, background removal tool.

[A live version is available here](https://jsrmbg.s3-website.fr-par.scw.cloud/).

Based on [U2-Net](https://github.com/xuebinqin/U-2-Net) the application uses [onnxruntime-web](https://onnxruntime.ai/docs/tutorials/web/), 
which enables the execution of AI models in-browser, with WebAssembly (WASM).

## Processing code

All the image processing is done in [process.ts](src/process.ts) file.

## Development Setup

1. Install dependencies:
    ```bash
    yarn
    ```
2. Run the development server:
    ```bash
    yarn dev
    ```

## Building for Production

To create a production build, simply run:
```
yarn build
```


## License

This project is licensed under the MIT License.