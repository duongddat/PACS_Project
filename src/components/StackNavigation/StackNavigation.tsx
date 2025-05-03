import React, { useEffect, useState } from "react";
import "./StackNavigation.css";
import { useDicomStore } from "../../store/dicomStore";

export interface StackNavigationProps {
  currentIndex: number;
  totalImages: number;
  onScrollUp: () => void;
  onScrollDown: () => void;
  thumbPosition: number;
  onThumbDrag: (e: React.MouseEvent<HTMLDivElement>) => void;
  studyInstanceUID?: string;
  seriesInstanceUID?: string;
  instanceUID?: string;
  isMultiFrame?: boolean;
}

export const StackNavigation: React.FC<StackNavigationProps> = ({
  currentIndex,
  totalImages,
  onScrollUp,
  onScrollDown,
  thumbPosition,
  onThumbDrag,
  studyInstanceUID,
  seriesInstanceUID,
  instanceUID,
  isMultiFrame = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { loadFrame } = useDicomStore();
  
  // Xử lý khi người dùng cuộn lên/xuống trong trường hợp multiframe
  const handleMultiFrameScroll = async (direction: 'up' | 'down') => {
    if (!studyInstanceUID || !seriesInstanceUID || !instanceUID) return;
    
    setIsLoading(true);
    try {
      const newIndex = direction === 'up' 
        ? Math.max(0, currentIndex - 1)
        : Math.min(totalImages - 1, currentIndex + 1);
        
      // Tải frame mới
      const frameNumber = newIndex + 1; // Frame bắt đầu từ 1
      await loadFrame(studyInstanceUID, seriesInstanceUID, instanceUID, frameNumber);
      
      // Gọi callback tương ứng
      if (direction === 'up') {
        onScrollUp();
      } else {
        onScrollDown();
      }
    } catch (error) {
      console.error("Lỗi khi tải frame:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="stack-info">
      <div className="frame-counter">
        {currentIndex + 1} / {totalImages}
        {isLoading && <span className="loading-indicator-small"></span>}
      </div>
      <div className="stack-navigation">
        <button 
          onClick={isMultiFrame ? () => handleMultiFrameScroll('up') : onScrollUp} 
          disabled={currentIndex <= 0 || isLoading}
        >
          ▲
        </button>
        
        <div className="scroll-track">
          <div 
            className="scroll-thumb" 
            style={{ top: `${thumbPosition}%` }}
            onMouseDown={onThumbDrag}
          ></div>
        </div>
        
        <button 
          onClick={isMultiFrame ? () => handleMultiFrameScroll('down') : onScrollDown} 
          disabled={currentIndex >= totalImages - 1 || isLoading}
        >
          ▼
        </button>
      </div>
    </div>
  );
};
