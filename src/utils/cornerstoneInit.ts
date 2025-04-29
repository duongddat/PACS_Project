import * as cornerstone from "cornerstone-core";
import * as cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import * as cornerstoneMath from "cornerstone-math";
import * as cornerstoneTools from "cornerstone-tools";
import * as dicomParser from "dicom-parser";

export function initCornerstone() {
  // Khởi tạo các thư viện
  cornerstoneTools.external.cornerstone = cornerstone;
  cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
  cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
  cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

  // Cấu hình WADO Image Loader
  cornerstoneWADOImageLoader.configure({
    useWebWorkers: false,
    decodeConfig: {
      convertFloatPixelDataToInt: false,
    },
  });

  // Cấu hình WADO URI Loader
  const config = {
    maxWebWorkers: navigator.hardwareConcurrency || 1,
    startWebWorkersOnDemand: true,
  };

  cornerstoneWADOImageLoader.webWorkerManager.initialize(config);

  // Bỏ dòng gây lỗi về dataSetCacheManager
  // cornerstoneWADOImageLoader.wadouri.dataSetCacheManager.purge();

  // Cấu hình CORS và headers
  cornerstoneWADOImageLoader.configure({
    beforeSend: function (xhr: XMLHttpRequest) {
      // Thêm header cho WADO URI requests
      xhr.setRequestHeader(
        "Accept",
        "multipart/related; type=application/dicom; transfer-syntax=*"
      );
    },
  });

  // Đăng ký các công cụ cơ bản
  cornerstoneTools.init({
    mouseEnabled: true,
    touchEnabled: true,
    globalToolSyncEnabled: false,
    showSVGCursors: true,
  });

  // Đăng ký các công cụ thường dùng
  cornerstoneTools.addTool(cornerstoneTools.WwwcTool);
  cornerstoneTools.addTool(cornerstoneTools.ZoomTool);
  cornerstoneTools.addTool(cornerstoneTools.PanTool);
  cornerstoneTools.addTool(cornerstoneTools.LengthTool);
  cornerstoneTools.addTool(cornerstoneTools.AngleTool);
  cornerstoneTools.addTool(cornerstoneTools.StackScrollTool);

  // Bỏ các công cụ không tồn tại hoặc thay thế bằng công cụ tương đương
  // cornerstoneTools.addTool(cornerstoneTools.StackScrollMouseWheelTool);
  cornerstoneTools.addTool(cornerstoneTools.MagnifyTool);
  cornerstoneTools.addTool(cornerstoneTools.RectangleRoiTool);

  // Bỏ công cụ không tồn tại
  // cornerstoneTools.addTool(cornerstoneTools.EllipticalRoiTool);

  console.log("Cornerstone đã được khởi tạo thành công");
}

// Hàm để tải và hiển thị ảnh
export function loadAndDisplayImage(imageId: string, element: HTMLElement) {
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
      console.error("Lỗi khi tải ảnh:", error);
    });
}

// Hàm để kích hoạt công cụ
export function activateTool(toolName: string, element: HTMLElement) {
  cornerstoneTools.setToolActive(toolName, { mouseButtonMask: 1 });
  console.log(`Đã kích hoạt công cụ: ${toolName}`);
}
