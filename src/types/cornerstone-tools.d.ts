declare module "cornerstone-tools" {
  import * as cornerstone from "cornerstone-core";

  export const external: {
    cornerstone: typeof cornerstone;
    cornerstoneMath: any;
    Hammer: any;
  };

  export function init(options?: any): void;
  export function addTool(tool: any): void;
  export function setToolActive(
    toolName: string,
    options: { mouseButtonMask: number }
  ): void;

  // Add these methods for stack tool state management
  export function addToolState(
    element: HTMLElement,
    toolType: string,
    data: any
  ): void;
  export function getToolState(
    element: HTMLElement,
    toolType: string
  ): { data: any[] };
  export function clearToolState(element: HTMLElement, toolType?: string): void;

  // Event data interface
  export interface EventData {
    element: HTMLElement;
    viewport: any;
    image: cornerstone.IImage;
    currentPoints: {
      page: { x: number; y: number };
      image: { x: number; y: number };
      canvas: { x: number; y: number };
      client: { x: number; y: number };
    };
    startPoints: {
      page: { x: number; y: number };
      image: { x: number; y: number };
      canvas: { x: number; y: number };
      client: { x: number; y: number };
    };
    lastPoints: {
      page: { x: number; y: number };
      image: { x: number; y: number };
      canvas: { x: number; y: number };
      client: { x: number; y: number };
    };
    deltaPoints: {
      page: { x: number; y: number };
      image: { x: number; y: number };
      canvas: { x: number; y: number };
      client: { x: number; y: number };
    };
  }

  // Tool interfaces
  export interface BaseTool {
    name: string;
    defaultStrategy?: string;
    strategies?: Record<string, any>;
    configuration?: any;
    mouseDownCallback?: (evt: EventData) => void;
    mouseMoveCallback?: (evt: EventData) => void;
    mouseUpCallback?: (evt: EventData) => void;
  }

  // Tools
  export const WwwcTool: BaseTool;
  export const PanTool: BaseTool;
  export const ZoomTool: BaseTool;
  export const LengthTool: BaseTool;
  export const AngleTool: BaseTool;
  export const RectangleRoiTool: BaseTool;
  export const MagnifyTool: BaseTool;
  export const StackScrollTool: BaseTool;

  // Additional functions
  export function setToolDisabled(toolName: string): void;
  export function setToolEnabled(toolName: string): void;
  export function setToolPassive(toolName: string): void;
}
