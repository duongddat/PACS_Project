import React, { useState, useEffect } from "react";
import * as cornerstone from "@cornerstonejs/core";
import * as cornerstoneTools from "@cornerstonejs/tools";
import { useViewportStore } from "../../store/viewportStore";
import { Tooltip } from "react-tooltip";
import "./Toolbar.css";

interface ToolbarProps {
  viewportId: string;
}

const Toolbar: React.FC<ToolbarProps> = ({ viewportId }) => {
  const { viewports, nextImage, previousImage } = useViewportStore();
  const viewport = viewports[viewportId];
  const [activeTool, setActiveTool] = useState<string>(
    cornerstoneTools.WindowLevelTool.toolName
  );
  const renderingEngineId = `engine-${viewportId}`;
  const toolGroupId = `toolgroup-${viewportId}`;

  // Đảm bảo các công cụ được đăng ký khi component được mount
  useEffect(() => {
    if (!cornerstoneTools.ToolGroupManager.getToolGroup(toolGroupId)) return;

    activateTool(cornerstoneTools.WindowLevelTool.toolName);
  }, [viewportId, toolGroupId]);

  // Kích hoạt công cụ
  const activateTool = (toolName: string) => {
    const toolGroup =
      cornerstoneTools.ToolGroupManager.getToolGroup(toolGroupId);
    if (!toolGroup) {
      console.error(`Không tìm thấy toolGroup với ID: ${toolGroupId}`);
      return;
    }

    const toolsToDeactivate = [
      cornerstoneTools.WindowLevelTool.toolName,
      cornerstoneTools.PanTool.toolName,
      cornerstoneTools.ZoomTool.toolName,
      cornerstoneTools.LengthTool.toolName,
      cornerstoneTools.AngleTool.toolName,
    ];

    toolsToDeactivate.forEach((tool) => {
      if (toolGroup.getToolInstance(tool)) {
        toolGroup.setToolPassive(tool);
      }
    });

    try {
      toolGroup.setToolActive(toolName, {
        bindings: [{ mouseButton: 1 }],
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

    const stackViewport = renderingEngine.getViewport(
      `viewport-${viewportId}`
    ) as cornerstone.StackViewport;
    if (!stackViewport) return;

    stackViewport.resetCamera();
    stackViewport.render();
  };

  const tools = [
    {
      name: cornerstoneTools.WindowLevelTool.toolName,
      icon: "fas fa-adjust",
      title: "Điều chỉnh cửa sổ",
    },
    {
      name: cornerstoneTools.PanTool.toolName,
      icon: "fas fa-hand-paper",
      title: "Di chuyển",
    },
    {
      name: cornerstoneTools.ZoomTool.toolName,
      icon: "fas fa-search-plus",
      title: "Phóng to/thu nhỏ",
    },
    {
      name: cornerstoneTools.LengthTool.toolName,
      icon: "fas fa-ruler",
      title: "Đo khoảng cách",
    },
    {
      name: cornerstoneTools.AngleTool.toolName,
      icon: "fas fa-ruler-combined",
      title: "Đo góc",
    },
  ];

  const renderToolButton = (tool: (typeof tools)[0]) => (
    <button
      key={tool.name}
      className={`tool-button ${activeTool === tool.name ? "active" : ""}`}
      title={tool.title}
      data-tooltip-id="toolbar-tooltip"
      data-tooltip-content={tool.title}
      onClick={() => activateTool(tool.name)}
    >
      <i className={tool.icon}></i>
    </button>
  );

  return (
    <div className="toolbar">
      <div className="tool-group">
        {tools.slice(0, 3).map(renderToolButton)}
      </div>

      <div className="tool-group">{tools.slice(3).map(renderToolButton)}</div>

      <div className="tool-group">
        <button
          className="tool-button"
          title="Hình ảnh trước"
          onClick={handlePreviousImage}
          disabled={!viewport || viewport.currentImageIdIndex === 0}
          data-tooltip-id="toolbar-tooltip"
          data-tooltip-content="Hình ảnh trước"
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
          data-tooltip-id="toolbar-tooltip"
          data-tooltip-content="Hình ảnh tiếp theo"
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>

      <div className="tool-group">
        <button
          className="tool-button"
          title="Đặt lại"
          onClick={handleReset}
          data-tooltip-id="toolbar-tooltip"
          data-tooltip-content="Đặt lại"
        >
          <i className="fas fa-undo"></i>
        </button>
      </div>

      <Tooltip id="toolbar-tooltip" place="bottom" />
    </div>
  );
};

export default Toolbar;
