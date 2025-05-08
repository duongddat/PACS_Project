import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import * as cornerstone from "@cornerstonejs/core";
import * as cornerstoneTools from "@cornerstonejs/tools";
import { useStudyStore } from "../../store/studyStore";
import { useViewportStore } from "../../store/viewportStore";
import Viewport from "./Viewport";
import Toolbar from "./Toolbar";
import "./Viewer.css";

// Khởi tạo Cornerstone3D
const initCornerstone = async () => {
  try {
    await cornerstone.init();
    await cornerstoneTools.init();

    // Đăng ký các công cụ cần thiết
    cornerstoneTools.addTool(cornerstoneTools.WindowLevelTool);
    cornerstoneTools.addTool(cornerstoneTools.PanTool);
    cornerstoneTools.addTool(cornerstoneTools.ZoomTool);
    cornerstoneTools.addTool(cornerstoneTools.LengthTool);
    cornerstoneTools.addTool(cornerstoneTools.AngleTool);

    console.log("Cornerstone đã được khởi tạo thành công");
  } catch (error) {
    console.error("Lỗi khi khởi tạo Cornerstone:", error);
  }
};

const Viewer: React.FC = () => {
  const { studyInstanceUID } = useParams<{ studyInstanceUID: string }>();
  const [activeViewport, setActiveViewport] = useState("viewport-1");
  const [cornerstoneInitialized, setCornerstoneInitialized] = useState(false);

  const {
    fetchSeriesForStudy,
    currentStudy,
    series,
    currentSeries,
    setCurrentSeries,
  } = useStudyStore();

  const {
    addViewport,
    loadImagesForViewport,
    setActiveViewport: setActiveViewportInStore,
  } = useViewportStore();

  // Khởi tạo Cornerstone khi component được mount
  useEffect(() => {
    const initialize = async () => {
      await initCornerstone();
      setCornerstoneInitialized(true);
    };

    initialize();

    // Cleanup khi component unmount
    return () => {
      // Dọn dẹp tài nguyên Cornerstone
      const cleanupCornerstone = async () => {
        try {
          // Hủy tất cả các rendering engine
          const renderingEngines = cornerstone.getRenderingEngines();
          if (renderingEngines && renderingEngines.length > 0) {
            renderingEngines.forEach((engine) => {
              if (engine) {
                engine.destroy();
              }
            });
          }

          // Hủy tất cả các toolGroup
          const toolGroups =
            cornerstoneTools.ToolGroupManager.getAllToolGroups();
          if (toolGroups && toolGroups.length > 0) {
            toolGroups.forEach((toolGroup) => {
              const toolGroupId = toolGroup.id;
              if (toolGroupId) {
                cornerstoneTools.ToolGroupManager.destroyToolGroup(toolGroupId);
              }
            });
          }

          // Xóa cache
          cornerstone.cache.purgeCache();

          console.log("Đã dọn dẹp tài nguyên Cornerstone");
        } catch (error) {
          console.error("Lỗi khi dọn dẹp Cornerstone:", error);
        }
      };

      cleanupCornerstone();
    };
  }, []);

  // Tải series khi component được mount
  useEffect(() => {
    if (studyInstanceUID) {
      fetchSeriesForStudy(studyInstanceUID);
    }
  }, [studyInstanceUID, fetchSeriesForStudy]);

  // Khởi tạo viewport
  useEffect(() => {
    // Chỉ tạo viewport khi Cornerstone đã được khởi tạo
    if (cornerstoneInitialized) {
      // Tạo viewport mặc định
      addViewport("viewport-1", "cornerstone-engine");
      setActiveViewportInStore("viewport-1");
    }
  }, [addViewport, setActiveViewportInStore, cornerstoneInitialized]);

  // Tải hình ảnh khi series được chọn
  useEffect(() => {
    if (
      studyInstanceUID &&
      currentSeries &&
      activeViewport &&
      cornerstoneInitialized
    ) {
      loadImagesForViewport(
        activeViewport,
        studyInstanceUID,
        currentSeries.SeriesInstanceUID
      );
    }
  }, [
    studyInstanceUID,
    currentSeries,
    activeViewport,
    loadImagesForViewport,
    cornerstoneInitialized,
  ]);

  // Xử lý khi chọn series
  const handleSeriesSelect = (seriesItem: any) => {
    setCurrentSeries(seriesItem);
  };

  return (
    <div className="viewer-container">
      <div className="viewer-header">
        <h2>
          {currentStudy?.PatientName} - {currentStudy?.PatientID}
        </h2>
        <div className="study-info">
          <span>{currentStudy?.StudyDescription}</span>
          <span>{currentStudy?.StudyDate}</span>
        </div>
      </div>

      <div className="viewer-content">
        <div className="series-panel">
          <h3>Series</h3>
          <div className="series-list">
            {series.map((seriesItem) => (
              <div
                key={seriesItem.SeriesInstanceUID}
                className={`series-item ${
                  currentSeries?.SeriesInstanceUID ===
                  seriesItem.SeriesInstanceUID
                    ? "active"
                    : ""
                }`}
                onClick={() => handleSeriesSelect(seriesItem)}
              >
                <div className="series-number">{seriesItem.SeriesNumber}</div>
                <div className="series-description">
                  {seriesItem.SeriesDescription || "Không có mô tả"}
                </div>
                <div className="series-modality">{seriesItem.Modality}</div>
                <div className="series-count">
                  {seriesItem.NumberOfInstances} hình ảnh
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="viewport-container">
          {cornerstoneInitialized ? (
            <>
              <Toolbar viewportId={activeViewport} />
              <Viewport id={activeViewport} />
            </>
          ) : (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Đang khởi tạo Cornerstone...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Viewer;
