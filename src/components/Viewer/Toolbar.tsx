import React, { useState, useEffect, useRef } from "react";
import { getRenderingEngine, StackViewport } from "@cornerstonejs/core";
import {
  ArrowAnnotateTool,
  BidirectionalTool,
  CircleROITool,
  EllipticalROITool,
  LengthTool,
  PanTool,
  PlanarFreehandROITool,
  RectangleROITool,
  SplineROITool,
  ToolGroupManager,
  WindowLevelTool,
  ZoomTool,
} from "@cornerstonejs/tools";
import { useViewportStore } from "../../store/viewportStore";
import { Tooltip } from "react-tooltip";
import "./Toolbar.css";

interface ToolbarProps {
  viewportId: string;
  children?: React.ReactNode;
}

const Toolbar: React.FC<ToolbarProps> = ({ viewportId, children }) => {
  const { viewports, nextImage, previousImage } = useViewportStore();
  const viewport = viewports[viewportId];
  const [activeTool, setActiveTool] = useState<string>(
    WindowLevelTool.toolName
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const renderingEngineId = `engine-${viewportId}`;
  const toolGroupId = `toolgroup-${viewportId}`;

  useEffect(() => {
    if (!ToolGroupManager.getToolGroup(toolGroupId)) return;

    activateTool(WindowLevelTool.toolName);
  }, [viewportId, toolGroupId]);

  // Kích hoạt công cụ
  const activateTool = (toolName: string) => {
    try {
      const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
      if (!toolGroup) {
        console.error(`Không tìm thấy toolGroup với ID: ${toolGroupId}`);
        return;
      }

      if (activeTool !== toolName) {
        try {
          toolGroup.setToolPassive(activeTool);
        } catch (error) {
          console.warn(
            `Không thể đặt công cụ ${activeTool} thành passive:`,
            error
          );
        }
      }

      try {
        if (!toolGroup.getToolInstance(toolName)) {
          toolGroup.addTool(toolName);
        }

        if (toolName === ArrowAnnotateTool.toolName) {
          toolGroup.setToolConfiguration(toolName, {
            getTextCallback: (callback: any, eventDetail: any) => {
              const text = prompt("Nhập nội dung chú thích:");
              if (text) {
                callback(text);
              }
            },
          });
        }

        toolGroup.setToolActive(toolName, {
          bindings: [{ mouseButton: 1 }],
        });
        setActiveTool(toolName);
      } catch (error) {
        console.error(`Lỗi khi kích hoạt công cụ ${toolName}:`, error);
      }
    } catch (error) {
      console.error("Lỗi khi xử lý công cụ:", error);
    }
  };

  const handleNextImage = () => {
    if (viewportId) {
      nextImage(viewportId);
    }
  };

  const handlePreviousImage = () => {
    if (viewportId) {
      previousImage(viewportId);
    }
  };

  const handleReset = () => {
    const renderingEngine = getRenderingEngine(renderingEngineId);
    if (!renderingEngine) return;

    const stackViewport = renderingEngine.getViewport(
      `viewport-${viewportId}`
    ) as StackViewport;
    if (!stackViewport) return;

    stackViewport.resetCamera();
    stackViewport.render();
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const mainTools = [
    {
      name: WindowLevelTool.toolName,
      icon: "fas fa-adjust",
      title: "Điều chỉnh cửa sổ",
    },
    {
      name: PanTool.toolName,
      icon: "fas fa-hand-paper",
      title: "Di chuyển",
    },
    {
      name: ZoomTool.toolName,
      icon: "fas fa-search-plus",
      title: "Phóng to/thu nhỏ",
    },
  ];

  const measurementTools = [
    {
      name: LengthTool.toolName,
      icon: "fas fa-ruler",
      title: "Đo khoảng cách",
      label: "Đo khoảng cách",
    },
    {
      name: BidirectionalTool.toolName,
      icon: "fas fa-arrows-alt-h",
      title: "Đo hai chiều",
      label: "Đo hai chiều",
    },
    {
      name: ArrowAnnotateTool.toolName,
      icon: "fas fa-comment-medical",
      title: "Chú thích",
      label: "Chú thích",
    },
    {
      name: EllipticalROITool.toolName,
      icon: "far fa-circle",
      title: "Vùng ellipse",
      label: "Vùng ellipse",
    },
    {
      name: RectangleROITool.toolName,
      icon: "far fa-square",
      title: "Vùng chữ nhật",
      label: "Vùng chữ nhật",
    },
    {
      name: CircleROITool.toolName,
      icon: "far fa-circle",
      title: "Vùng tròn",
      label: "Vùng tròn",
    },
    {
      name: PlanarFreehandROITool.toolName,
      icon: "fas fa-draw-polygon",
      title: "Vùng tự do",
      label: "Vùng tự do",
    },
    {
      name: SplineROITool.toolName,
      icon: "fas fa-bezier-curve",
      title: "Đường cong spline",
      label: "Đường cong spline",
    },
  ];

  return (
    <div className="toolbar">
      <div className="tool-group">
        {mainTools.map((tool) => (
          <button
            key={tool.name}
            className={`tool-button ${
              activeTool === tool.name ? "active" : ""
            }`}
            title={tool.title}
            data-tooltip-id="toolbar-tooltip"
            data-tooltip-content={tool.title}
            onClick={() => activateTool(tool.name)}
          >
            <i className={tool.icon}></i>
          </button>
        ))}
      </div>

      <div className="tool-group" ref={dropdownRef}>
        <button
          className={`tool-button tool-dropdown-button ${
            showDropdown ? "active" : ""
          }`}
          onClick={() => setShowDropdown(!showDropdown)}
          data-tooltip-id="toolbar-tooltip"
          data-tooltip-content="Công cụ đo lường"
        >
          <i className="fas fa-pencil-alt"></i>
          <i className="fas fa-caret-down dropdown-icon"></i>
        </button>

        {showDropdown && (
          <div className="tool-dropdown">
            {measurementTools.map((tool) => (
              <div
                key={tool.name}
                className={`tool-dropdown-item ${
                  activeTool === tool.name ? "active" : ""
                }`}
                onClick={() => {
                  activateTool(tool.name);
                  setShowDropdown(false);
                }}
              >
                <i className={tool.icon}></i>
                <span>{tool.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
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
      <div className="tool-group">{children}</div>
      <Tooltip id="toolbar-tooltip" place="bottom" className="tool-tooltip" />
    </div>
  );
};

export default Toolbar;
