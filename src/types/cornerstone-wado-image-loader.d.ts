declare module "cornerstone-wado-image-loader" {
  export const external: any;
  export const webWorkerManager: {
    initialize: (config: any) => void;
    terminate: () => void;
    status: string;
  };
  export const wadouri: {
    register: (cornerstone: any) => void;
    dataSetCacheManager: {
      get: (imageId: string) => any;
      add: (imageId: string, dataSet: any) => void;
      remove: (imageId: string) => void;
      purge: () => void;
      isCached: (imageId: string) => boolean;
      getCacheInfo: () => {
        cacheSizeInBytes: number;
        numberOfDataSetsCached: number;
      };
    };
    fileManager: {
      add: (imageId: string, promise: Promise<any>) => void;
      get: (imageId: string) => Promise<any> | undefined;
      remove: (imageId: string) => void;
      purge: () => void;
      clear: () => void;
    };
  };
  export const wadors: {
    register: (cornerstone: any) => void;
    metaDataManager: {
      add: (imageId: string, metadata: any) => void;
      get: (imageId: string) => any;
      remove: (imageId: string) => void;
      purge: () => void;
    };
  };
  export function configure(config: WadoImageLoaderConfig): void;

  // Thêm cấu hình cho WADO Image Loader
  export interface WadoImageLoaderConfig {
    beforeSend?: (xhr: XMLHttpRequest) => void;
    useWebWorkers?: boolean;
    decodeConfig?: {
      convertFloatPixelDataToInt?: boolean;
      use16Bits?: boolean;
      preservePixelData?: boolean;
      maxWebWorkers?: number;
      webWorkerTaskPriority?: number;
      strict?: boolean;
    };
    useCache?: boolean;
    cacheTTL?: number;
    imageCreationHook?: (image: any) => any;
    requestPoolManager?: {
      maxNumRequests?: number;
      numRequests?: number;
      clearRequestStack?: () => void;
    };
  }

  // Sửa định nghĩa cho RequestPoolManager
  export const RequestPoolManager: {
    add: (
      requestFn: () => Promise<any>,
      type: string,
      priority: number
    ) => void;
    clearRequestStack: (type?: string) => void; // Thêm dấu ? để làm cho tham số type trở thành tùy chọn
    getRequestPool: () => any;
    startGrabbing: () => void;
  };
}
