declare module "cornerstone-wado-image-loader" {
  export const external: any;
  export const webWorkerManager: {
    initialize: (config: any) => void;
  };
  export const wadouri: {
    register: (cornerstone: any) => void;
  };
  export const wadors: {
    register: (cornerstone: any) => void;
  };
  export function configure(config: any): void;
  // Add other properties as needed
}
