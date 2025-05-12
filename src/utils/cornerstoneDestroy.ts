import { cache, getRenderingEngines } from "@cornerstonejs/core";
import { ToolGroupManager } from "@cornerstonejs/tools";

export const cornerstoneDestroy = async () => {
  try {
    // Hủy tất cả các rendering engine
    const renderingEngines = getRenderingEngines();
    if (renderingEngines && renderingEngines.length > 0) {
      renderingEngines.forEach((engine) => {
        if (engine) {
          engine.destroy();
        }
      });
    }

    // Hủy tất cả các toolGroup
    const toolGroups = ToolGroupManager.getAllToolGroups();
    if (toolGroups && toolGroups.length > 0) {
      toolGroups.forEach((toolGroup) => {
        const toolGroupId = toolGroup.id;
        if (toolGroupId) {
          ToolGroupManager.destroyToolGroup(toolGroupId);
        }
      });
    }

    // Xóa cache
    cache.purgeCache();
  } catch (error) {
    console.error("Lỗi khi dọn dẹp Cornerstone:", error);
  }
};
