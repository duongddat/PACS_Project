import * as cornerstone from "@cornerstonejs/core";
import * as cornerstoneTools from "@cornerstonejs/tools";
import * as dicomImageLoader from "@cornerstonejs/dicom-image-loader";

export const initCornerstone = async () => {
  try {
    // Khởi tạo Cornerstone3D
    await cornerstone.init();

    // Khởi tạo công cụ
    await cornerstoneTools.init();

    // Đăng ký các công cụ cần thiết
    cornerstoneTools.addTool(cornerstoneTools.PanTool);
    cornerstoneTools.addTool(cornerstoneTools.ZoomTool);
    cornerstoneTools.addTool(cornerstoneTools.LengthTool);
    cornerstoneTools.addTool(cornerstoneTools.ProbeTool);
    cornerstoneTools.addTool(cornerstoneTools.WindowLevelTool);
    cornerstoneTools.addTool(cornerstoneTools.StackScrollTool);

    // Khởi tạo DICOM Image Loader
    dicomImageLoader.init();

    // Tạo tool group mặc định
    const toolGroupId = "default";
    cornerstoneTools.ToolGroupManager.createToolGroup(toolGroupId);

    console.log("Cornerstone đã được khởi tạo thành công");
    return true;
  } catch (error) {
    console.error("Lỗi khi khởi tạo Cornerstone:", error);
    return false;
  }
};
