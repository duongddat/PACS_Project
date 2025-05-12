import React, { useState, useEffect, useRef } from "react";
import * as cornerstone from "@cornerstonejs/core";
import * as cornerstoneTools from "@cornerstonejs/tools";
import { useViewportStore } from "../../store/viewportStore";
import { Tooltip } from "react-tooltip";
import "./Toolbar.css";

interface ToolbarProps {
  viewportId: string;
  children?: React.ReactNode; // Thêm prop children
}

const Toolbar: React.FC<ToolbarProps> = ({ viewportId, children }) => {
  const { viewports, nextImage, previousImage } = useViewportStore();
  const viewport = viewports[viewportId];
  const [activeTool, setActiveTool] = useState<string>(
    cornerstoneTools.WindowLevelTool.toolName
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const renderingEngineId = `engine-${viewportId}`;
  const toolGroupId = `toolgroup-${viewportId}`;

  // Đảm bảo các công cụ được đăng ký khi component được mount
  useEffect(() => {
    if (!cornerstoneTools.ToolGroupManager.getToolGroup(toolGroupId)) return;

    activateTool(cornerstoneTools.WindowLevelTool.toolName);
  }, [viewportId, toolGroupId]);

  // Kích hoạt công cụ
  const activateTool = (toolName: string) => {
    try {
      const toolGroup =
        cornerstoneTools.ToolGroupManager.getToolGroup(toolGroupId);
      if (!toolGroup) {
        console.error(`Không tìm thấy toolGroup với ID: ${toolGroupId}`);
        return;
      }

      // Chỉ deactivate công cụ hiện tại nếu khác với công cụ mới
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
        // Kiểm tra xem công cụ đã được thêm vào toolGroup chưa
        if (!toolGroup.getToolInstance(toolName)) {
          // Thêm công cụ vào toolGroup nếu chưa có
          toolGroup.addTool(toolName);
        }

        // Cấu hình đặc biệt cho AnnotationTool
        if (toolName === cornerstoneTools.ArrowAnnotateTool.toolName) {
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

  // Đóng dropdown khi click ra ngoài
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

  // Công cụ chính
  const mainTools = [
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
  ];

  // Công cụ đo lường
  const measurementTools = [
    {
      name: cornerstoneTools.LengthTool.toolName,
      icon: "fas fa-ruler",
      title: "Đo khoảng cách",
      label: "Đo khoảng cách",
    },
    {
      name: cornerstoneTools.BidirectionalTool.toolName,
      icon: "fas fa-arrows-alt-h",
      title: "Đo hai chiều",
      label: "Đo hai chiều",
    },
    {
      name: cornerstoneTools.ArrowAnnotateTool.toolName,
      icon: "fas fa-comment-medical",
      title: "Chú thích",
      label: "Chú thích",
    },
    {
      name: cornerstoneTools.EllipticalROITool.toolName,
      icon: "far fa-circle",
      title: "Vùng ellipse",
      label: "Vùng ellipse",
    },
    {
      name: cornerstoneTools.RectangleROITool.toolName,
      icon: "far fa-square",
      title: "Vùng chữ nhật",
      label: "Vùng chữ nhật",
    },
    {
      name: cornerstoneTools.CircleROITool.toolName,
      icon: "far fa-circle",
      title: "Vùng tròn",
      label: "Vùng tròn",
    },
    {
      name: cornerstoneTools.PlanarFreehandROITool.toolName,
      icon: "fas fa-draw-polygon",
      title: "Vùng tự do",
      label: "Vùng tự do",
    },
    {
      name: cornerstoneTools.SplineROITool.toolName,
      icon: "fas fa-bezier-curve",
      title: "Đường cong spline",
      label: "Đường cong spline",
    },
  ];

  return (
    <div className="toolbar">
      {/* Nhóm công cụ cơ bản */}
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

      {/* Nhóm công cụ đo lường - Giữ nguyên cấu trúc nhưng thêm ref để xử lý dropdown */}
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

      {/* Các nút điều hướng */}
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

      {/* Nút đặt lại */}
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

      {/* Thêm LayoutSelector vào toolbar */}
      <div className="tool-group">
        {children} {/* Render children (LayoutSelector) ở đây */}
      </div>

      <Tooltip id="toolbar-tooltip" place="bottom" className="tool-tooltip" />
    </div>
  );
};

export default Toolbar;
