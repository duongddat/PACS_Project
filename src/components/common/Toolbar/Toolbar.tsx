import React, { useState, useEffect } from "react";
import * as cornerstoneTools from "cornerstone-tools";
import "./Toolbar.css";
import { Tooltip } from "react-tooltip";
import { initCornerstone } from "../../../utils/cornerstoneInit";

interface ToolbarProps {
  element: React.RefObject<HTMLDivElement | null>;
  studyInfo?: any; // Thêm thông tin study để kiểm tra hỗ trợ 3D
}

interface ToolButtonProps {
  name: string;
  icon: React.ReactNode;
  title: string;
  isActive: boolean;
  onClick: () => void;
}

// Component con cho nút công cụ
const ToolButton: React.FC<ToolButtonProps> = ({
  name,
  icon,
  title,
  isActive,
  onClick,
}) => (
  <>
    <button
      className={`toolbar-button ${isActive ? "active" : ""}`}
      onClick={onClick}
      data-tooltip-id={`tooltip-${name}`}
      data-tooltip-content={title}
    >
      <span className="toolbar-icon">{icon}</span>
    </button>
    <Tooltip id={`tooltip-${name}`} place="top" />
  </>
);

export const Toolbar: React.FC<ToolbarProps> = ({ element, studyInfo }) => {
  const [activeTool, setActiveTool] = useState<string>("Wwwc");
  const [activeViewport, setActiveViewport] = useState<string>("2D");
  const [toolsInitialized, setToolsInitialized] = useState<boolean>(false);
  const [supports3D, setSupports3D] = useState<boolean>(false);

  // Kiểm tra xem study có hỗ trợ 3D không
  useEffect(() => {
    if (studyInfo) {
      // Kiểm tra các điều kiện để hỗ trợ 3D
      const check3DSupport = () => {
        // Điều kiện 1: Có nhiều lát cắt (slices) trong cùng một series
        const hasMultipleSlices =
          studyInfo.series &&
          studyInfo.series.some(
            (series: any) => series.instances && series.instances.length > 10
          );

        // Điều kiện 2: Các lát cắt có khoảng cách đều nhau
        const hasEqualSpacing =
          studyInfo.series &&
          studyInfo.series.some((series: any) => series.equalSpacing === true);

        // Điều kiện 3: Có thông tin về hướng của lát cắt
        const hasOrientation =
          studyInfo.series &&
          studyInfo.series.some(
            (series: any) =>
              series.instances &&
              series.instances[0] &&
              series.instances[0].imageOrientationPatient
          );

        // Cần đáp ứng tất cả các điều kiện
        return hasMultipleSlices && (hasEqualSpacing || hasOrientation);
      };

      setSupports3D(check3DSupport());
    } else {
      setSupports3D(false);
    }
  }, [studyInfo]);

  // Đảm bảo các công cụ được đăng ký khi component được tải
  useEffect(() => {
    if (!element.current) return;

    try {
      // Kiểm tra xem cornerstone và cornerstoneTools đã được khởi tạo chưa
      // Kiểm tra xem Cornerstone đã được khởi tạo chưa
      if (!(window as any).cornerstone || !(window as any).cornerstoneTools) {
        console.error("Cornerstone hoặc cornerstoneTools chưa được khởi tạo");
        
        // Thử khởi tạo lại
        try {
          const initialized = initCornerstone();
          if (!initialized) {
            console.error("Không thể khởi tạo Cornerstone từ Toolbar");
            return;
          }
          console.log("Đã khởi tạo lại Cornerstone từ Toolbar");
        } catch (error) {
          console.error("Lỗi khi khởi tạo Cornerstone từ Toolbar:", error);
          return;
        }
      }
      
      // Tiếp tục với mã hiện tại chỉ khi Cornerstone đã được khởi tạo
      const cornerstone = (window as any).cornerstone;
      const cornerstoneTools = (window as any).cornerstoneTools;
      
      // Đảm bảo các công cụ đã được đăng ký
      if (!toolsInitialized) {
        // Đăng ký các công cụ cơ bản
        if (cornerstoneTools.WwwcTool) {
          cornerstoneTools.addTool(cornerstoneTools.WwwcTool);
        }
        if (cornerstoneTools.PanTool) {
          cornerstoneTools.addTool(cornerstoneTools.PanTool);
        }
        if (cornerstoneTools.ZoomTool) {
          cornerstoneTools.addTool(cornerstoneTools.ZoomTool);
        }

        // Đăng ký các công cụ đo lường
        if (cornerstoneTools.LengthTool) {
          cornerstoneTools.addTool(cornerstoneTools.LengthTool);
        }
        if (cornerstoneTools.AngleTool) {
          cornerstoneTools.addTool(cornerstoneTools.AngleTool);
        }
        if (cornerstoneTools.RectangleRoiTool) {
          cornerstoneTools.addTool(cornerstoneTools.RectangleRoiTool);
        }

        // Đăng ký các công cụ nâng cao
        if (cornerstoneTools.MagnifyTool) {
          cornerstoneTools.addTool(cornerstoneTools.MagnifyTool);
        }
        if (cornerstoneTools.StackScrollTool) {
          cornerstoneTools.addTool(cornerstoneTools.StackScrollTool);
        }

        setToolsInitialized(true);
        console.log("Tất cả các công cụ đã được đăng ký thành công");

        // Kích hoạt công cụ mặc định
        cornerstoneTools.setToolActive("Wwwc", { mouseButtonMask: 1 });
      }
    } catch (error) {
      console.error("Lỗi khi khởi tạo các công cụ:", error);
    }
  }, [element, toolsInitialized]);

  const activateTool = (toolName: string) => {
    if (!element.current) return;
  
    try {
      const cornerstone = (window as any).cornerstone;
      const cornerstoneTools = (window as any).cornerstoneTools;
      
      if (!cornerstone || !cornerstoneTools) {
        console.error("Cornerstone hoặc cornerstoneTools không được tìm thấy");
        return;
      }
      
      // Tắt tất cả các công cụ trước
      const allTools = cornerstoneTools.getToolForElement(element.current);
      if (allTools && allTools.length > 0) {
        allTools.forEach((tool: any) => {
          if (tool.name) {
            try {
              cornerstoneTools.setToolPassive(tool.name);
            } catch (e) {
              console.warn(`Không thể đặt ${tool.name} thành passive:`, e);
            }
          }
        });
      }
  
      // Đảm bảo công cụ đã được đăng ký
      if (!cornerstoneTools.getToolForElement(element.current, toolName)) {
        console.log(`Công cụ ${toolName} chưa được đăng ký, đang thêm...`);
        
        // Thêm công cụ nếu chưa tồn tại
        switch (toolName) {
          case "Wwwc":
            cornerstoneTools.addTool(cornerstoneTools.WwwcTool);
            break;
          case "Pan":
            cornerstoneTools.addTool(cornerstoneTools.PanTool);
            break;
          case "Zoom":
            cornerstoneTools.addTool(cornerstoneTools.ZoomTool);
            break;
          case "Length":
            cornerstoneTools.addTool(cornerstoneTools.LengthTool);
            break;
          case "Angle":
            cornerstoneTools.addTool(cornerstoneTools.AngleTool);
            break;
          case "RectangleRoi":
            cornerstoneTools.addTool(cornerstoneTools.RectangleRoiTool);
            break;
          case "Magnify":
            cornerstoneTools.addTool(cornerstoneTools.MagnifyTool);
            break;
          case "StackScroll":
            cornerstoneTools.addTool(cornerstoneTools.StackScrollTool);
            break;
        }
      }
  
      // Kích hoạt công cụ mới với mouseButtonMask là 1 (chuột trái)
      cornerstoneTools.setToolActive(toolName, { mouseButtonMask: 1 });
      
      // Cập nhật state
      setActiveTool(toolName);
      console.log(`Đã kích hoạt công cụ: ${toolName}`);
      
      // Cập nhật lại hình ảnh để hiển thị công cụ
      if (element.current) {
        cornerstone.updateImage(element.current);
      }
    } catch (error) {
      console.error(`Lỗi khi kích hoạt công cụ ${toolName}:`, error);
    }
  };

  const changeViewport = (viewportType: string) => {
    // Chỉ cho phép chuyển sang chế độ 3D nếu được hỗ trợ
    if (
      viewportType === "2D" ||
      (viewportType === "3D" && supports3D) ||
      (viewportType === "MPR" && supports3D)
    ) {
      setActiveViewport(viewportType);
      // Thêm logic để chuyển đổi giữa các chế độ xem
      console.log(`Đã chuyển sang chế độ xem ${viewportType}`);
    } else {
      // Hiển thị thông báo nếu chế độ xem không được hỗ trợ
      alert(`Chế độ xem ${viewportType} không được hỗ trợ cho study này.`);
    }
  };

  // Định nghĩa các công cụ với biểu tượng SVG dễ hiểu hơn
  const tools = [
    {
      group: "Cơ bản",
      items: [
        {
          name: "Wwwc",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <line x1="12" y1="2" x2="12" y2="22"></line>
            </svg>
          ),
          title:
            "Window/Level - Điều chỉnh độ sáng và độ tương phản của hình ảnh",
        },
        {
          name: "Pan",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="5 9 2 12 5 15"></polyline>
              <polyline points="9 5 12 2 15 5"></polyline>
              <polyline points="15 19 12 22 9 19"></polyline>
              <polyline points="19 9 22 12 19 15"></polyline>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <line x1="12" y1="2" x2="12" y2="22"></line>
            </svg>
          ),
          title: "Pan - Di chuyển hình ảnh trong viewport",
        },
        {
          name: "Zoom",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          ),
          title: "Zoom - Phóng to/thu nhỏ hình ảnh",
        },
      ],
    },
    {
      group: "Đo lường",
      items: [
        {
          name: "Length",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 6H3"></path>
              <path d="M7 12H3"></path>
              <path d="M7 18H3"></path>
              <path d="M12 18H18"></path>
              <path d="M12 12H18"></path>
              <path d="M12 6H18"></path>
            </svg>
          ),
          title: "Đo khoảng cách - Đo khoảng cách giữa hai điểm trên hình ảnh",
        },
        {
          name: "Angle",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="5" x2="5" y2="19"></line>
              <line x1="5" y1="5" x2="5" y2="19"></line>
            </svg>
          ),
          title: "Đo góc - Đo góc giữa ba điểm trên hình ảnh",
        },
        {
          name: "RectangleRoi",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            </svg>
          ),
          title: "Vùng quan tâm - Chọn một vùng hình chữ nhật để phân tích",
        },
      ],
    },
    {
      group: "Nâng cao",
      items: [
        {
          name: "Magnify",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="10" cy="10" r="7"></circle>
              <line x1="21" y1="21" x2="15" y2="15"></line>
              <circle cx="10" cy="10" r="3"></circle>
            </svg>
          ),
          title: "Phóng đại",
        },
        {
          name: "StackScroll",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V15"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <path d="M12 15V3"></path>
            </svg>
          ),
          title: "Cuộn qua các lát cắt",
        },
      ],
    },
  ];

  const viewportTypes = [
    {
      name: "2D",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        </svg>
      ),
      title: "Chế độ xem 2D",
    },
    {
      name: "3D",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3L2 12L12 21L22 12L12 3Z"></path>
          <path d="M12 21V12"></path>
          <path d="M12 12L2 12"></path>
          <path d="M12 12L22 12"></path>
        </svg>
      ),
      title: "Chế độ xem 3D",
    },
    {
      name: "MPR",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      ),
      title: "Chế độ xem MPR",
    },
  ];

  return (
    <div className="toolbar-container">
      {tools.map((group, groupIndex) => (
        <div key={groupIndex} className="toolbar-group">
          {group.items.map((tool) => (
            <ToolButton
              key={tool.name}
              name={tool.name}
              icon={tool.icon}
              title={tool.title}
              isActive={activeTool === tool.name}
              onClick={() => activateTool(tool.name)}
            />
          ))}
        </div>
      ))}

      <div className="toolbar-group viewport-selector">
        {viewportTypes.map((viewport) => (
          <button
            key={viewport.name}
            className={`toolbar-button ${
              activeViewport === viewport.name ? "active" : ""
            }`}
            onClick={() => changeViewport(viewport.name)}
            title={
              viewport.name === "2D" || supports3D
                ? viewport.title
                : `${viewport.title} (Không được hỗ trợ cho study này)`
            }
            disabled={viewport.name !== "2D" && !supports3D}
            style={
              viewport.name !== "2D" && !supports3D
                ? { opacity: 0.5, cursor: "not-allowed" }
                : {}
            }
            data-tooltip-id={`tooltip-viewport-${viewport.name}`}
            data-tooltip-content={
              viewport.name === "2D" || supports3D
                ? viewport.title
                : `${viewport.title} (Không được hỗ trợ cho study này)`
            }
          >
            {viewport.icon}
          </button>
        ))}
        {viewportTypes.map((viewport) => (
          <Tooltip
            key={`tooltip-${viewport.name}`}
            id={`tooltip-viewport-${viewport.name}`}
            place="top"
          />
        ))}
      </div>
    </div>
  );
};
