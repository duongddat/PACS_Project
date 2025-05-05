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

  // Mở rộng imageCache property
  export const imageCache: {
    setMaximumSizeBytes: (sizeInBytes: number) => void;
    purgeCache: () => void;
    getCacheInfo: () => {
      maximumSizeInBytes: number;
      cacheSizeInBytes: number;
      numberOfImagesCached: number;
    };
    getImageLoadObject: (imageId: string) => any;
    putImageLoadObject: (imageId: string, imageLoadObject: any) => void;
    removeImageLoadObject: (imageId: string) => void;
    isCacheFull: () => boolean;
    cachedDataInfo: () => { [key: string]: { size: number; imageId: string } };
  };

  // Thêm imageLoadPoolManager để quản lý các yêu cầu tải hình ảnh
  export const imageLoadPoolManager: {
    addRequest: (
      requestFn: () => Promise<any>,
      type: string,
      priority: number
    ) => void;
    clearRequestStack: () => void;
    startGrabbing: () => void;
    getRequestPool: () => any;
  };

  // Thêm các hàm tiện ích
  export function getEnabledElement(element: HTMLElement): {
    element: HTMLElement;
    image: IImage;
    viewport: Viewport;
    canvas: HTMLCanvasElement;
    enabledElement: boolean;
  };

  export function getEnabledElements(): Array<{
    element: HTMLElement;
    image: IImage;
    viewport: Viewport;
    canvas: HTMLCanvasElement;
    enabledElement: boolean;
  }>;

  export function addEnabledElement(element: HTMLElement): void;
  export function removeEnabledElement(element: HTMLElement): void;

  // Thêm các hàm xử lý sự kiện
  export function events(): {
    addEventListener: (
      element: HTMLElement,
      type: string,
      callback: (event: any) => void
    ) => void;
    removeEventListener: (
      element: HTMLElement,
      type: string,
      callback: (event: any) => void
    ) => void;
  };
}
