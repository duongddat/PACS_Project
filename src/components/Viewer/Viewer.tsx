import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useStudyStore } from "../../store/studyStore";
import { useViewportStore } from "../../store/viewportStore";
import { DicomWebApi } from "../../api/DicomWebApi";
import Viewport from "./Viewport";
import Toolbar from "./Toolbar";
import "./Viewer.css";
import { initCornerstone } from "../../utils/cornerstoneInit";
import { cornerstoneDestroy } from "../../utils/cornerstoneDestroy";
import { Series } from "../../api/types";

const Viewer: React.FC = () => {
  const { studyInstanceUID } = useParams<{ studyInstanceUID: string }>();
  const [activeViewport, setActiveViewport] = useState("viewport-1");
  const [cornerstoneInitialized, setCornerstoneInitialized] = useState(false);
  const [seriesThumbnails, setSeriesThumbnails] = useState<
    Record<string, string>
  >({});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(300); // Thêm state cho chiều rộng sidebar
  const leftPanelRef = useRef<HTMLDivElement>(null); // Thêm ref cho left panel
  const resizeHandleRef = useRef<HTMLDivElement>(null); // Thêm ref cho resize handle

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

  // Hàm để lấy thumbnail cho mỗi series - tối ưu hóa với useCallback
  const loadSeriesThumbnails = useCallback(async () => {
    if (!studyInstanceUID || !series.length) return;

    // Đặt state loading cho tất cả thumbnails
    const initialThumbnailsMap: Record<string, string> = {};
    series.forEach((seriesItem) => {
      // Nếu đã có thumbnail, giữ nguyên
      if (seriesThumbnails[seriesItem.SeriesInstanceUID]) {
        initialThumbnailsMap[seriesItem.SeriesInstanceUID] =
          seriesThumbnails[seriesItem.SeriesInstanceUID];
      }
    });

    // Cập nhật state với các thumbnail đã có
    if (
      Object.keys(initialThumbnailsMap).length > 0 &&
      Object.keys(initialThumbnailsMap).length !==
        Object.keys(seriesThumbnails).length
    ) {
      setSeriesThumbnails(initialThumbnailsMap);
    }

    // Tải các thumbnail còn thiếu
    const thumbnailPromises = series.map(async (seriesItem) => {
      // Bỏ qua nếu đã có thumbnail
      if (initialThumbnailsMap[seriesItem.SeriesInstanceUID]) {
        return;
      }

      try {
        // Lấy instance đầu tiên của series
        const instances = await DicomWebApi.getInstancesOfSeries(
          studyInstanceUID,
          seriesItem.SeriesInstanceUID
        );

        if (instances.length > 0) {
          // Sắp xếp instances theo InstanceNumber
          instances.sort((a: any, b: any) => {
            const aNum = parseInt(a.InstanceNumber || "0", 10);
            const bNum = parseInt(b.InstanceNumber || "0", 10);
            return aNum - bNum;
          });

          // Lấy instance ở giữa để có hình ảnh đại diện tốt hơn
          const middleIndex = Math.floor(instances.length / 2);
          const representativeInstance = instances[middleIndex];

          // Lấy thumbnail
          const thumbnailBlob = await DicomWebApi.getThumbnail(
            studyInstanceUID,
            seriesItem.SeriesInstanceUID,
            representativeInstance.SOPInstanceUID,
            75, // quality
            "128,128" // viewport size
          );

          // Chuyển đổi blob thành URL
          const thumbnailUrl = URL.createObjectURL(thumbnailBlob);

          // Cập nhật state cho từng thumbnail khi tải xong
          setSeriesThumbnails((prev) => ({
            ...prev,
            [seriesItem.SeriesInstanceUID]: thumbnailUrl,
          }));
        }
      } catch (error) {
        console.error(
          `Lỗi khi tải thumbnail cho series ${seriesItem.SeriesInstanceUID}:`,
          error
        );
      }
    });

    // Đợi tất cả thumbnail tải xong
    await Promise.all(thumbnailPromises);
  }, [studyInstanceUID, series, seriesThumbnails]);

  // Tải thumbnail khi series thay đổi
  useEffect(() => {
    if (series.length > 0 && studyInstanceUID) {
      loadSeriesThumbnails();
    }

    // Cleanup URLs khi component unmount
    return () => {
      Object.values(seriesThumbnails).forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [series, studyInstanceUID, loadSeriesThumbnails]); // Thêm studyInstanceUID vào dependency array

  // Hàm xử lý khi chọn series
  const handleSeriesSelect = useCallback(
    async (selectedSeries: Series) => {
      setCurrentSeries(selectedSeries);

      if (studyInstanceUID) {
        await loadImagesForViewport(
          activeViewport,
          studyInstanceUID,
          selectedSeries.SeriesInstanceUID
        );
      }
    },
    [studyInstanceUID, activeViewport, loadImagesForViewport, setCurrentSeries]
  );

  // Hàm xử lý đóng/mở sidebar
  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev);
  }, []);

  // Thêm useEffect để xử lý resize và tự động thu sidebar trên mobile
  useEffect(() => {
    // Kiểm tra nếu là thiết bị di động
    const checkMobile = () => {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        setIsSidebarCollapsed(true);
        setIsMobile(true);
      } else {
        setIsSidebarCollapsed(false);
        setIsMobile(false);
      }
    };

    // Kiểm tra khi component mount
    checkMobile();

    // Kiểm tra khi resize cửa sổ
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, [isMobile]); // Thêm isMobile vào dependency array

  // Thêm chức năng resize sidebar
  useEffect(() => {
    const resizeHandle = resizeHandleRef.current;
    const leftPanel = leftPanelRef.current;

    if (!resizeHandle || !leftPanel) return;

    let startX = 0;
    let startWidth = 0;
    let isResizing = false;

    const onMouseDown = (e: MouseEvent) => {
      isResizing = true;
      startX = e.clientX;
      startWidth = leftPanel.offsetWidth;

      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = startWidth + (e.clientX - startX);

      // Giới hạn kích thước tối thiểu và tối đa
      const minWidth = 200;
      const maxWidth = 600;
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));

      setSidebarWidth(clampedWidth);
      leftPanel.style.width = `${clampedWidth}px`;
    };

    const onMouseUp = () => {
      if (isResizing) {
        isResizing = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    resizeHandle.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      resizeHandle.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [isSidebarCollapsed]); // Thêm isSidebarCollapsed vào dependency array

  // Cập nhật phần render series thumbnails
  return (
    <div className="viewer-container">
      <div className="viewer-header">
        <div className="header-with-nav">
          <h2>
            {currentStudy?.PatientName} - {currentStudy?.PatientID}
          </h2>
        </div>
        <div className="study-info">
          <span>{currentStudy?.StudyDescription}</span>
          <span>{currentStudy?.StudyDate}</span>
        </div>
      </div>

      <div className="viewer-content">
        <div
          ref={leftPanelRef}
          className={`left-panel ${isSidebarCollapsed ? "collapsed" : ""}`}
          style={{ width: isSidebarCollapsed ? "0" : `${sidebarWidth}px` }}
        >
          <div className="series-panel">
            <div className="series-header">
              <div className="series-title">Series ({series.length})</div>
              <button
                className="series-toggle-button"
                onClick={toggleSidebar}
                title="Thu gọn panel"
              >
                <span>&#10094;</span>
              </button>
            </div>
            <div className="series-thumbnails">
              {series.map((seriesItem) => (
                <div
                  key={seriesItem.SeriesInstanceUID}
                  className={`series-thumbnail ${
                    currentSeries?.SeriesInstanceUID ===
                    seriesItem.SeriesInstanceUID
                      ? "active"
                      : ""
                  }`}
                  onClick={() => handleSeriesSelect(seriesItem)}
                  data-modality={seriesItem.Modality}
                >
                  <div className="thumbnail-container">
                    {seriesThumbnails[seriesItem.SeriesInstanceUID] ? (
                      <img
                        src={seriesThumbnails[seriesItem.SeriesInstanceUID]}
                        alt={`Series ${seriesItem.SeriesNumber}`}
                        className="thumbnail-image"
                      />
                    ) : (
                      <div className="loading-spinner"></div>
                    )}
                    <div className="modality-badge">{seriesItem.Modality}</div>
                  </div>
                  <div className="thumbnail-info">
                    <p className="series-number">S:{seriesItem.SeriesNumber}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {!isSidebarCollapsed && (
            <div ref={resizeHandleRef} className="resize-handle"></div>
          )}
        </div>

        <div
          className={`main-panel ${
            isSidebarCollapsed && isMobile ? "main-collapsed" : ""
          }`}
        >
          {/* Thêm nút hiển thị sidebar khi đã ẩn */}
          {isSidebarCollapsed && (
            <button
              className="sidebar-show-button"
              onClick={toggleSidebar}
              title="Hiện sidebar"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          )}

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
