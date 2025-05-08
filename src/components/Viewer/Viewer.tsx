import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useStudyStore } from "../../store/studyStore";
import { useViewportStore } from "../../store/viewportStore";
import Viewport from "./Viewport";
import Toolbar from "./Toolbar";
import "./Viewer.css";
import { initCornerstone } from "../../utils/cornerstoneInit";
import { cornerstoneDestroy } from "../../utils/cornerstoneDestroy";

const Viewer: React.FC = () => {
  const { studyInstanceUID } = useParams<{ studyInstanceUID: string }>();
  const [activeViewport, setActiveViewport] = useState("viewport-1");
  const [cornerstoneInitialized, setCornerstoneInitialized] = useState(false);

  const {
    fetchSeriesForStudy,
    fetchStudyByUID,
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
      const cleanupCornerstone = async () => {
        await cornerstoneDestroy();
      };

      cleanupCornerstone();
    };
  }, []);

  // Tải thông tin study và series khi component được mount
  useEffect(() => {
    if (studyInstanceUID) {
      // Lấy thông tin study trước
      fetchStudyByUID(studyInstanceUID);
      // Sau đó lấy danh sách series
      fetchSeriesForStudy(studyInstanceUID);
    }
  }, [studyInstanceUID, fetchStudyByUID, fetchSeriesForStudy]);

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
