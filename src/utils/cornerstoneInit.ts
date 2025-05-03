import * as cornerstone from "cornerstone-core";
import * as cornerstoneTools from "cornerstone-tools";
import * as cornerstoneMath from "cornerstone-math";
import * as cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import * as dicomParser from "dicom-parser";
import { configureSegmentation } from "./cornerstoneSegmentationConfig";

// Biến toàn cục để theo dõi trạng thái khởi tạo
let isInitialized = false;

export function initCornerstone() {
  // Nếu đã khởi tạo rồi thì không khởi tạo lại
  if (isInitialized) {
    console.log(
      "Cornerstone đã được khởi tạo trước đó, không cần khởi tạo lại"
    );
    return true;
  }

  try {
    // Thiết lập external dependencies
    cornerstoneTools.external.cornerstone = cornerstone;
    cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
    cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
    cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

    // Kiểm tra Hammer.js
    if (window.Hammer) {
      cornerstoneTools.external.Hammer = window.Hammer;
      console.log("Hammer.js đã được tìm thấy và khởi tạo");
    } else {
      console.warn(
        "Hammer.js không được tìm thấy. Một số công cụ tương tác có thể không hoạt động."
      );
    }

    // Khởi tạo cornerstone tools với cấu hình an toàn
    cornerstoneTools.init({
      showSVGCursors: true,
      mouseEnabled: true,
      touchEnabled: true,
      globalToolSyncEnabled: false,
    });

    // Cấu hình segmentation để tránh cảnh báo colorLUT
    configureSegmentation();

    // Đăng ký các công cụ cơ bản
    cornerstoneTools.addTool(cornerstoneTools.WwwcTool);
    cornerstoneTools.addTool(cornerstoneTools.PanTool);
    cornerstoneTools.addTool(cornerstoneTools.ZoomTool);
    cornerstoneTools.addTool(cornerstoneTools.StackScrollTool);
    cornerstoneTools.addTool(cornerstoneTools.StackScrollMouseWheelTool);
    cornerstoneTools.addTool(cornerstoneTools.MagnifyTool);
    cornerstoneTools.addTool(cornerstoneTools.RectangleRoiTool);
    cornerstoneTools.addTool(cornerstoneTools.EllipticalRoiTool);
    cornerstoneTools.addTool(cornerstoneTools.AngleTool);
    cornerstoneTools.addTool(cornerstoneTools.LengthTool);

    // Cấu hình WADO Image Loader
    cornerstoneWADOImageLoader.webWorkerManager.initialize({
      maxWebWorkers: navigator.hardwareConcurrency || 2,
      startWebWorkersOnDemand: true,
      taskConfiguration: {
        decodeTask: {
          loadCodecsOnStartup: true,
          initializeCodecsOnStartup: true,
          codecsPath: "/cornerstoneWADOImageLoaderCodecs.js",
          usePDFJS: false,
        },
      },
    });

    // Đăng ký các image loaders - sử dụng phương thức register thay vì registerImageLoader
    if (cornerstoneWADOImageLoader.wadouri) {
      cornerstoneWADOImageLoader.wadouri.register(cornerstone);
    }
    if (cornerstoneWADOImageLoader.wadors) {
      cornerstoneWADOImageLoader.wadors.register(cornerstone);
    }

    // Cấu hình WADO URI Loader
    cornerstoneWADOImageLoader.configure({
      beforeSend: function (xhr: XMLHttpRequest) {
        // Thêm header cho WADO URI requests
        xhr.setRequestHeader(
          "Accept",
          "multipart/related; type=application/dicom; transfer-syntax=*"
        );
        // Thêm header để tránh cache
        xhr.setRequestHeader(
          "Cache-Control",
          "no-cache, no-store, must-revalidate"
        );
        xhr.setRequestHeader("Pragma", "no-cache");
        xhr.setRequestHeader("Expires", "0");
      },
      useWebWorkers: true,
      decodeConfig: {
        convertFloatPixelDataToInt: false,
        use16Bits: true,
        preservePixelData: true,
        // Thêm cấu hình để xử lý hình ảnh tốt hơn
        maxWebWorkers: navigator.hardwareConcurrency || 4,
        webWorkerTaskPriority: 5,
        strict: false,
      },
    });

    // Cấu hình thêm cho cornerstone
    cornerstone.imageCache.setMaximumSizeBytes(1024 * 1024 * 128); // 128MB cache

    // Vô hiệu hóa cache cho các frames
    cornerstone.imageCache.setMaximumSizeBytes(0);

    // Gán vào window để các component khác có thể sử dụng
    (window as any).cornerstone = cornerstone;
    (window as any).cornerstoneTools = cornerstoneTools;
    (window as any).cornerstoneWADOImageLoader = cornerstoneWADOImageLoader;
    (window as any).dicomParser = dicomParser;

    // Đánh dấu đã khởi tạo
    isInitialized = true;

    console.log("Cornerstone đã được khởi tạo thành công");
    return true;
  } catch (error) {
    console.error("Lỗi khi khởi tạo Cornerstone:", error);
    return false;
  }
}

// Hàm kiểm tra xem Cornerstone đã được khởi tạo chưa
export function isCornerstoneInitialized() {
  return isInitialized;
}

// Hàm để tải và hiển thị ảnh
export function loadAndDisplayImage(imageId: string, element: HTMLElement) {
  try {
    // Bật cornerstone cho element
    cornerstone.enable(element);

    // Sửa lại phương thức tải ảnh phù hợp với phiên bản cornerstone của bạn
    // Thay vì loadAndCacheImage, có thể bạn cần sử dụng loadImage
    cornerstone
      .loadImage(imageId)
      .then((image: any) => {
        cornerstone.displayImage(element, image);
        console.log("Đã tải và hiển thị ảnh thành công:", imageId);
      })
      .catch((error: any) => {
        console.error("Lỗi khi tải ảnh:", error, imageId);
      });
  } catch (error) {
    console.error("Lỗi khi enable cornerstone hoặc tải ảnh:", error);
  }
}

export function activateTool(toolName: string, element: HTMLElement) {
  try {
    cornerstoneTools.setToolActive(toolName, { mouseButtonMask: 1 });
    console.log(`Đã kích hoạt công cụ: ${toolName}`);
  } catch (error) {
    console.error(`Lỗi khi kích hoạt công cụ ${toolName}:`, error);
  }
}
