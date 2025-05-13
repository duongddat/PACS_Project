import { create } from "zustand";
import { cache, getRenderingEngines } from "@cornerstonejs/core";

export type LayoutType =
  | "1x1"
  | "1x2"
  | "2x2"
  | "2x2-alt"
  | "mpr"
  | "3d-four-up"
  | "3d-main"
  | "axial-primary"
  | "3d-only"
  | "3d-primary"
  | "frame-view"
  | string;

interface LayoutState {
  currentLayout: LayoutType;
  viewportCount: number;
  layoutChangeTimestamp: number;
  setLayout: (layout: LayoutType) => void;
  resetViewportCache: () => void;
  forceRefreshViewports: () => void;
  getViewportConfiguration: () => {
    rows: number;
    cols: number;
    viewports: {
      id: string;
      position: [number, number];
      span?: [number, number];
    }[];
  };
}

export const useLayoutStore = create<LayoutState>((set, get) => ({
  currentLayout: "1x1",
  viewportCount: 1,
  layoutChangeTimestamp: Date.now(),

  setLayout: (layout: LayoutType) => {
    let viewportCount = 1;
    if (layout === "1x1") {
      viewportCount = 1;
    } else if (layout === "1x2") {
      viewportCount = 2;
    } else if (layout === "2x2") {
      viewportCount = 4;
    } else if (layout === "2x2-alt") {
      viewportCount = 3;
    } else if (layout.startsWith("custom-")) {
      const [rows, cols] = layout.replace("custom-", "").split("x").map(Number);
      viewportCount = rows * cols;
    } else if (layout === "mpr") {
      viewportCount = 3;
    } else if (layout === "3d-four-up") {
      viewportCount = 4;
    } else if (layout === "3d-main") {
      viewportCount = 3;
    } else if (layout === "3d-primary" || layout === "axial-primary") {
      viewportCount = 2;
    } else if (layout === "3d-only" || layout === "frame-view") {
      viewportCount = 1;
    } else {
      viewportCount = 1;
    }

    get().resetViewportCache();
    set({
      currentLayout: layout,
      viewportCount,
      layoutChangeTimestamp: Date.now(),
    });
  },

  forceRefreshViewports: () => {
    get().resetViewportCache();

    set({ layoutChangeTimestamp: Date.now() });
  },

  resetViewportCache: () => {
    try {
      // Xóa cache nhưng không hủy tất cả rendering engines
      cache.purgeCache();

      // const renderingEngines = getRenderingEngines();
      // if (renderingEngines && renderingEngines.length > 0) {
      //   renderingEngines.forEach((engine) => {
      //     try {
      //       if (engine && !engine.hasBeenDestroyed) {
      //         engine.destroy();
      //       }
      //     } catch (error) {
      //       console.warn("Lỗi khi hủy rendering engine:", error);
      //     }
      //   });
      // }
    } catch (error) {
      console.error("Lỗi khi xóa cache viewport:", error);
    }
  },

  getViewportConfiguration: () => {
    const { currentLayout } = get();

    let rows = 1;
    let cols = 1;
    let viewports: {
      id: string;
      position: [number, number];
      span?: [number, number];
    }[] = [{ id: "viewport-1", position: [0, 0] }];

    if (currentLayout === "1x1") {
    } else if (currentLayout === "1x2") {
      rows = 1;
      cols = 2;
      viewports = [
        { id: "viewport-1", position: [0, 0] },
        { id: "viewport-2", position: [0, 1] },
      ];
    } else if (currentLayout === "2x2") {
      rows = 2;
      cols = 2;
      viewports = [
        { id: "viewport-1", position: [0, 0] },
        { id: "viewport-2", position: [0, 1] },
        { id: "viewport-3", position: [1, 0] },
        { id: "viewport-4", position: [1, 1] },
      ];
    } else if (currentLayout === "2x2-alt") {
      rows = 2;
      cols = 2;
      viewports = [
        { id: "viewport-1", position: [0, 0], span: [1, 2] },
        { id: "viewport-2", position: [1, 0] },
        { id: "viewport-3", position: [1, 1] },
      ];
    } else if (currentLayout === "mpr") {
      rows = 2;
      cols = 2;
      viewports = [
        { id: "viewport-1", position: [0, 0] },
        { id: "viewport-2", position: [0, 1] },
        { id: "viewport-3", position: [1, 0] },
        { id: "viewport-4", position: [1, 1], span: [0, 0] },
      ];
    } else if (currentLayout === "3d-four-up") {
      rows = 2;
      cols = 2;
      viewports = [
        { id: "viewport-1", position: [0, 0] },
        { id: "viewport-2", position: [0, 1] },
        { id: "viewport-3", position: [1, 0] },
        { id: "viewport-4", position: [1, 1] },
      ];
    } else if (currentLayout === "3d-main") {
      rows = 2;
      cols = 2;
      viewports = [
        { id: "viewport-1", position: [0, 0], span: [2, 1] },
        { id: "viewport-2", position: [0, 1] },
        { id: "viewport-3", position: [1, 1] },
      ];
    } else if (currentLayout === "axial-primary") {
      rows = 2;
      cols = 2;
      viewports = [
        { id: "viewport-1", position: [0, 0], span: [2, 1] },
        { id: "viewport-2", position: [0, 1], span: [2, 1] },
      ];
    } else if (currentLayout === "3d-primary") {
      rows = 2;
      cols = 2;
      viewports = [
        { id: "viewport-1", position: [0, 0], span: [2, 1] },
        { id: "viewport-2", position: [0, 1], span: [2, 1] },
      ];
    } else if (currentLayout === "3d-only") {
      rows = 1;
      cols = 1;
      viewports = [{ id: "viewport-1", position: [0, 0] }];
    } else if (currentLayout === "frame-view") {
      rows = 1;
      cols = 1;
      viewports = [{ id: "viewport-1", position: [0, 0] }];
    } else if (currentLayout.startsWith("custom-")) {
      try {
        const [rowCount, colCount] = currentLayout
          .replace("custom-", "")
          .split("x")
          .map(Number);

        if (
          isNaN(rowCount) ||
          isNaN(colCount) ||
          rowCount <= 0 ||
          colCount <= 0
        ) {
          console.error("Cấu hình layout không hợp lệ:", currentLayout);
          return {
            rows: 1,
            cols: 1,
            viewports: [{ id: "viewport-1", position: [0, 0] }],
          };
        }

        rows = rowCount;
        cols = colCount;

        viewports = [];
        let viewportIndex = 1;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            viewports.push({
              id: `viewport-${viewportIndex}`,
              position: [r, c] as [number, number],
            });
            viewportIndex++;
          }
        }
      } catch (error) {
        console.error("Lỗi khi xử lý layout tùy chỉnh:", error);
        return {
          rows: 1,
          cols: 1,
          viewports: [{ id: "viewport-1", position: [0, 0] }],
        };
      }
    } else {
      console.warn("Layout không được hỗ trợ:", currentLayout);
    }

    return { rows, cols, viewports };
  },
}));
