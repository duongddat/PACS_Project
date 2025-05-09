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

    cornerstoneTools.addTool(cornerstoneTools.BidirectionalTool);
    cornerstoneTools.addTool(cornerstoneTools.AnnotationTool);
    cornerstoneTools.addTool(cornerstoneTools.EllipticalROITool);
    cornerstoneTools.addTool(cornerstoneTools.CircleROITool);
    cornerstoneTools.addTool(cornerstoneTools.PlanarFreehandROITool);
    cornerstoneTools.addTool(cornerstoneTools.SplineROITool);
    // Khởi tạo DICOM Image Loader
    dicomImageLoader.init();

    // Tạo tool group mặc định
    const toolGroupId = "default";
    const toolGroup =
      cornerstoneTools.ToolGroupManager.createToolGroup(toolGroupId);

    if (toolGroup) {
      // Thêm các công cụ vào toolGroup
      toolGroup.addTool(cornerstoneTools.PanTool.toolName);
      toolGroup.addTool(cornerstoneTools.ZoomTool.toolName);
      toolGroup.addTool(cornerstoneTools.WindowLevelTool.toolName);
      toolGroup.addTool(cornerstoneTools.LengthTool.toolName);
      toolGroup.addTool(cornerstoneTools.ProbeTool.toolName);
      toolGroup.addTool(cornerstoneTools.StackScrollTool.toolName);
      toolGroup.addTool(cornerstoneTools.BidirectionalTool.toolName);
      toolGroup.addTool(cornerstoneTools.AnnotationTool.toolName);
      toolGroup.addTool(cornerstoneTools.EllipticalROITool.toolName);
      toolGroup.addTool(cornerstoneTools.CircleROITool.toolName);
      toolGroup.addTool(cornerstoneTools.PlanarFreehandROITool.toolName);
      toolGroup.addTool(cornerstoneTools.SplineROITool.toolName);

      // Thiết lập công cụ mặc định
      toolGroup.setToolActive(cornerstoneTools.WindowLevelTool.toolName, {
        bindings: [{ mouseButton: 1 }],
      });

      // Thiết lập StackScrollTool với binding chuột giữa
      toolGroup.setToolActive(cornerstoneTools.StackScrollTool.toolName, {
        bindings: [{ mouseButton: 2 }], // Chuột giữa
      });

      // Sử dụng mouseButton: 4 để đại diện cho wheel event
      toolGroup.setToolActive(cornerstoneTools.StackScrollTool.toolName, {
        bindings: [{ mouseButton: 4 }],
      });
    }

    console.log("Cornerstone đã được khởi tạo thành công");
    return true;
  } catch (error) {
    console.error("Lỗi khi khởi tạo Cornerstone:", error);
    return false;
  }
};
