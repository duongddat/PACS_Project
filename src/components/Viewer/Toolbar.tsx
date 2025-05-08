import React, { useState, useEffect } from "react";
import * as cornerstone from "@cornerstonejs/core";
import * as cornerstoneTools from "@cornerstonejs/tools";
import { useViewportStore } from "../../store/viewportStore";
import "./Toolbar.css";

interface ToolbarProps {
  viewportId: string;
}

const Toolbar: React.FC<ToolbarProps> = ({ viewportId }) => {
  const { viewports, nextImage, previousImage } = useViewportStore();
  const viewport = viewports[viewportId];
  const [activeTool, setActiveTool] = useState<string>(cornerstoneTools.WindowLevelTool.toolName);
  const renderingEngineId = `engine-${viewportId}`;
  const toolGroupId = `toolgroup-${viewportId}`;

  // Đảm bảo các công cụ được đăng ký khi component được mount
  useEffect(() => {
    // Đảm bảo các công cụ đã được đăng ký
    if (!cornerstoneTools.ToolGroupManager.getToolGroup(toolGroupId)) {
      return;
    }

    // Kích hoạt công cụ mặc định khi component được mount
    activateTool(cornerstoneTools.WindowLevelTool.toolName);
  }, [viewportId, toolGroupId]);

  // Kích hoạt công cụ
  const activateTool = (toolName: string) => {
    // Lấy toolGroup dựa trên viewportId
    const toolGroup = cornerstoneTools.ToolGroupManager.getToolGroup(toolGroupId);
    
    if (!toolGroup) {
      console.error(`Không tìm thấy toolGroup với ID: ${toolGroupId}`);
      return;
    }
    
    // Danh sách các công cụ cần vô hiệu hóa
    const toolsToDeactivate = [
      cornerstoneTools.WindowLevelTool.toolName,
      cornerstoneTools.PanTool.toolName,
      cornerstoneTools.ZoomTool.toolName,
      cornerstoneTools.LengthTool.toolName,
      cornerstoneTools.AngleTool.toolName,
    ];
    
    // Vô hiệu hóa tất cả các công cụ
    toolsToDeactivate.forEach(tool => {
      if (toolGroup.getToolInstance(tool)) {
        toolGroup.setToolPassive(tool);
      }
    });

    // Kích hoạt công cụ được chọn
    try {
      toolGroup.setToolActive(toolName, {
        bindings: [{ mouseButton: 1 }]
      });
      setActiveTool(toolName);
      console.log(`Đã kích hoạt công cụ: ${toolName}`);
    } catch (error) {
      console.error(`Lỗi khi kích hoạt công cụ ${toolName}:`, error);
    }
  };

  // Xử lý chuyển đến hình ảnh tiếp theo
  const handleNextImage = () => {
    if (viewportId) {
      nextImage(viewportId);
    }
  };

  // Xử lý chuyển đến hình ảnh trước đó
  const handlePreviousImage = () => {
    if (viewportId) {
      previousImage(viewportId);
    }
  };

  // Xử lý reset viewport
  const handleReset = () => {
    const renderingEngine = cornerstone.getRenderingEngine(renderingEngineId);
    if (!renderingEngine) return;
    
    const stackViewport = renderingEngine.getViewport(`viewport-${viewportId}`) as cornerstone.StackViewport;
    if (!stackViewport) return;
    
    // Reset viewport
    stackViewport.resetCamera();
    stackViewport.render();
  };

  return (
    <div className="toolbar">
      <div className="tool-group">
        <button
          className={`tool-button ${activeTool === cornerstoneTools.WindowLevelTool.toolName ? 'active' : ''}`}
          title="Điều chỉnh cửa sổ"
          onClick={() => activateTool(cornerstoneTools.WindowLevelTool.toolName)}
        >
          <i className="fas fa-adjust"></i>
        </button>
        <button
          className={`tool-button ${activeTool === cornerstoneTools.PanTool.toolName ? 'active' : ''}`}
          title="Di chuyển"
          onClick={() => activateTool(cornerstoneTools.PanTool.toolName)}
        >
          <i className="fas fa-hand-paper"></i>
        </button>
        <button
          className={`tool-button ${activeTool === cornerstoneTools.ZoomTool.toolName ? 'active' : ''}`}
          title="Phóng to/thu nhỏ"
          onClick={() => activateTool(cornerstoneTools.ZoomTool.toolName)}
        >
          <i className="fas fa-search-plus"></i>
        </button>
      </div>

      <div className="tool-group">
        <button
          className={`tool-button ${activeTool === cornerstoneTools.LengthTool.toolName ? 'active' : ''}`}
          title="Đo khoảng cách"
          onClick={() => activateTool(cornerstoneTools.LengthTool.toolName)}
        >
          <i className="fas fa-ruler"></i>
        </button>
        <button
          className={`tool-button ${activeTool === cornerstoneTools.AngleTool.toolName ? 'active' : ''}`}
          title="Đo góc"
          onClick={() => activateTool(cornerstoneTools.AngleTool.toolName)}
        >
          <i className="fas fa-ruler-combined"></i>
        </button>
      </div>

      <div className="tool-group">
        <button
          className="tool-button"
          title="Hình ảnh trước"
          onClick={handlePreviousImage}
          disabled={!viewport || viewport.currentImageIdIndex === 0}
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        <button
          className="tool-button"
          title="Hình ảnh tiếp theo"
          onClick={handleNextImage}
          disabled={
            !viewport ||
            viewport.currentImageIdIndex === viewport.imageIds.length - 1
          }
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>

      <div className="tool-group">
        <button className="tool-button" title="Đặt lại" onClick={handleReset}>
          <i className="fas fa-undo"></i>
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
