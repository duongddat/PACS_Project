import React, { useState } from "react";
import { useLayoutStore } from "../../store/useLayoutStore";
import "./Toolbar.css";

interface LayoutSelectorProps {
  onLayoutChange?: (layoutId: string) => void;
}

const LayoutSelector: React.FC<LayoutSelectorProps> = ({ onLayoutChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("common");
  const [hoveredCell, setHoveredCell] = useState<{row: number, col: number} | null>(null);
  
  const { setLayout, currentLayout } = useLayoutStore();

  const commonLayouts = [
    { id: "1x1", name: "1x1", icon: "grid-1x1" },
    { id: "1x2", name: "1x2", icon: "grid-1x2" },
    { id: "2x2", name: "2x2", icon: "grid-2x2" },
    { id: "2x2-alt", name: "2x2 Alt", icon: "grid-2x2-alt" },
  ];

  const advancedLayouts = [
    { id: "mpr", name: "MPR", icon: "mpr" },
    { id: "3d-four-up", name: "3D four up", icon: "3d-four" },
    { id: "3d-main", name: "3D main", icon: "3d-main" },
    { id: "axial-primary", name: "Axial Primary", icon: "axial" },
    { id: "3d-only", name: "3D only", icon: "3d" },
    { id: "3d-primary", name: "3D primary", icon: "3d-primary" },
    { id: "frame-view", name: "Frame View", icon: "frame" },
  ];

  const handleLayoutSelect = (layoutId: string) => {
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
  };

  const handleCustomLayoutSelect = (rows: number, cols: number) => {
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
  };

  const handleCellHover = (row: number, col: number) => {
    setHoveredCell({ row, col });
  };

  const renderCustomGrid = () => {
    const maxRows = 4;
    const maxCols = 4;
    const grid = [];

    for (let row = 1; row <= maxRows; row++) {
      for (let col = 1; col <= maxCols; col++) {
        const isHighlighted = hoveredCell && 
          row <= hoveredCell.row && 
          col <= hoveredCell.col;
        
        grid.push(
          <div
            key={`${row}-${col}`}
            className={`custom-grid-cell ${isHighlighted ? 'highlighted' : ''}`}
            onMouseEnter={() => handleCellHover(row, col)}
            onClick={() => handleCustomLayoutSelect(row, col)}
          />
        );
      }
    }

    return grid;
  };

  return (
    <div className="layout-selector">
      <button
        className="tool-button layout-button"
        onClick={() => setIsOpen(!isOpen)}
        data-tooltip-id="toolbar-tooltip"
        data-tooltip-content="Chọn bố cục"
      >
        <i className="fas fa-th-large"></i>
      </button>

      {isOpen && (
        <div className="layout-dropdown">
          <div className="layout-tabs">
            <button
              className={`layout-tab ${activeTab === "common" ? "active" : ""}`}
              onClick={() => setActiveTab("common")}
            >
              Common
            </button>
            <button
              className={`layout-tab ${activeTab === "custom" ? "active" : ""}`}
              onClick={() => setActiveTab("custom")}
            >
              Custom
            </button>
          </div>

          <div className="layout-options">
            {activeTab === "common" &&
              commonLayouts.map((layout) => (
                <button
                  key={layout.id}
                  className={`layout-option ${currentLayout === layout.id ? 'active' : ''}`}
                  onClick={() => handleLayoutSelect(layout.id)}
                >
                  <div className={`layout-icon ${layout.icon}`}></div>
                </button>
              ))}

            {activeTab === "custom" && (
              <div className="custom-layout-container">
                <div className="custom-grid-container">
                  {renderCustomGrid()}
                </div>
                <div className="custom-grid-info">
                  <p>Hover to select rows and columns</p>
                  <p>Click to apply</p>
                  {hoveredCell && (
                    <p className="custom-grid-size">{hoveredCell.row}x{hoveredCell.col}</p>
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