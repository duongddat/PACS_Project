import React, { useEffect, useRef, useCallback, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCornerstone } from "../hooks/useCornerstone";
import { Toolbar } from "./Toolbar";
import { ViewportInfo } from "./ViewportInfo";
import { StackNavigation } from "./StackNavigation";
import { SeriesList } from "./SeriesList";
import { useDicomStore } from "../store/dicomStore";
import { useViewerStore } from "../store/viewerStore";
import "./DicomViewer.css";

export const DicomViewer: React.FC = () => {
  const { studyInstanceUID } = useParams<{ studyInstanceUID: string }>();
  const navigate = useNavigate();
  const [viewportReady, setViewportReady] = useState(false);

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
    setCurrentSeries, // Add this missing import
  } = useDicomStore();

  const { studyLoaded, setStackInitialized, setStudyLoaded, resetViewerState } =
    useViewerStore();

  const error = cornerstoneError || dicomError;

  // Refs để tránh re-renders không cần thiết
  const isLoadingRef = useRef(false);
  const imageStackRef = useRef(imageStack);

  // Cập nhật ref khi imageStack thay đổi
  useEffect(() => {
    imageStackRef.current = imageStack;
  }, [imageStack]);

  // Tải thông tin study khi component được mount
  useEffect(() => {
    if (studyInstanceUID) {
      resetViewerState();
      fetchStudyInfo(studyInstanceUID);
    } else {
      // Nếu không có studyInstanceUID, chuyển hướng về trang danh sách
      navigate("/");
    }
  }, [studyInstanceUID, fetchStudyInfo, resetViewerState, navigate]);

  // Tải series khi có thông tin study
  useEffect(() => {
    if (studyInfo && studyInstanceUID) {
      fetchSeriesList(studyInstanceUID);
    }
  }, [studyInfo, studyInstanceUID, fetchSeriesList]);

  // Tải instances khi có series được chọn
  useEffect(() => {
    if (studyInfo && currentSeriesUID && !isLoadingRef.current) {
      isLoadingRef.current = true;
      fetchSeriesInstances(
        studyInfo.StudyInstanceUID,
        currentSeriesUID
      ).finally(() => {
        isLoadingRef.current = false;
      });
    }
  }, [studyInfo, currentSeriesUID, fetchSeriesInstances]);

  // Tải stack hình ảnh khi imageStack thay đổi
  useEffect(() => {
    const loadStack = async () => {
      if (
        isEnabled &&
        element.current &&
        imageStack.length > 0 &&
        !studyLoaded
      ) {
        try {
          console.log("Đang tải stack hình ảnh...", imageStack.length);
          const success = await loadImageStack(imageStack);

          if (success) {
            console.log("Đã tải stack hình ảnh thành công");
            setStudyLoaded(true);
            setStackInitialized(true);
            setViewportReady(true);
            setCurrentImageIndex(0);
          } else {
            console.error("Không thể tải stack hình ảnh");
          }
        } catch (error) {
          console.error("Lỗi khi tải stack hình ảnh:", error);
        }
      }
    };

    loadStack();
  }, [
    isEnabled,
    element,
    imageStack,
    loadImageStack,
    studyLoaded,
    setStudyLoaded,
    setStackInitialized,
    setCurrentImageIndex,
  ]);

  // Thêm event listener để theo dõi sự thay đổi của frame hiện tại
  useEffect(() => {
    if (
      !element.current ||
      !isEnabled ||
      imageStack.length === 0 ||
      !viewportReady
    )
      return;

    // Lưu trữ tham chiếu đến element hiện tại để sử dụng trong cleanup function
    const currentElement = element.current;

    const updateCurrentIndex = (event: any) => {
      if (!currentElement) return;

      try {
        // Kiểm tra xem cornerstoneTools có tồn tại không
        if (!(window as any).cornerstoneTools) {
          console.error("cornerstoneTools chưa được khởi tạo");
          return;
        }

        // Lấy stack state từ cornerstone
        const stackState = (window as any).cornerstoneTools.getToolState(
          currentElement,
          "stack"
        );

        if (stackState && stackState.data && stackState.data.length > 0) {
          const newIndex = stackState.data[0].currentImageIdIndex;
          if (newIndex !== currentImageIndex) {
            setCurrentImageIndex(newIndex);
          }
        }
      } catch (error) {
        console.error("Lỗi khi cập nhật chỉ số hình ảnh hiện tại:", error);
      }
    };

    // Đăng ký sự kiện cornerstoneimagerendered để cập nhật chỉ số khi hình ảnh thay đổi
    currentElement.addEventListener(
      "cornerstoneimagerendered",
      updateCurrentIndex
    );

    return () => {
      // Sử dụng biến currentElement đã lưu trữ trong cleanup function
      if (currentElement) {
        currentElement.removeEventListener(
          "cornerstoneimagerendered",
          updateCurrentIndex
        );
      }
    };
  }, [
    element,
    isEnabled,
    imageStack,
    currentImageIndex,
    viewportReady,
    setCurrentImageIndex,
  ]);

  // Thêm hàm xử lý cuộn chuột thủ công
  const handleScrollUp = useCallback(() => {
    if (currentImageIndex <= 0 || !viewportReady) return;
    scrollToIndex(currentImageIndex - 1);
  }, [currentImageIndex, scrollToIndex, viewportReady]);

  const handleScrollDown = useCallback(() => {
    if (currentImageIndex >= imageStackRef.current.length - 1 || !viewportReady)
      return;
    scrollToIndex(currentImageIndex + 1);
  }, [currentImageIndex, scrollToIndex, viewportReady]);

  // Tính toán vị trí của thanh cuộn
  const scrollThumbPosition = useCallback(() => {
    if (imageStack.length <= 1) return 0;
    const trackHeight = 100; // Phần trăm chiều cao của track
    return (currentImageIndex / (imageStack.length - 1)) * trackHeight;
  }, [currentImageIndex, imageStack.length]);

  // Xử lý khi người dùng kéo thanh cuộn
  const handleScrollThumbDrag = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!element.current || imageStack.length <= 1 || !viewportReady) return;

      const trackElement = e.currentTarget.parentElement;
      if (!trackElement) return;

      const trackRect = trackElement.getBoundingClientRect();
      const trackHeight = trackRect.height;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const y = moveEvent.clientY - trackRect.top;
        const percentage = Math.max(0, Math.min(1, y / trackHeight));
        const newIndex = Math.round(percentage * (imageStack.length - 1));

        if (newIndex !== currentImageIndex) {
          scrollToIndex(newIndex);
        }
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [
      element,
      imageStack.length,
      currentImageIndex,
      scrollToIndex,
      viewportReady,
    ]
  );

  return (
    <div className="dicom-viewer-container">
      <SeriesList
        studyInfo={studyInfo || undefined}
        currentSeriesUID={currentSeriesUID}
        onSeriesSelect={setCurrentSeries}
      />

      <div className="viewer-main-content">
        <Toolbar element={element} studyInfo={studyInfo} />

        <div className="viewer-viewport">
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

          <div
            ref={element}
            className="cornerstone-element"
            style={{ width: "100%", height: "100%" }}
          ></div>

          {imageStack.length > 1 && viewportReady && (
            <div className="scroll-indicator">
              <div className="scroll-track">
                <div
                  className="scroll-thumb"
                  style={{ top: `${scrollThumbPosition()}%` }}
                  onMouseDown={handleScrollThumbDrag}
                ></div>
              </div>
            </div>
          )}

          {viewportReady && imageStack.length > 0 && (
            <div className="viewport-overlay">
              <StackNavigation
                currentIndex={currentImageIndex}
                totalImages={imageStack.length}
                onScrollUp={handleScrollUp}
                onScrollDown={handleScrollDown}
              />
            </div>
          )}
        </div>

        <ViewportInfo studyInfo={studyInfo || undefined} />
      </div>
    </div>
  );
};
