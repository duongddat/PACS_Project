import React, { useState } from "react";
import "./Toolbar.css";

interface LayoutSelectorProps {
  onLayoutChange: (layout: string) => void;
}

const LayoutSelector: React.FC<LayoutSelectorProps> = ({ onLayoutChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("common");

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
    onLayoutChange(layoutId);
    setIsOpen(false);
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
              Phổ biến
            </button>
            <button
              className={`layout-tab ${activeTab === "advanced" ? "active" : ""}`}
              onClick={() => setActiveTab("advanced")}
            >
              Nâng cao
            </button>
          </div>

          <div className="layout-options">
            {activeTab === "common" &&
              commonLayouts.map((layout) => (
                <button
                  key={layout.id}
                  className="layout-option"
                  onClick={() => handleLayoutSelect(layout.id)}
                >
                  <div className={`layout-icon ${layout.icon}`}></div>
                </button>
              ))}

            {activeTab === "advanced" &&
              advancedLayouts.map((layout) => (
                <button
                  key={layout.id}
                  className="layout-option"
                  onClick={() => handleLayoutSelect(layout.id)}
                >
                  <div className={`layout-icon ${layout.icon}`}></div>
                  <span>{layout.name}</span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LayoutSelector;