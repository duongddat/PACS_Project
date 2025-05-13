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
  layoutChangeTimestamp: number; // Thêm trường này
  setLayout: (layout: LayoutType) => void;
  resetViewportCache: () => void;
  forceRefreshViewports: () => void; // Thêm hàm này
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
  layoutChangeTimestamp: Date.now(), // Khởi tạo với thời gian hiện tại

  setLayout: (layout: LayoutType) => {
    let viewportCount = 1;

    // Xác định số lượng viewport dựa trên loại bố cục
    if (layout === "1x1") {
      viewportCount = 1;
    } else if (layout === "1x2") {
      viewportCount = 2;
    } else if (layout === "2x2") {
      viewportCount = 4;
    } else if (layout === "2x2-alt") {
      viewportCount = 3; // Sửa lại: 2x2-alt chỉ có 3 viewport
    } else if (layout.startsWith("custom-")) {
      // Xử lý bố cục tùy chỉnh, ví dụ: custom-2x3
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
      // Mặc định cho các layout không xác định
      viewportCount = 1;
    }

    // Xóa cache trước khi đặt layout mới
    get().resetViewportCache();

    // Cập nhật timestamp khi layout thay đổi
    set({
      currentLayout: layout,
      viewportCount,
      layoutChangeTimestamp: Date.now(),
    });
  },

  // Thêm hàm mới để buộc tải lại viewport mà không thay đổi layout
  forceRefreshViewports: () => {
    // Xóa cache
    get().resetViewportCache();

    // Chỉ cập nhật timestamp để kích hoạt tải lại
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

    // Cấu hình mặc định cho bố cục 1x1
    let rows = 1;
    let cols = 1;
    let viewports: {
      id: string;
      position: [number, number];
      span?: [number, number];
    }[] = [{ id: "viewport-1", position: [0, 0] }];

    // Xác định cấu hình dựa trên loại bố cục
    if (currentLayout === "1x1") {
      // Đã thiết lập mặc định ở trên
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
      // Bố cục 2x2 với viewport đầu tiên lớn hơn
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
        { id: "viewport-1", position: [0, 0] }, // Axial
        { id: "viewport-2", position: [0, 1] }, // Sagittal
        { id: "viewport-3", position: [1, 0] }, // Coronal
        { id: "viewport-4", position: [1, 1], span: [0, 0] }, // Ẩn viewport thứ 4
      ];
    } else if (currentLayout === "3d-four-up") {
      rows = 2;
      cols = 2;
      viewports = [
        { id: "viewport-1", position: [0, 0] }, // Axial
        { id: "viewport-2", position: [0, 1] }, // Sagittal
        { id: "viewport-3", position: [1, 0] }, // Coronal
        { id: "viewport-4", position: [1, 1] }, // 3D
      ];
    } else if (currentLayout === "3d-main") {
      rows = 2;
      cols = 2;
      viewports = [
        { id: "viewport-1", position: [0, 0], span: [2, 1] }, // 3D lớn
        { id: "viewport-2", position: [0, 1] }, // Axial
        { id: "viewport-3", position: [1, 1] }, // Sagittal
      ];
    } else if (currentLayout === "axial-primary") {
      rows = 2;
      cols = 2;
      viewports = [
        { id: "viewport-1", position: [0, 0], span: [2, 1] }, // Axial lớn
        { id: "viewport-2", position: [0, 1], span: [2, 1] }, // Thông tin
      ];
    } else if (currentLayout === "3d-primary") {
      rows = 2;
      cols = 2;
      viewports = [
        { id: "viewport-1", position: [0, 0], span: [2, 1] }, // 3D lớn
        { id: "viewport-2", position: [0, 1], span: [2, 1] }, // Thông tin
      ];
    } else if (currentLayout === "3d-only") {
      rows = 1;
      cols = 1;
      viewports = [
        { id: "viewport-1", position: [0, 0] }, // Chỉ 3D
      ];
    } else if (currentLayout === "frame-view") {
      rows = 1;
      cols = 1;
      viewports = [
        { id: "viewport-1", position: [0, 0] }, // Frame view
      ];
    } else if (currentLayout.startsWith("custom-")) {
      try {
        // Xử lý bố cục tùy chỉnh, ví dụ: custom-2x3
        const [rowCount, colCount] = currentLayout
          .replace("custom-", "")
          .split("x")
          .map(Number);

        // Kiểm tra tính hợp lệ của số hàng và cột
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
      // Mặc định cho các layout không xác định
      console.warn("Layout không được hỗ trợ:", currentLayout);
    }

    return { rows, cols, viewports };
  },
}));
