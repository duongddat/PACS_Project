import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useStudyStore } from "../../store/studyStore";
import { useViewportStore } from "../../store/viewportStore";
import { useLayoutStore } from "../../store/useLayoutStore";
import { DicomWebApi } from "../../api/DicomWebApi";
import Viewport from "./Viewport";
import Toolbar from "./Toolbar";
import LayoutSelector from "./LayoutSelector";
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
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  // Thêm ref để theo dõi layout trước đó
  const prevLayoutRef = useRef<string | null>(null);

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
    removeViewport,
    viewports,
  } = useViewportStore();

  // Lấy cấu hình layout từ useLayoutStore
  const { currentLayout, getViewportConfiguration, setLayout } =
    useLayoutStore();
  const { rows, cols, viewports: viewportConfig } = getViewportConfiguration();

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

  // Khởi tạo viewport dựa trên cấu hình layout
  useEffect(() => {
    // Chỉ tạo viewport khi Cornerstone đã được khởi tạo
    if (cornerstoneInitialized) {
      try {
        // Kiểm tra nếu layout đã thay đổi
        if (prevLayoutRef.current !== currentLayout) {
          prevLayoutRef.current = currentLayout;

          // Xóa các viewport hiện tại trước khi tạo mới
          Object.keys(viewports).forEach((id) => {
            removeViewport(id);
          });

          // Tạo các viewport mới dựa trên cấu hình
          viewportConfig.forEach((vpConfig) => {
            // Bỏ qua viewport bị ẩn
            if (
              vpConfig.span &&
              (vpConfig.span[0] === 0 || vpConfig.span[1] === 0)
            ) {
              return;
            }
            addViewport(vpConfig.id, "cornerstone-engine");
          });

          // Đặt viewport đầu tiên làm active nếu có viewport
          if (viewportConfig.length > 0) {
            // Lọc ra các viewport không bị ẩn
            const visibleViewports = viewportConfig.filter(
              (vpConfig) =>
                !(
                  vpConfig.span &&
                  (vpConfig.span[0] === 0 || vpConfig.span[1] === 0)
                )
            );

            if (visibleViewports.length > 0) {
              const firstViewportId = visibleViewports[0].id;
              setActiveViewport(firstViewportId);
              setActiveViewportInStore(firstViewportId);
            }
          }
        }
      } catch (error) {
        console.error("Lỗi khi khởi tạo viewport:", error);
      }
    }
  }, [
    addViewport,
    removeViewport,
    setActiveViewportInStore,
    cornerstoneInitialized,
    viewportConfig,
    viewports,
    currentLayout,
  ]);

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
  }, [series, studyInstanceUID, loadSeriesThumbnails]);

  // Hàm xử lý khi chọn series
  const handleSeriesSelect = useCallback(
    async (selectedSeries: Series) => {
      // Kiểm tra nếu series đã được chọn, không làm gì cả
      if (
        currentSeries?.SeriesInstanceUID === selectedSeries.SeriesInstanceUID
      ) {
        return;
      }

      setCurrentSeries(selectedSeries);

      if (studyInstanceUID) {
        // Tải hình ảnh cho tất cả viewport hiện tại
        const loadPromises = viewportConfig
          .filter(
            (vpConfig) =>
              !(
                vpConfig.span &&
                (vpConfig.span[0] === 0 || vpConfig.span[1] === 0)
              )
          )
          .map((vpConfig) =>
            loadImagesForViewport(
              vpConfig.id,
              studyInstanceUID,
              selectedSeries.SeriesInstanceUID
            )
          );

        // Đợi tất cả viewport tải xong
        await Promise.all(loadPromises);
      }
    },
    [
      studyInstanceUID,
      viewportConfig,
      loadImagesForViewport,
      setCurrentSeries,
      currentSeries,
    ]
  );

  // Hàm xử lý đóng/mở sidebar
  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev);
  }, []);

  // Hàm xử lý khi thay đổi layout
  const handleLayoutChange = useCallback(
    (layoutId: string) => {
      setLayout(layoutId);
    },
    [setLayout]
  );

  // Hàm xử lý khi click vào viewport
  const handleViewportClick = useCallback(
    (viewportId: string) => {
      setActiveViewport(viewportId);
      setActiveViewportInStore(viewportId);
    },
    [setActiveViewportInStore]
  );

  // Thêm useEffect để xử lý resize và tự động thu sidebar trên mobile
  useEffect(() => {
    // Kiểm tra nếu là thiết bị di động
    const checkMobile = () => {
      const newIsMobile = window.innerWidth <= 768;
      if (newIsMobile !== isMobile) {
        setIsMobile(newIsMobile);
        if (newIsMobile) {
          setIsSidebarCollapsed(true);
        } else {
          setIsSidebarCollapsed(false);
        }
      }
    };

    // Kiểm tra khi component mount
    checkMobile();

    // Kiểm tra khi resize cửa sổ
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []); // Bỏ isMobile khỏi dependency array để tránh vòng lặp

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
  }, [isSidebarCollapsed]);

  // Hàm render các viewport theo cấu hình layout
  const renderViewports = () => {
    return (
      <div
        className="viewport-grid"
        style={{
          display: "grid",
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          height: "calc(100% - 68px)",
          gap: "2px",
        }}
      >
        {viewportConfig.map((vpConfig) => {
          // Bỏ qua viewport bị ẩn
          if (
            vpConfig.span &&
            (vpConfig.span[0] === 0 || vpConfig.span[1] === 0)
          ) {
            return null;
          }

          return (
            <div
              key={vpConfig.id}
              style={{
                gridRow: `${vpConfig.position[0] + 1} / span ${
                  vpConfig.span ? vpConfig.span[0] : 1
                }`,
                gridColumn: `${vpConfig.position[1] + 1} / span ${
                  vpConfig.span ? vpConfig.span[1] : 1
                }`,
              }}
              onClick={() => handleViewportClick(vpConfig.id)}
              className={`viewport-container ${
                activeViewport === vpConfig.id ? "active" : ""
              }`}
            >
              <Viewport id={vpConfig.id} />
            </div>
          );
        })}
      </div>
    );
  };

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
              <Toolbar viewportId={activeViewport}>
                <LayoutSelector onLayoutChange={handleLayoutChange} />
              </Toolbar>
              {renderViewports()}
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
