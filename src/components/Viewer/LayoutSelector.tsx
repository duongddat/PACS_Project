import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useLayoutStore } from "../../store/useLayoutStore";
import classes from "./LayoutSelector.module.css";

interface LayoutSelectorProps {
  onLayoutChange?: (layoutId: string) => void;
}

interface LayoutOption {
  id: string;
  icon: string;
  title: string;
}

const LayoutSelector: React.FC<LayoutSelectorProps> = ({ onLayoutChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("common");
  const [hoveredCell, setHoveredCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<"bottom" | "right">(
    "bottom"
  );
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { setLayout, currentLayout } = useLayoutStore();

  // Danh sách các layout phổ biến - chuyển thành useMemo để tránh tạo lại mỗi lần render
  const commonLayouts = useMemo<LayoutOption[]>(
    () => [
      { id: "1x1", icon: "layout-1x1", title: "1x1" },
      { id: "1x2", icon: "layout-1x2", title: "1x2" },
      { id: "2x2", icon: "layout-2x2", title: "2x2" },
      { id: "2x2-alt", icon: "layout-2x2-alt", title: "2x2 Alt" },
      { id: "mpr", icon: "layout-mpr", title: "MPR" },
      { id: "3d-four-up", icon: "layout-3d-four-up", title: "3D Four Up" },
    ],
    []
  );

  // Kiểm tra vị trí hiển thị dropdown - tối ưu với useCallback
  const handleResize = useCallback(() => {
    const isMobile = window.innerWidth <= 768;
    setDropdownPosition(isMobile ? "right" : "bottom");
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  // Đóng dropdown khi click ra ngoài - tối ưu với useCallback
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node) &&
      buttonRef.current &&
      !buttonRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  // Điều chỉnh vị trí dropdown khi mở
  const adjustDropdownPosition = useCallback(() => {
    if (isOpen && dropdownRef.current && buttonRef.current) {
      const dropdown = dropdownRef.current;
      const button = buttonRef.current;
      const rect = button.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Reset các style trước khi tính toán lại
      dropdown.style.left = "";
      dropdown.style.right = "";
      dropdown.style.top = "";
      dropdown.style.bottom = "";

      // Xóa tất cả các class position cũ
      dropdown.classList.remove(
        "layout-dropdown-bottom",
        "layout-dropdown-top",
        "layout-dropdown-right",
        "layout-dropdown-left"
      );

      if (dropdownPosition === "bottom") {
        // Kiểm tra không gian bên dưới
        const bottomSpace = viewportHeight - rect.bottom;
        if (dropdown.offsetHeight > bottomSpace) {
          // Nếu không đủ không gian bên dưới, hiển thị bên trên
          dropdown.style.bottom = rect.height + 5 + "px";
          dropdown.style.top = "auto";
          dropdown.classList.add("layout-dropdown-top");
        } else {
          // Hiển thị bên dưới
          dropdown.style.top = "100%";
          dropdown.style.right = "0";
          dropdown.style.marginTop = "5px";
          dropdown.classList.add("layout-dropdown-bottom");
        }

        // Kiểm tra không gian bên phải
        if (rect.right + dropdown.offsetWidth > viewportWidth) {
          dropdown.style.right = "0";
          dropdown.style.left = "auto";
        }
      } else if (dropdownPosition === "right") {
        // Kiểm tra không gian bên phải
        const rightSpace = viewportWidth - rect.right;

        if (dropdown.offsetWidth > rightSpace) {
          // Nếu không đủ không gian bên phải, hiển thị bên trái
          dropdown.style.right = rect.width + 5 + "px";
          dropdown.style.left = "auto";
          dropdown.classList.add("layout-dropdown-left");
        } else {
          // Hiển thị bên phải
          dropdown.style.left = "100%";
          dropdown.style.top = "0";
          dropdown.style.marginLeft = "5px";
          dropdown.classList.add("layout-dropdown-right");
        }

        // Kiểm tra không gian bên dưới
        if (rect.top + dropdown.offsetHeight > viewportHeight) {
          const topSpace = rect.top;
          const availableHeight = Math.max(
            topSpace,
            viewportHeight - rect.bottom
          );

          dropdown.style.maxHeight = `${availableHeight - 20}px`;

          if (topSpace > viewportHeight - rect.bottom) {
            dropdown.style.bottom = "0";
            dropdown.style.top = "auto";
          } else {
            dropdown.style.top = "0";
            dropdown.style.bottom = "auto";
          }
        }
      }
    }
  }, [isOpen, dropdownPosition]);

  useEffect(() => {
    adjustDropdownPosition();

    // Thêm sự kiện resize để điều chỉnh vị trí dropdown khi kích thước màn hình thay đổi
    if (isOpen) {
      window.addEventListener("resize", adjustDropdownPosition);
      return () => {
        window.removeEventListener("resize", adjustDropdownPosition);
      };
    }
  }, [isOpen, adjustDropdownPosition]);

  // Xử lý chọn layout - tối ưu với useCallback
  const handleLayoutSelect = useCallback(
    (layoutId: string) => {
      try {
        setLayout(layoutId);
        if (onLayoutChange) {
          onLayoutChange(layoutId);
        }
      } catch (error) {
        console.error("Lỗi khi chọn layout:", error);
      } finally {
        setIsOpen(false);
      }
    },
    [onLayoutChange, setLayout]
  );

  // Xử lý chọn layout tùy chỉnh - tối ưu với useCallback
  const handleCustomLayoutSelect = useCallback(
    (rows: number, cols: number) => {
      try {
        if (rows <= 0 || cols <= 0 || rows > 10 || cols > 10) {
          console.error("Kích thước layout không hợp lệ:", rows, cols);
          return;
        }

        const layoutId = `custom-${rows}x${cols}`;
        setLayout(layoutId);
        if (onLayoutChange) {
          onLayoutChange(layoutId);
        }
      } catch (error) {
        console.error("Lỗi khi chọn layout tùy chỉnh:", error);
      } finally {
        setIsOpen(false);
      }
    },
    [onLayoutChange, setLayout]
  );

  // Xử lý hover vào cell - tối ưu với useCallback
  const handleCellHover = useCallback((row: number, col: number) => {
    setHoveredCell({ row, col });
  }, []);

  // Render custom grid - tối ưu với useMemo
  const customGridCells = useMemo(() => {
    const maxRows = 4;
    const maxCols = 4;
    const grid = [];

    for (let row = 1; row <= maxRows; row++) {
      for (let col = 1; col <= maxCols; col++) {
        const isHighlighted =
          hoveredCell && row <= hoveredCell.row && col <= hoveredCell.col;

        grid.push(
          <div
            key={`${row}-${col}`}
            className={`${classes["custom-grid-cell"]} ${
              isHighlighted ? classes["highlighted"] : ""
            }`}
            onMouseEnter={() => handleCellHover(row, col)}
            onClick={() => handleCustomLayoutSelect(row, col)}
          />
        );
      }
    }

    return grid;
  }, [hoveredCell, handleCellHover, handleCustomLayoutSelect]);

  // Xử lý click vào nút - tối ưu với useCallback
  const handleButtonClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsOpen(!isOpen);
    },
    [isOpen]
  );

  // Xử lý click vào dropdown - tối ưu với useCallback
  const handleDropdownClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // Xử lý chuyển tab - tối ưu với useCallback
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  return (
    <div className={classes["layout-selector"]}>
      <button
        ref={buttonRef}
        className="tool-button layout-button"
        onClick={handleButtonClick}
        data-tooltip-id="toolbar-tooltip"
        data-tooltip-content="Chọn bố cục"
      >
        <i className="fas fa-th-large"></i>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={`${classes["layout-dropdown"]} ${
            classes[`layout-dropdown-${dropdownPosition}`]
          }`}
          onClick={handleDropdownClick}
        >
          <div className={classes["layout-tabs"]}>
            <button
              className={`${classes["layout-tab"]} ${
                activeTab === "common" ? classes["active"] : ""
              }`}
              onClick={() => handleTabChange("common")}
            >
              Phổ biến
            </button>
            <button
              className={`${classes["layout-tab"]} ${
                activeTab === "custom" ? classes["active"] : ""
              }`}
              onClick={() => handleTabChange("custom")}
            >
              Tuỳ chỉnh
            </button>
          </div>

          <div className={classes["layout-options"]}>
            {activeTab === "common" &&
              commonLayouts.map((layout) => (
                <button
                  key={layout.id}
                  className={`${classes["layout-option"]} ${
                    currentLayout === layout.id ? classes["active"] : ""
                  }`}
                  onClick={() => handleLayoutSelect(layout.id)}
                  title={layout.title}
                >
                  <div
                    className={`${classes["layout-icon"]} ${
                      classes[layout.icon]
                    }`}
                  ></div>
                  {currentLayout === layout.id && (
                    <div className={classes["layout-selected-indicator"]}>
                      <i className="fas fa-check"></i>
                    </div>
                  )}
                </button>
              ))}

            {activeTab === "custom" && (
              <div className={classes["custom-layout-container"]}>
                <div className={classes["custom-grid-container"]}>
                  {customGridCells}
                </div>
                <div className={classes["custom-grid-info"]}>
                  <p>Di chuột để chọn số hàng và cột</p>
                  <strong>Nhấp để áp dụng</strong>
                  {hoveredCell && (
                    <p className={classes["custom-grid-size"]}>
                      {hoveredCell.row}x{hoveredCell.col}
                      {currentLayout ===
                        `custom-${hoveredCell.row}x${hoveredCell.col}` && (
                        <span className={classes["custom-selected-indicator"]}>
                          <i className="fas fa-check"></i>
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LayoutSelector;
