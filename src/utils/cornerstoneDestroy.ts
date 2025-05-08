import * as cornerstone from "@cornerstonejs/core";
import * as cornerstoneTools from "@cornerstonejs/tools";

export const cornerstoneDestroy = async () => {
  try {
    // Hủy tất cả các rendering engine
    const renderingEngines = cornerstone.getRenderingEngines();
    if (renderingEngines && renderingEngines.length > 0) {
      renderingEngines.forEach((engine) => {
        if (engine) {
          engine.destroy();
        }
      });
    }

    // Hủy tất cả các toolGroup
    const toolGroups = cornerstoneTools.ToolGroupManager.getAllToolGroups();
    if (toolGroups && toolGroups.length > 0) {
      toolGroups.forEach((toolGroup) => {
        const toolGroupId = toolGroup.id;
        if (toolGroupId) {
          cornerstoneTools.ToolGroupManager.destroyToolGroup(toolGroupId);
        }
      });
    }

    // Xóa cache
    cornerstone.cache.purgeCache();

    console.log("Đã dọn dẹp tài nguyên Cornerstone");
  } catch (error) {
    console.error("Lỗi khi dọn dẹp Cornerstone:", error);
  }
};
