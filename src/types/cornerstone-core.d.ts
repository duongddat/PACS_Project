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

  export interface Viewport {
    scale?: number;
    translation?: { x: number; y: number };
    voi?: { windowWidth: number; windowCenter: number };
    invert?: boolean;
    pixelReplication?: boolean;
    rotation?: number;
    hflip?: boolean;
    vflip?: boolean;
    modalityLUT?: any;
    voiLUT?: any;
    colormap?: any;
  }

  export function enable(element: HTMLElement): void;
  export function disable(element: HTMLElement): void;
  export function loadImage(imageId: string): Promise<IImage>;
  export function displayImage(
    element: HTMLElement,
    image: IImage,
    viewport?: Viewport
  ): void;
  export function reset(element: HTMLElement): void;
  export function getDefaultViewport(
    element: HTMLElement,
    image?: IImage
  ): Viewport;
  export function getDefaultViewportForImage(
    element: HTMLElement,
    image: IImage
  ): Viewport;
  export function setViewport(element: HTMLElement, viewport: Viewport): void;
  export function getViewport(element: HTMLElement): Viewport;
  export function getImage(element: HTMLElement): IImage;
  export function updateImage(element: HTMLElement): void;
  export function resize(element: HTMLElement): void;
  export function pageToPixel(
    element: HTMLElement,
    pageX: number,
    pageY: number
  ): { x: number; y: number };
  export function pixelToCanvas(
    element: HTMLElement,
    pixel: { x: number; y: number }
  ): { x: number; y: number };

  // Add imageCache property
  export const imageCache: {
    setMaximumSizeBytes: (sizeInBytes: number) => void;
    purgeCache: () => void;
  };
}
