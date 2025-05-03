import { useEffect, useRef, useState } from "react";
import { initCornerstone } from "../utils/cornerstoneInit";

export const useCornerstone = () => {
  const element = useRef<HTMLDivElement>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cornerstoneInitializedRef = useRef(false);

  // Khởi tạo Cornerstone
  useEffect(() => {
    if (!element.current || cornerstoneInitializedRef.current) return;

    const initializeCornerstone = async () => {
      try {
        // Đảm bảo Cornerstone được khởi tạo trước
        if (!(window as any).cornerstone || !(window as any).cornerstoneTools) {
          // Thử khởi tạo lại từ utility function
          const initialized = initCornerstone();
          if (!initialized) {
            throw new Error(
              "Không thể khởi tạo Cornerstone và CornerstoneTools"
            );
          }
          console.log("Đã khởi tạo lại Cornerstone từ useCornerstone hook");
        }

        const cornerstone = (window as any).cornerstone;
        const cornerstoneTools = (window as any).cornerstoneTools;

        // Kích hoạt element
        cornerstone.enable(element.current);

        // Đảm bảo các công cụ cần thiết được đăng ký
        if (cornerstoneTools.StackScrollTool) {
          cornerstoneTools.addTool(cornerstoneTools.StackScrollTool);
        }
        if (cornerstoneTools.ZoomTool) {
          cornerstoneTools.addTool(cornerstoneTools.ZoomTool);
        }
        if (cornerstoneTools.PanTool) {
          cornerstoneTools.addTool(cornerstoneTools.PanTool);
        }
        if (cornerstoneTools.LengthTool) {
          cornerstoneTools.addTool(cornerstoneTools.LengthTool);
        }
        if (cornerstoneTools.AngleTool) {
          cornerstoneTools.addTool(cornerstoneTools.AngleTool);
        }

        // Kích hoạt công cụ mặc định
        cornerstoneTools.setToolActive("StackScroll", { mouseButtonMask: 1 });

        cornerstoneInitializedRef.current = true;
        setIsEnabled(true);
        console.log("Cornerstone đã được kích hoạt thành công cho element");
      } catch (err: any) {
        console.error("Lỗi khi khởi tạo Cornerstone:", err);
        setError(err.message);
      }
    };

    // Thêm xử lý sự kiện resize
    const handleResize = () => {
      if (element.current && (window as any).cornerstone) {
        (window as any).cornerstone.resize(element.current);
      }
    };

    window.addEventListener('resize', handleResize);

    initializeCornerstone();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (element.current && (window as any).cornerstone) {
        try {
          (window as any).cornerstone.disable(element.current);
        } catch (err) {
          console.error("Lỗi khi vô hiệu hóa Cornerstone:", err);
        }
      }
    };
  }, []);

  // Hàm tải stack hình ảnh
  const loadImageStack = async (imageIds: string[]) => {
    if (!element.current || !isEnabled || imageIds.length === 0) {
      console.log(
        "Không thể tải stack hình ảnh: element không tồn tại hoặc không được bật hoặc không có imageIds"
      );
      return false;
    }

    try {
      const cornerstone = (window as any).cornerstone;
      const cornerstoneTools = (window as any).cornerstoneTools;

      if (!cornerstone || !cornerstoneTools) {
        console.error(
          "Cornerstone hoặc CornerstoneTools không được tìm thấy trong window object"
        );

        // Thử khởi tạo lại
        const initialized = initCornerstone();
        if (
          !initialized ||
          !(window as any).cornerstone ||
          !(window as any).cornerstoneTools
        ) {
          throw new Error(
            "Cornerstone hoặc CornerstoneTools không được tìm thấy và không thể khởi tạo lại"
          );
        }
      }

      console.log("Đang tải hình ảnh với imageIds:", imageIds);

      // Xóa cache trước khi tải hình ảnh mới
      cornerstone.imageCache.purgeCache();

      // Đảm bảo URL có tiền tố đúng (wadouri: hoặc wadors:) và không có ký tự đặc biệt
      const formattedImageIds = imageIds.map((id) => {
        // Loại bỏ dấu backtick và khoảng trắng thừa
        let cleanId = id.replace(/`/g, "").trim();
        
        // Loại bỏ khoảng trắng giữa các phần của URL
        cleanId = cleanId.replace(/\s+/g, "");
        
        // Đảm bảo URL bắt đầu bằng wadouri: (không có khoảng trắng)
        if (cleanId.startsWith("wadouri: ")) {
          cleanId = "wadouri:" + cleanId.substring(9);
        }
        
        // Nếu URL không có tiền tố, thêm vào
        if (!cleanId.startsWith("wadouri:") && !cleanId.startsWith("wadors:")) {
          return `wadouri:${cleanId}`;
        }
        
        return cleanId;
      });

      console.log("URL hình ảnh đã được làm sạch:", formattedImageIds);

      // Tải hình ảnh đầu tiên với các tùy chọn hiển thị
      const firstImage = await cornerstone.loadAndCacheImage(
        formattedImageIds[0]
      );

      // Cấu hình hiển thị hình ảnh
      const viewport = cornerstone.getDefaultViewportForImage(element.current, firstImage);
      
      // Điều chỉnh các tham số hiển thị để tránh vỡ hình
      viewport.voi = {
        windowWidth: firstImage.windowWidth || 400,
        windowCenter: firstImage.windowCenter || 200
      };
      viewport.pixelReplication = false;
      viewport.hflip = false;
      viewport.vflip = false;
      viewport.rotation = 0;
      viewport.scale = 1.0;

      // Hiển thị hình ảnh đầu tiên với viewport đã cấu hình
      cornerstone.displayImage(element.current, firstImage, viewport);

      // Khởi tạo stack tool
      if (typeof cornerstoneTools.addStackStateManager === "function") {
        cornerstoneTools.addStackStateManager(element.current);
      }

      // Xóa tool state cũ trước khi thêm mới
      cornerstoneTools.clearToolState(element.current, "stack");

      cornerstoneTools.addToolState(element.current, "stack", {
        currentImageIdIndex: 0,
        imageIds: formattedImageIds,
      });

      // Tải trước các hình ảnh khác với cùng cấu hình
      formattedImageIds.slice(1).forEach((imageId) => {
        cornerstone.loadImage(imageId).then((image: any) => {
          // Không hiển thị, chỉ tải trước
          console.log(`Đã tải trước hình ảnh: ${imageId}`);
        }).catch((error: any) => {
          console.error(`Lỗi khi tải trước hình ảnh ${imageId}:`, error);
        });
      });

      return true;
    } catch (err: any) {
      console.error("Lỗi khi tải stack hình ảnh:", err);
      setError(err.message);
      return false;
    }
  };

  // Hàm cuộn đến chỉ số cụ thể
  const scrollToIndex = (index: number) => {
    if (!element.current || !isEnabled) {
      return false;
    }

    try {
      const cornerstone = (window as any).cornerstone;
      const cornerstoneTools = (window as any).cornerstoneTools;

      if (!cornerstone || !cornerstoneTools) {
        throw new Error(
          "Cornerstone hoặc CornerstoneTools không được tìm thấy"
        );
      }

      const stackState = cornerstoneTools.getToolState(
        element.current,
        "stack"
      );

      if (stackState && stackState.data && stackState.data.length > 0) {
        const imageIds = stackState.data[0].imageIds;

        if (index >= 0 && index < imageIds.length) {
          stackState.data[0].currentImageIdIndex = index;
          cornerstone.updateImage(element.current);
          return true;
        }
      }

      return false;
    } catch (err: any) {
      console.error("Lỗi khi cuộn đến chỉ số:", err);
      return false;
    }
  };

  return { element, isEnabled, error, loadImageStack, scrollToIndex };
};
