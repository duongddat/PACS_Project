import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useCornerstone } from "../../hooks/useCornerstone";
import { useDicomStore } from "../../store/dicomStore";
import { useViewerStore } from "../../store/viewerStore";
import { SeriesList } from "../SeriesList/SeriesList";
import { Toolbar } from "../common/Toolbar/Toolbar";
import { StackNavigation } from "../StackNavigation/StackNavigation";
import {
  isCornerstoneInitialized,
  initCornerstone,
} from "../../utils/cornerstoneInit";
import { Header } from "../common/Header/Header";
import "./DicomViewer.css";
// Thêm import cornerstone
import * as cornerstone from "cornerstone-core";

export const DicomViewer: React.FC = () => {
  const { studyInstanceUID } = useParams<{ studyInstanceUID: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [viewportReady, setViewportReady] = useState(false);
  const [cornerstoneReady, setCornerstoneReady] = useState(false);
  const [layout, setLayout] = useState({ rows: 1, columns: 1 });
  const [showLeftPanel, setShowLeftPanel] = useState(true);

  // Thêm ref cho viewport container (đặt ở đầu component)
  const viewportContainerRef = useRef<HTMLDivElement>(null);

  // Sử dụng hook useCornerstone
  const {
    element,
    loadImageStack,
    scrollToIndex,
    isEnabled,
    error: cornerstoneError,
  } = useCornerstone();

  // Lấy state từ Zustand
  const {
    studyInfo,
    currentSeriesUID,
    imageStack,
    currentImageIndex,
    isLoading,
    error: dicomError,
    fetchStudyInfo,
    fetchSeriesList,
    fetchSeriesInstances,
    setCurrentImageIndex,
    setCurrentSeries,
  } = useDicomStore();

  const {
    studyLoaded,
    setStackInitialized,
    setStudyLoaded,
    resetViewerState,
    activeViewportIndex,
    viewports,
    setActiveViewport,
    setLayout: setViewportLayout,
    updateViewport,
  } = useViewerStore();

  const error = cornerstoneError || dicomError;

  // Refs để tránh re-renders không cần thiết
  const isLoadingRef = useRef(false);
  const imageStackRef = useRef(imageStack);
  const cornerstoneInitializedRef = useRef(false);

  // Xử lý query params từ URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const studyUIDs = params.get("StudyInstanceUIDs");

    if (studyUIDs && !studyInstanceUID) {
      // Nếu có StudyInstanceUIDs trong query params nhưng không có trong path params
      const firstStudyUID = studyUIDs.split(",")[0];
      navigate(`/viewer/${firstStudyUID}`);
    }
  }, [location, studyInstanceUID, navigate]);

  // Cập nhật ref khi imageStack thay đổi
  useEffect(() => {
    imageStackRef.current = imageStack;
  }, [imageStack]);

  // Khởi tạo Cornerstone khi component được mount
  useEffect(() => {
    const initializeCornerstoneIfNeeded = async () => {
      if (cornerstoneInitializedRef.current) {
        console.log(
          "Cornerstone đã được khởi tạo trước đó, không cần khởi tạo lại"
        );
        setCornerstoneReady(true);
        return;
      }

      try {
        // Kiểm tra xem Cornerstone đã được khởi tạo chưa
        if (isCornerstoneInitialized()) {
          console.log("Cornerstone đã được khởi tạo từ nơi khác");
          cornerstoneInitializedRef.current = true;
          setCornerstoneReady(true);
          return;
        }

        // Khởi tạo Cornerstone
        console.log("Đang khởi tạo Cornerstone từ DicomViewer...");
        const initialized = initCornerstone();

        if (initialized) {
          console.log("Cornerstone đã được khởi tạo thành công");
          cornerstoneInitializedRef.current = true;
          setCornerstoneReady(true);
        } else {
          console.error("Không thể khởi tạo Cornerstone");
        }
      } catch (error) {
        console.error("Lỗi khi khởi tạo Cornerstone:", error);
      }
    };

    initializeCornerstoneIfNeeded();
  }, []);

  // Tải thông tin study khi component được mount
  useEffect(() => {
    if (studyInstanceUID) {
      resetViewerState();
      fetchStudyInfo(studyInstanceUID);

      // Cập nhật viewport với studyInstanceUID
      updateViewport(String(activeViewportIndex), { studyInstanceUID });
    } else {
      // Nếu không có studyInstanceUID, chuyển hướng về trang danh sách
      navigate("/");
    }
  }, [
    studyInstanceUID,
    fetchStudyInfo,
    resetViewerState,
    navigate,
    activeViewportIndex,
    updateViewport,
  ]);

  // Tải series khi có thông tin study
  useEffect(() => {
    if (studyInfo && studyInstanceUID) {
      fetchSeriesList(studyInstanceUID)
        .then((seriesList) => {
          // Log để kiểm tra dữ liệu
          console.log("Dữ liệu series nhận được:", seriesList);
          if (seriesList && seriesList.length > 0) {
            console.log("Series đầu tiên:", seriesList[0]);
          }

          // Tự động chọn series đầu tiên nếu có và chưa có series nào được chọn
          if (seriesList && seriesList.length > 0 && !currentSeriesUID) {
            console.log(
              "Tự động chọn series đầu tiên:",
              seriesList[0].seriesInstanceUID
            );
            setCurrentSeries(seriesList[0].seriesInstanceUID);
          }
        })
        .catch((error) => {
          console.error("Lỗi khi tải danh sách series:", error);
        });
    }
  }, [
    studyInfo,
    studyInstanceUID,
    fetchSeriesList,
    currentSeriesUID,
    setCurrentSeries,
  ]);

  // Tải instances khi có series được chọn
  useEffect(() => {
    console.log("Kiểm tra điều kiện tải instances:");
    console.log("- studyInfo:", studyInfo ? "Có" : "Không");
    console.log("- currentSeriesUID:", currentSeriesUID || "Không có");
    console.log("- isLoadingRef.current:", isLoadingRef.current);

    if (studyInfo && currentSeriesUID && !isLoadingRef.current) {
      console.log("Bắt đầu tải instances cho series:", currentSeriesUID);
      isLoadingRef.current = true;

      // Cập nhật viewport với seriesInstanceUID
      updateViewport(String(activeViewportIndex), {
        seriesInstanceUID: currentSeriesUID,
      });

      fetchSeriesInstances(studyInfo.StudyInstanceUID, currentSeriesUID)
        .then((result) => {
          console.log("Kết quả tải instances:", result);
          console.log("ImageStack sau khi tải:", imageStack);
          isLoadingRef.current = false;
        })
        .catch((error) => {
          console.error("Lỗi khi tải instances:", error);
          isLoadingRef.current = false;
        });
    }
  }, [
    studyInfo,
    currentSeriesUID,
    fetchSeriesInstances,
    activeViewportIndex,
    updateViewport,
    imageStack,
  ]);

  // Sửa lại useEffect để đảm bảo element được gán và kích hoạt đúng thời điểm
  useEffect(() => {
    // Đảm bảo chỉ chạy khi component đã mount và viewportContainerRef đã có giá trị
    if (viewportContainerRef.current && cornerstoneReady) {
      console.log("Element DOM đã được tạo, đang kích hoạt Cornerstone...");
      try {
        // Gán element ref từ viewportContainerRef
        if (element && element.current !== viewportContainerRef.current) {
          element.current = viewportContainerRef.current;
          console.log("Đã gán element ref cho viewport container");

          // Kích hoạt Cornerstone ngay sau khi gán element
          cornerstone.enable(viewportContainerRef.current);
          console.log("Đã kích hoạt Cornerstone thành công cho element");
        }
      } catch (error) {
        console.error("Lỗi khi kích hoạt Cornerstone cho element:", error);
      }
    }
  }, [cornerstoneReady, element]);

  // Sửa lại useEffect tải image stack để xử lý URL hình ảnh đúng cách
  useEffect(() => {
    console.log("Trạng thái các điều kiện:");
    console.log("- imageStack.length:", imageStack.length);
    console.log("- isEnabled:", isEnabled);
    console.log("- element.current:", element.current ? "Có" : "Không");
    console.log("- cornerstoneReady:", cornerstoneReady);

    // Kiểm tra chi tiết element
    if (element.current) {
      console.log("Element details:", {
        id: element.current.id,
        className: element.current.className,
        isConnected: element.current.isConnected,
        parentElement: element.current.parentElement ? "Có" : "Không",
      });
    }

    // Kiểm tra từng điều kiện riêng biệt
    if (!imageStack.length) {
      console.log("Chưa có dữ liệu hình ảnh để tải");
      return;
    }

    // Nếu element chưa tồn tại, thử gán lại từ viewportContainerRef
    if (!element.current && viewportContainerRef.current) {
      element.current = viewportContainerRef.current;
      console.log("Đã gán lại element ref từ viewportContainerRef");

      // Kích hoạt Cornerstone nếu chưa được kích hoạt
      if (cornerstoneReady && !isEnabled) {
        try {
          cornerstone.enable(viewportContainerRef.current);
          console.log(
            "Đã kích hoạt Cornerstone thành công cho element (trong useEffect tải image)"
          );
          // Trả về sớm để đợi re-render với isEnabled = true
          return;
        } catch (error) {
          console.error("Lỗi khi kích hoạt Cornerstone cho element:", error);
        }
      }
    }

    if (!isEnabled) {
      console.log("Cornerstone chưa được kích hoạt cho element");
      return;
    }

    if (!element.current) {
      console.log("Element DOM chưa sẵn sàng");
      return;
    }

    if (!cornerstoneReady) {
      console.log("Cornerstone chưa được khởi tạo hoàn tất");
      return;
    }

    // Nếu tất cả điều kiện đều thỏa mãn
    console.log("Bắt đầu tải image stack với", imageStack.length, "hình ảnh");

    // Kiểm tra và sửa URL hình ảnh
    const cleanedImageStack = imageStack.map((url) => {
      // Loại bỏ dấu backtick và khoảng trắng thừa
      let cleanUrl = url.replace(/`/g, "").trim();

      // Đảm bảo URL không có khoảng trắng ở giữa
      cleanUrl = cleanUrl.replace(/\s+/g, "");

      // Đảm bảo URL bắt đầu bằng wadouri: (không có khoảng trắng)
      if (cleanUrl.startsWith("wadouri: ")) {
        cleanUrl = "wadouri:" + cleanUrl.substring(9);
      }

      return cleanUrl;
    });

    console.log("URL hình ảnh đầu tiên (đã làm sạch):", cleanedImageStack[0]);

    loadImageStack(cleanedImageStack)
      .then((success) => {
        if (success) {
          console.log("Đã tải image stack thành công");
          setViewportReady(true);
          setStackInitialized(true);
          setStudyLoaded(true);
        } else {
          console.error("Không thể tải image stack");
        }
      })
      .catch((error) => {
        console.error("Lỗi khi tải image stack:", error);
      });
  }, [
    imageStack,
    isEnabled,
    element,
    cornerstoneReady,
    loadImageStack,
    setStackInitialized,
    setStudyLoaded,
    viewportContainerRef,
  ]);

  // Thêm các hàm xử lý cho navigation
  const handleScrollUp = useCallback(() => {
    if (currentImageIndex > 0) {
      const newIndex = currentImageIndex - 1;
      scrollToIndex(newIndex);
      setCurrentImageIndex(newIndex);
    }
  }, [currentImageIndex, scrollToIndex, setCurrentImageIndex]);

  const handleScrollDown = useCallback(() => {
    if (currentImageIndex < imageStack.length - 1) {
      const newIndex = currentImageIndex + 1;
      scrollToIndex(newIndex);
      setCurrentImageIndex(newIndex);
    }
  }, [
    currentImageIndex,
    imageStack.length,
    scrollToIndex,
    setCurrentImageIndex,
  ]);

  const scrollThumbPosition = useCallback(() => {
    if (imageStack.length <= 1) return 0;
    return (currentImageIndex / (imageStack.length - 1)) * 100;
  }, [currentImageIndex, imageStack.length]);

  const handleScrollThumbDrag = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const trackElement = e.currentTarget.parentElement;
      if (!trackElement) return;

      const trackRect = trackElement.getBoundingClientRect();
      const trackHeight = trackRect.height;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const relativeY = moveEvent.clientY - trackRect.top;
        const percentage = Math.max(0, Math.min(1, relativeY / trackHeight));
        const newIndex = Math.round(percentage * (imageStack.length - 1));

        scrollToIndex(newIndex);
        setCurrentImageIndex(newIndex);
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [imageStack.length, scrollToIndex, setCurrentImageIndex]
  );

  // Thêm hàm để toggle panel bên trái
  const toggleLeftPanel = useCallback(() => {
    setShowLeftPanel((prev) => !prev);
  }, []);

  // Thêm hàm để thay đổi layout
  const handleLayoutChange = useCallback(
    (rows: number, columns: number) => {
      setLayout({ rows, columns });
      setViewportLayout(rows, columns);
    },
    [setViewportLayout]
  );

  // Trong useEffect khi component mount
  useEffect(() => {
    // Gán element ref từ viewportContainerRef ngay khi component mount
    if (viewportContainerRef.current) {
      element.current = viewportContainerRef.current;
      console.log("Đã gán element ref cho viewport container khi mount");
    }
  }, []);

  return (
    <div className="ohif-viewer-container">
      <div className="viewer-content">
        {showLeftPanel && (
          <div className="left-panel">
            <SeriesList
              studyInfo={studyInfo || undefined}
              currentSeriesUID={currentSeriesUID}
              onSeriesSelect={setCurrentSeries}
            />
          </div>
        )}

        <div className={`main-panel ${!showLeftPanel ? "full-width" : ""}`}>
          <div className="toolbar-container">
            <button className="toggle-panel-btn" onClick={toggleLeftPanel}>
              {showLeftPanel ? "◀" : "▶"}
            </button>

            <Toolbar element={element} studyInfo={studyInfo} />

            <div className="layout-selector">
              <button
                onClick={() => handleLayoutChange(1, 1)}
                className={
                  layout.rows === 1 && layout.columns === 1 ? "active" : ""
                }
              >
                1×1
              </button>
              <button
                onClick={() => handleLayoutChange(1, 2)}
                className={
                  layout.rows === 1 && layout.columns === 2 ? "active" : ""
                }
              >
                1×2
              </button>
              <button
                onClick={() => handleLayoutChange(2, 2)}
                className={
                  layout.rows === 2 && layout.columns === 2 ? "active" : ""
                }
              >
                2×2
              </button>
            </div>
          </div>

          <div
            ref={viewportContainerRef}
            className="viewports-container"
            style={{
              gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
              gridTemplateColumns: `repeat(${layout.columns}, 1fr)`,
            }}
          >
            {viewports.map((viewport: any, index: any) => (
              <div
                key={viewport.id || index}
                className={`viewport ${
                  index === activeViewportIndex ? "active" : ""
                }`}
                onClick={() => setActiveViewport(String(index))}
              >
                {index === activeViewportIndex && (
                  <>
                    <div
                      ref={viewportContainerRef}
                      className="cornerstone-element"
                      style={{
                        width: "100%",
                        height: "100%",
                        position: "relative",
                        overflow: "hidden",
                        background: "#000",
                      }}
                      data-index={index}
                    ></div>

                    {isLoading && (
                      <div className="viewport-loading">
                        <div className="loading-spinner"></div>
                      </div>
                    )}

                    {error && (
                      <div className="viewport-error">
                        Lỗi: {error}
                        <br />
                        <button
                          onClick={() => {
                            if (studyInstanceUID) {
                              resetViewerState();
                              fetchStudyInfo(studyInstanceUID);
                            }
                          }}
                        >
                          Thử lại
                        </button>
                      </div>
                    )}

                    {viewportReady && (
                      <>
                        <StackNavigation
                          currentIndex={currentImageIndex}
                          totalImages={imageStack.length}
                          onScrollUp={handleScrollUp}
                          onScrollDown={handleScrollDown}
                          thumbPosition={scrollThumbPosition()}
                          onThumbDrag={handleScrollThumbDrag}
                          studyInstanceUID={studyInstanceUID}
                          seriesInstanceUID={currentSeriesUID || undefined}
                        />
                      </>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
