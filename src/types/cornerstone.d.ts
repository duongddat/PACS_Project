declare module "cornerstone-core" {
  export interface IImage {
    imageId: string;
    minPixelValue: number;
    maxPixelValue: number;
    slope: number;
    intercept: number;
    windowCenter: number;
    windowWidth: number;
    getPixelData: () => Uint8Array | Float32Array;
    rows: number;
    columns: number;
    height: number;
    width: number;
    color: boolean;
    columnPixelSpacing: number;
    rowPixelSpacing: number;
    sizeInBytes: number;
  }

  export function enable(element: HTMLElement): void;
  export function disable(element: HTMLElement): void;
  export function loadImage(imageId: string): Promise<IImage>;
  export function displayImage(element: HTMLElement, image: IImage): void;
  export function reset(element: HTMLElement): void;
  export function getDefaultViewport(element: HTMLElement): any;
  export function setViewport(element: HTMLElement, viewport: any): void;
  
  // Add imageCache property
  export const imageCache: {
    setMaximumSizeBytes: (sizeInBytes: number) => void;
  };
}

declare module "cornerstone-tools" {
  export namespace external {
    export let cornerstone: any;
    export let Hammer: any;
  }

  export function init(config?: any): void;
  export function addTool(tool: any): void;
  export function setToolActive(
    toolName: string,
    options: { mouseButtonMask: number }
  ): void;
  export function clearToolState(element: HTMLElement): void;
}

declare module "cornerstone-wado-image-loader" {
  export namespace external {
    export let cornerstone: any;
    export let dicomParser: any;
  }

  export function configure(config: any): void;
}
