import React from "react";
import "./StackNavigation.css";

interface StackNavigationProps {
  currentIndex: number;
  totalImages: number;
  onScrollUp: () => void;
  onScrollDown: () => void;
}

export const StackNavigation: React.FC<StackNavigationProps> = ({
  currentIndex,
  totalImages,
  onScrollUp,
  onScrollDown,
}) => {
  return (
    <div className="stack-info">
      <div className="frame-counter">
        {currentIndex + 1} / {totalImages}
      </div>
      <div className="stack-navigation">
        <button
          onClick={onScrollUp}
          disabled={currentIndex <= 0}
          title="Lát cắt trước"
        >
          ▲
        </button>
        <button
          onClick={onScrollDown}
          disabled={currentIndex >= totalImages - 1}
          title="Lát cắt sau"
        >
          ▼
        </button>
      </div>
    </div>
  );
};
