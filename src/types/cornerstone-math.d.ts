declare module "cornerstone-math" {
  export const point: {
    pageToPoint: (event: any) => { x: number; y: number };
    subtract: (point1: any, point2: any) => { x: number; y: number };
  };

  export const rect: any;
  export const lineSegment: any;
  export const vector3: any;
  export const matrix4: any;
}
