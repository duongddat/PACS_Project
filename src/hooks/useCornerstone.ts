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
  const isLoadingStack = useRef(false); // Thêm biến để theo dõi trạng thái đang tải

  useEffect(() => {
    try {
      // Make sure cornerstone is available
      if (typeof cornerstone === 'undefined') {
        throw new Error('Cornerstone is not loaded');
      }
      
      // Ensure cornerstoneTools is properly initialized before setting external dependencies
      if (!cornerstoneTools || !cornerstoneTools.external) {
        throw new Error('CornerstoneTools is not properly loaded');
      }
      
      // Set external dependencies in the correct order
      cornerstoneTools.external.cornerstone = cornerstone;
      
      // Initialize cornerstone tools with proper configuration
      // Avoid using SUPPORT_POINTER_EVENTS directly
      cornerstoneTools.init({
        showSVGCursors: true,
        globalToolSyncEnabled: false,
        mouseEnabled: true,
        touchEnabled: true
      });
      
      // Initialize WADO Image Loader before registering tools
      if (cornerstoneWADOImageLoader && cornerstoneWADOImageLoader.external) {
        cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
        
        // Check if dicomParser exists in window
        if ((window as any).dicomParser) {
          cornerstoneWADOImageLoader.external.dicomParser = (window as any).dicomParser;
        }
        
        // Initialize web workers
        cornerstoneWADOImageLoader.webWorkerManager.initialize({
          maxWebWorkers: navigator.hardwareConcurrency || 2,
          startWebWorkersOnDemand: true,
        });
      }
      
      // Check if Hammer exists before setting it - do this after cornerstone init
      if ((window as any).Hammer) {
        cornerstoneTools.external.Hammer = (window as any).Hammer;
      } else {
        console.warn('Hammer.js not found. Some interaction tools may not work.');
        // Continue without Hammer - basic functionality should still work
      }
      
      // Register tools after initialization
      if (!toolsRegistered.current) {
        // Try-catch each tool registration separately
        try {
          // Check if tool exists before adding - use type assertion to avoid TypeScript errors
          if ((cornerstoneTools as any).StackScrollMouseWheelTool) {
            cornerstoneTools.addTool((cornerstoneTools as any).StackScrollMouseWheelTool);
            console.log("StackScrollMouseWheelTool registered during initialization");
          }
        } catch (e) {
          console.warn("Could not register StackScrollMouseWheelTool:", e);
        }
        
        // Add other essential tools
        try {
          if (cornerstoneTools.PanTool) cornerstoneTools.addTool(cornerstoneTools.PanTool);
          if (cornerstoneTools.ZoomTool) cornerstoneTools.addTool(cornerstoneTools.ZoomTool);
          if (cornerstoneTools.WwwcTool) cornerstoneTools.addTool(cornerstoneTools.WwwcTool);
          if (cornerstoneTools.StackScrollTool) cornerstoneTools.addTool(cornerstoneTools.StackScrollTool);
        } catch (e) {
          console.warn("Could not register some tools:", e);
        }
        
        toolsRegistered.current = true;
      }
      
      // Enable the element if it exists
      if (elementRef.current) {
        cornerstone.enable(elementRef.current);
        setIsEnabled(true);
        setError(null);
      }

      return () => {
        if (elementRef!.current) {
          // Cleanup tất cả tools
          cornerstoneTools.clearToolState(elementRef!.current);
          // Disable element
          const element = elementRef!.current;
          if (element) {
            cornerstone.disable(element);
          }
        }
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Cornerstone initialization error:", errorMessage);
    }
  }, []);

  const loadImage = async (imageId: string) => {
    if (!elementRef.current || !isEnabled) return;

    try {
      const image = await cornerstone.loadImage(imageId);
      await cornerstone.displayImage(elementRef.current, image);
      setError(null);
      return image;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error loading image";
      setError(errorMessage);
      console.error("Image loading error:", errorMessage);
    }
  };

  // Sử dụng useCallback để tránh tạo hàm mới mỗi khi component re-render
  const loadImageStack = useCallback(async (imageIds: string[]) => {
    // Kiểm tra nếu đang tải, không thực hiện lại
    if (isLoadingStack.current || !elementRef.current || !isEnabled || imageIds.length === 0) return;
    
    // Kiểm tra nếu stack mới giống stack hiện tại, không tải lại
    if (currentStack.length > 0 && 
        currentStack.length === imageIds.length && 
        currentStack[0] === imageIds[0]) {
      console.log("Same image stack, skipping reload");
      return true;
    }
    
    // Đánh dấu đang tải
    isLoadingStack.current = true;

    try {
      // Lưu trữ stack hiện tại
      setCurrentStack(imageIds);

      // Tải ảnh đầu tiên
      const image = await cornerstone.loadImage(imageIds[0]);
      await cornerstone.displayImage(elementRef.current, image);

      // Thiết lập stack tool state
      const stack = {
        currentImageIdIndex: 0,
        imageIds: [...imageIds],
      };

      // Xóa stack tool state cũ
      try {
        cornerstoneTools.clearToolState(elementRef.current, "stack");
      } catch (e) {
        console.warn("Could not clear stack tool state:", e);
      }

      // Thêm stack mới vào tool state
      try {
        cornerstoneTools.addToolState(elementRef.current, "stack", stack);
      } catch (e) {
        console.error("Could not add stack tool state:", e);
      }

      // Chỉ kích hoạt công cụ cuộn nếu chưa được kích hoạt trước đó
      if (!stackScrollActivated.current) {
        let activated = false;
        
        // Kiểm tra xem công cụ đã được đăng ký chưa
        try {
          // Thử đăng ký lại nếu cần
          if (!(cornerstoneTools as any).getToolForElement(elementRef.current, "StackScrollMouseWheel")) {
            if ((cornerstoneTools as any).StackScrollMouseWheelTool) {
              cornerstoneTools.addTool((cornerstoneTools as any).StackScrollMouseWheelTool);
            }
          }
          
          // Thử kích hoạt StackScrollMouseWheel
          cornerstoneTools.setToolActive("StackScrollMouseWheel", {
            mouseButtonMask: 1,
          });
          activated = true;
          stackScrollActivated.current = true; // Đánh dấu đã kích hoạt
          console.log("StackScrollMouseWheel activated (once)");
        } catch (e) {
          console.warn("Could not activate StackScrollMouseWheel:", e);
        }

        // Nếu không thành công, thử kích hoạt StackScroll
        if (!activated) {
          try {
            // Kiểm tra xem công cụ đã được đăng ký chưa
            if (!(cornerstoneTools as any).getToolForElement(elementRef.current, "StackScroll")) {
              if ((cornerstoneTools as any).StackScrollTool) {
                cornerstoneTools.addTool((cornerstoneTools as any).StackScrollTool);
              }
            }
            
            cornerstoneTools.setToolActive("StackScroll", { mouseButtonMask: 1 });
            stackScrollActivated.current = true; // Đánh dấu đã kích hoạt
            console.log("StackScroll activated (once)");
          } catch (e) {
            console.error("Could not activate any stack scroll tool:", e);
          }
        }
      } else {
        console.log("Stack scroll tool already activated, skipping activation");
      }

      setError(null);
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error loading image stack";
      setError(errorMessage);
      console.error("Image stack loading error:", errorMessage);
      return false;
    } finally {
      // Đánh dấu đã tải xong
      isLoadingStack.current = false;
    }
  }, [isEnabled, currentStack]);

  const scrollToIndex = async (index: number) => {
    if (!elementRef.current || !isEnabled || currentStack.length === 0) return;

    if (index < 0 || index >= currentStack.length) {
      console.error("Invalid stack index:", index);
      return;
    }

    try {
      // Lấy stack state
      const stackState = cornerstoneTools.getToolState(
        elementRef.current,
        "stack"
      );
      if (stackState && stackState.data && stackState.data.length > 0) {
        // Cập nhật index hiện tại
        stackState.data[0].currentImageIdIndex = index;

        // Tải và hiển thị ảnh mới với hiệu ứng mượt mà
        const image = await cornerstone.loadImage(currentStack[index]);
        
        // Thêm hiệu ứng mượt mà khi chuyển frame
        const viewport = cornerstone.getViewport(elementRef.current);
        await cornerstone.displayImage(elementRef.current, image);
        cornerstone.setViewport(elementRef.current, viewport);
        
        // Kích hoạt sự kiện để cập nhật UI
        const event = new CustomEvent('cornerstoneimagerendered', {
          detail: {
            element: elementRef.current,
            image: image
          }
        });
        elementRef.current.dispatchEvent(event);
      }
    } catch (err) {
      console.error("Error scrolling to index:", err);
    }
  };

  return {
    element: elementRef,
    loadImage,
    loadImageStack,
    scrollToIndex,
    isEnabled,
    error,
  };
};
