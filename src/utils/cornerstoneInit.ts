import { init as initCornerstone3D } from "@cornerstonejs/core";
import {
  init as initCornerstoneTools,
  ToolGroupManager,
  addTool,
  PanTool,
  ZoomTool,
  LengthTool,
  ProbeTool,
  AngleTool,
  WindowLevelTool,
  StackScrollTool,
  BidirectionalTool,
  ArrowAnnotateTool,
  RectangleROITool,
  EllipticalROITool,
  CircleROITool,
  PlanarFreehandROITool,
  SplineROITool,
  AnnotationTool,
} from "@cornerstonejs/tools";
import { init as initDicomImagaLoader } from "@cornerstonejs/dicom-image-loader";

export const initCornerstone = async () => {
  try {
    // Khởi tạo Cornerstone3D
    await initCornerstone3D();

    // Khởi tạo công cụ
    await initCornerstoneTools();

    // Cấu hình cho AnnotationTool
    const annotationConfiguration = {
      getTextCallback: (callback: any, eventDetail: any) => {
        const text = prompt("Nhập nội dung chú thích:");
        if (text) {
          callback(text);
        }
      },
    };

    // Đăng ký các công cụ cần thiết
    addTool(PanTool);
    addTool(ZoomTool);
    addTool(LengthTool);
    addTool(ProbeTool);
    addTool(AngleTool);
    addTool(WindowLevelTool);
    addTool(StackScrollTool);

    addTool(BidirectionalTool);
    addTool(ArrowAnnotateTool);
    addTool(RectangleROITool);
    addTool(EllipticalROITool);
    addTool(CircleROITool);
    addTool(PlanarFreehandROITool);
    addTool(SplineROITool);

    // Khởi tạo DICOM Image Loader
    initDicomImagaLoader();

    // Tạo tool group mặc định
    const toolGroupId = "default";
    const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);

    if (toolGroup) {
      // Thêm các công cụ vào toolGroup
      toolGroup.addTool(PanTool.toolName);
      toolGroup.addTool(ZoomTool.toolName);
      toolGroup.addTool(WindowLevelTool.toolName);
      toolGroup.addTool(LengthTool.toolName);
      toolGroup.addTool(AngleTool.toolName);
      toolGroup.addTool(ProbeTool.toolName);
      toolGroup.addTool(StackScrollTool.toolName);
      toolGroup.addTool(BidirectionalTool.toolName);
      toolGroup.addTool(RectangleROITool.toolName);
      toolGroup.addTool(ArrowAnnotateTool.toolName);
      toolGroup.addTool(EllipticalROITool.toolName);
      toolGroup.addTool(CircleROITool.toolName);
      toolGroup.addTool(PlanarFreehandROITool.toolName);
      toolGroup.addTool(SplineROITool.toolName);

      // Cấu hình đặc biệt cho AnnotationTool
      toolGroup.setToolConfiguration(
        AnnotationTool.toolName,
        annotationConfiguration
      );

      // Thiết lập công cụ mặc định
      toolGroup.setToolActive(WindowLevelTool.toolName, {
        bindings: [{ mouseButton: 1 }],
      });

      // Thiết lập StackScrollTool với binding chuột giữa
      toolGroup.setToolActive(StackScrollTool.toolName, {
        bindings: [{ mouseButton: 2 }], // Chuột giữa
      });

      // Sử dụng mouseButton: 4 để đại diện cho wheel event
      toolGroup.setToolActive(StackScrollTool.toolName, {
        bindings: [{ mouseButton: 4 }],
      });
    }

    return true;
  } catch (error) {
    console.error("Lỗi khi khởi tạo Cornerstone:", error);
    return false;
  }
};
