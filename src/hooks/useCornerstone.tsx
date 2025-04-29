import { useEffect, useRef, useState } from "react";

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
        // Đảm bảo các thư viện đã được import
        const cornerstone = (window as any).cornerstone;
        const cornerstoneTools = (window as any).cornerstoneTools;
        
        if (!cornerstone) {
          throw new Error("Cornerstone không được tìm thấy");
        }
        
        if (!cornerstoneTools) {
          throw new Error("CornerstoneTools không được tìm thấy");
        }

        // Kích hoạt element
        cornerstone.enable(element.current);
        
        // Khởi tạo cornerstoneTools
        cornerstoneTools.init();
        
        // Đăng ký các công cụ cần thiết
        cornerstoneTools.addTool(cornerstoneTools.StackScrollTool);
        cornerstoneTools.addTool(cornerstoneTools.ZoomTool);
        cornerstoneTools.addTool(cornerstoneTools.PanTool);
        cornerstoneTools.addTool(cornerstoneTools.LengthTool);
        cornerstoneTools.addTool(cornerstoneTools.AngleTool);
        
        // Kích hoạt công cụ mặc định
        cornerstoneTools.setToolActive("StackScroll", { mouseButtonMask: 1 });
        
        cornerstoneInitializedRef.current = true;
        setIsEnabled(true);
      } catch (err: any) {
        console.error("Lỗi khi khởi tạo Cornerstone:", err);
        setError(err.message);
      }
    };

    initializeCornerstone();

    return () => {
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
      return false;
    }

    try {
      const cornerstone = (window as any).cornerstone;
      const cornerstoneTools = (window as any).cornerstoneTools;
      
      if (!cornerstone || !cornerstoneTools) {
        throw new Error("Cornerstone hoặc CornerstoneTools không được tìm thấy");
      }

      // Tải hình ảnh đầu tiên
      await cornerstone.loadAndCacheImage(imageIds[0]);
      
      // Hiển thị hình ảnh đầu tiên
      cornerstone.displayImage(element.current, await cornerstone.loadAndCacheImage(imageIds[0]));
      
      // Khởi tạo stack tool
      cornerstoneTools.addStackStateManager(element.current);
      cornerstoneTools.addToolState(element.current, "stack", {
        currentImageIdIndex: 0,
        imageIds: imageIds,
      });
      
      // Tải trước các hình ảnh khác
      imageIds.slice(1).forEach(imageId => {
        cornerstone.loadAndCacheImage(imageId);
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
        throw new Error("Cornerstone hoặc CornerstoneTools không được tìm thấy");
      }

      const stackState = cornerstoneTools.getToolState(element.current, "stack");
      
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