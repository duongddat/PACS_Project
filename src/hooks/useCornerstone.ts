import { useEffect, useRef, useState, useCallback } from "react";
import * as cornerstone from "cornerstone-core";
import * as cornerstoneTools from "cornerstone-tools";
import * as cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";

export const useCornerstone = () => {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStack, setCurrentStack] = useState<string[]>([]);
  const toolsRegistered = useRef(false);
  const stackScrollActivated = useRef(false);
  const isLoadingStack = useRef(false);
  const webWorkerInitialized = useRef(false);

  // Khởi tạo Cornerstone và các dependencies
  useEffect(() => {
    try {
      // Kiểm tra cornerstone có sẵn không
      if (typeof cornerstone === "undefined") {
        throw new Error("Cornerstone is not loaded");
      }

      // Thiết lập external dependencies
      cornerstoneTools.external.cornerstone = cornerstone;
      cornerstoneWADOImageLoader.external.cornerstone = cornerstone;

      // Thiết lập dicomParser nếu có
      if ((window as any).dicomParser) {
        cornerstoneWADOImageLoader.external.dicomParser = (
          window as any
        ).dicomParser;
      } else {
        console.warn("dicomParser not found, wadouri may not work properly");
      }

      // Đăng ký các image loader
      cornerstoneWADOImageLoader.wadouri.register(cornerstone);
      cornerstoneWADOImageLoader.wadors.register(cornerstone);

      // Khởi tạo web workers với cấu hình đơn giản hơn
      if (!webWorkerInitialized.current) {
        try {
          console.log("Initializing web workers...");

          // Cấu hình đơn giản nhất có thể
          cornerstoneWADOImageLoader.webWorkerManager.initialize({
            maxWebWorkers: 1,
            startWebWorkersOnDemand: true,
            webWorkerPath: "/cornerstoneWADOImageLoaderWebWorker.js", // Đảm bảo file này tồn tại trong thư mục public
            taskConfiguration: {
              decodeTask: {
                initializeCodecsOnStartup: false,
                usePDFJS: false,
              },
            },
          });

          webWorkerInitialized.current = true;
          console.log("Web workers initialized successfully");
        } catch (e) {
          console.error("Error initializing web workers:", e);
          // Tiếp tục ngay cả khi web workers không khởi tạo được
        }
      }

      // Khởi tạo cornerstone tools
      cornerstoneTools.init({
        mouseEnabled: true,
        touchEnabled: true,
      });

      // Đăng ký các công cụ cần thiết
      if (!toolsRegistered.current) {
        try {
          if ((cornerstoneTools as any).StackScrollMouseWheelTool) {
            cornerstoneTools.addTool(
              (cornerstoneTools as any).StackScrollMouseWheelTool
            );
          }

          if ((cornerstoneTools as any).PanTool) {
            cornerstoneTools.addTool((cornerstoneTools as any).PanTool);
          }

          if ((cornerstoneTools as any).ZoomTool) {
            cornerstoneTools.addTool((cornerstoneTools as any).ZoomTool);
          }

          toolsRegistered.current = true;
          console.log("Tools registered successfully");
        } catch (e) {
          console.warn("Error registering tools:", e);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error initializing Cornerstone"
      );
      console.error("Error initializing Cornerstone:", err);
    }
  }, []);

  // Kích hoạt và vô hiệu hóa element
  useEffect(() => {
    // Chỉ kích hoạt nếu element tồn tại
    if (elementRef.current) {
      try {
        console.log("Enabling element for Cornerstone");
        cornerstone.enable(elementRef.current);
        setIsEnabled(true);
        setError(null);
        console.log("Element enabled successfully");
      } catch (err) {
        console.error("Error enabling element:", err);
        setError("Error enabling element");
      }
    }

    // Cleanup khi component unmount
    return () => {
      if (elementRef.current && isEnabled) {
        try {
          // Vô hiệu hóa element một cách an toàn
          console.log("Disabling element...");
          cornerstone.disable(elementRef.current);
          console.log("Element disabled successfully");
        } catch (err) {
          console.warn("Error disabling element:", err);
        }
      }
    };
  }, [elementRef.current]);

  // Tải và hiển thị hình ảnh
  const loadImage = useCallback(
    async (imageId: string) => {
      if (!elementRef.current || !isEnabled) {
        console.error("Element not ready or not enabled");
        return null;
      }

      try {
        console.log("Loading image:", imageId);

        const image = await cornerstone.loadImage(imageId);

        console.log("Image loaded, displaying...");

        // Tạo viewport mặc định dựa trên hình ảnh
        const viewport = cornerstone.getDefaultViewportForImage(
          elementRef.current,
          image
        );

        // Điều chỉnh các tham số hiển thị để tránh vỡ hình
        viewport.scale = 1.0; // Đặt tỷ lệ ban đầu là 1.0
        viewport.translation = { x: 0, y: 0 }; // Đặt vị trí ban đầu ở giữa
        viewport.voi = {
          windowWidth: image.windowWidth || 600,
          windowCenter: image.windowCenter || 400,
        };

        // Hiển thị hình ảnh với viewport đã cấu hình
        cornerstone.displayImage(elementRef.current, image, viewport);

        return image;
      } catch (err) {
        console.error("Error loading image:", err);
        setError("Error loading image");
        return null;
      }
    },
    [elementRef, isEnabled]
  );

  // Tải và hiển thị stack hình ảnh
  const loadImageStack = useCallback(
    async (imageIds: string[]) => {
      console.log("loadImageStack called with", imageIds.length, "images");

      if (!elementRef.current) {
        console.error("Element ref is null");
        return false;
      }

      if (!isEnabled) {
        console.error("Element is not enabled");
        return false;
      }

      if (isLoadingStack.current) {
        console.log("Already loading a stack, skipping");
        return false;
      }

      if (imageIds.length === 0) {
        console.error("Empty imageIds array");
        return false;
      }

      // Đánh dấu đang tải
      isLoadingStack.current = true;

      try {
        // Lưu stack hiện tại
        setCurrentStack(imageIds);

        // Làm sạch URL hình ảnh
        const cleanedImageIds = imageIds.map((id) => {
          // Loại bỏ dấu backtick và khoảng trắng thừa
          let cleanId = id.replace(/`/g, "").trim();

          // Loại bỏ khoảng trắng giữa các phần của URL
          cleanId = cleanId.replace(/\s+/g, "");

          // Đảm bảo URL bắt đầu bằng wadouri: (không có khoảng trắng)
          if (cleanId.startsWith("wadouri: ")) {
            cleanId = "wadouri:" + cleanId.substring(9);
          }

          // Nếu URL không có tiền tố, thêm vào
          if (
            !cleanId.startsWith("wadouri:") &&
            !cleanId.startsWith("wadors:")
          ) {
            return `wadouri:${cleanId}`;
          }

          return cleanId;
        });

        console.log("Loading first image:", cleanedImageIds[0]);

        // Tải hình ảnh đầu tiên
        const image = await cornerstone.loadImage(cleanedImageIds[0]);

        console.log("First image loaded, displaying...");

        // Tạo viewport mặc định dựa trên hình ảnh
        const viewport = cornerstone.getDefaultViewportForImage(
          elementRef.current,
          image
        );

        // Điều chỉnh các tham số hiển thị để tránh vỡ hình
        viewport.scale = 1.0; // Đặt tỷ lệ ban đầu là 1.0
        viewport.translation = { x: 0, y: 0 }; // Đặt vị trí ban đầu ở giữa
        viewport.voi = {
          windowWidth: image.windowWidth || 400,
          windowCenter: image.windowCenter || 200,
        };

        // Hiển thị hình ảnh với viewport đã cấu hình
        cornerstone.displayImage(elementRef.current, image, viewport);
        console.log("First image displayed");

        // Thiết lập stack state
        console.log("Setting up stack tools");
        const stack = {
          currentImageIdIndex: 0,
          imageIds: [...cleanedImageIds],
        };

        // Xóa stack cũ trước khi thêm mới
        try {
          cornerstoneTools.clearToolState(elementRef.current, "stack");
          console.log("Cleared previous stack state");
        } catch (e) {
          console.warn("Error clearing stack tool state:", e);
        }

        // Thêm stack mới
        try {
          cornerstoneTools.addToolState(elementRef.current, "stack", stack);
          console.log("Stack tool state added");
        } catch (e) {
          console.warn("Error adding stack tool state:", e);
        }

        // Kích hoạt công cụ cuộn nếu chưa được kích hoạt
        if (!stackScrollActivated.current) {
          try {
            console.log("Activating StackScrollMouseWheel tool");
            cornerstoneTools.setToolActive("StackScrollMouseWheel", {
              mouseButtonMask: 1,
            });
            stackScrollActivated.current = true;
            console.log("StackScrollMouseWheel activated");
          } catch (e) {
            console.warn("Error activating scroll tool:", e);
          }
        }

        // Thêm xử lý sự kiện resize
        const handleResize = () => {
          if (elementRef.current) {
            console.log("Resizing cornerstone element");
            cornerstone.resize(elementRef.current);
          }
        };

        window.addEventListener("resize", handleResize);

        // Đảm bảo kích thước ban đầu chính xác
        cornerstone.resize(elementRef.current);

        console.log("Image stack loaded successfully");
        return true;
      } catch (err) {
        console.error("Error loading image stack:", err);
        setError("Error loading image stack");
        return false;
      } finally {
        // Đánh dấu đã tải xong
        isLoadingStack.current = false;
      }
    },
    [elementRef, isEnabled]
  );

  // Cuộn đến hình ảnh theo index
  const scrollToIndex = useCallback(
    async (index: number) => {
      if (!elementRef.current || !isEnabled || currentStack.length === 0) {
        return false;
      }

      if (index < 0 || index >= currentStack.length) {
        return false;
      }

      try {
        console.log("Scrolling to index", index);

        // Lấy stack state
        const stackState = cornerstoneTools.getToolState(
          elementRef.current,
          "stack"
        );

        if (stackState && stackState.data && stackState.data.length > 0) {
          // Cập nhật index hiện tại
          stackState.data[0].currentImageIdIndex = index;

          // Lưu viewport hiện tại
          const viewport = cornerstone.getViewport(elementRef.current);

          // Tải và hiển thị hình ảnh mới
          console.log(
            "Loading image at index",
            index,
            ":",
            currentStack[index]
          );
          const image = await cornerstone.loadImage(currentStack[index]);

          // Giữ nguyên các tham số viewport hiện tại nhưng cập nhật VOI nếu cần
          if (
            !viewport.voi ||
            !viewport.voi.windowWidth ||
            !viewport.voi.windowCenter
          ) {
            viewport.voi = {
              windowWidth: image.windowWidth || 400,
              windowCenter: image.windowCenter || 200,
            };
          }

          console.log("Displaying image");
          cornerstone.displayImage(elementRef.current, image, viewport);

          console.log("Scrolled to index", index, "successfully");
          return true;
        } else {
          console.warn("No stack state found");
          return false;
        }
      } catch (err) {
        console.error("Error scrolling to index:", err);
        return false;
      }
    },
    [elementRef, isEnabled, currentStack]
  );

  // Thêm hàm để xử lý việc thay đổi kích thước viewport
  const resizeViewport = useCallback(() => {
    if (elementRef.current && isEnabled) {
      console.log("Manually resizing viewport");
      cornerstone.resize(elementRef.current);
    }
  }, [elementRef, isEnabled]);

  // Thêm hàm để reset viewport về kích thước ban đầu
  const resetViewport = useCallback(() => {
    if (!elementRef.current || !isEnabled || currentStack.length === 0) {
      return false;
    }

    try {
      console.log("Resetting viewport");

      // Lấy hình ảnh hiện tại
      const image = cornerstone.getImage(elementRef.current);

      if (image) {
        // Tạo viewport mặc định mới
        const viewport = cornerstone.getDefaultViewportForImage(
          elementRef.current,
          image
        );

        // Đặt lại các tham số
        viewport.scale = 1.0;
        viewport.translation = { x: 0, y: 0 };
        viewport.voi = {
          windowWidth: image.windowWidth || 400,
          windowCenter: image.windowCenter || 200,
        };

        // Áp dụng viewport mới
        cornerstone.setViewport(elementRef.current, viewport);
        cornerstone.updateImage(elementRef.current);

        return true;
      }
      return false;
    } catch (err) {
      console.error("Error resetting viewport:", err);
      return false;
    }
  }, [elementRef, isEnabled, currentStack]);

  return {
    element: elementRef,
    loadImage,
    loadImageStack,
    scrollToIndex,
    resizeViewport,
    resetViewport,
    isEnabled,
    error,
    cornerstone,
  };
};
