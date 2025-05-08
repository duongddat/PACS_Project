import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import * as cornerstone from "@cornerstonejs/core";
import * as cornerstoneTools from "@cornerstonejs/tools";
import { useViewportStore } from "../../store/viewportStore";
import "./Viewport.css";

interface ViewportProps {
  id: string;
}

// Hàm debounce helper
const debounce = (fn: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return function (...args: any[]) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Hàm throttle helper
const throttle = (fn: Function, delay: number) => {
  let lastCall = 0;
  return function (...args: any[]) {
    const now = Date.now();
    if (now - lastCall < delay) return;
    lastCall = now;
    fn(...args);
  };
};

const Viewport: React.FC<ViewportProps> = React.memo(({ id }) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const { viewports, setActiveViewport } = useViewportStore();
  const viewport = viewports[id];
  const renderingEngineId = `engine-${id}`;
  const viewportId = `viewport-${id}`;
  const toolGroupId = `toolgroup-${id}`;
  const [isLoading, setIsLoading] = useState(false);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const metadataCacheRef = useRef<Map<string, any>>(new Map());

  // State để lưu trữ thông tin DICOM
  const [dicomInfo, setDicomInfo] = useState({
    studyDate: "",
    seriesDescription: "",
    windowWidth: 0,
    windowCenter: 0,
    patientName: "",
    patientId: "",
    orientation: { top: "A", right: "R", bottom: "P", left: "L" },
  });

  // Hàm để trích xuất thông tin DICOM từ hình ảnh
  const extractDicomInfo = useCallback(async (imageId: string) => {
    try {
      // Kiểm tra cache trước khi tải lại
      if (metadataCacheRef.current.has(imageId)) {
        setDicomInfo(metadataCacheRef.current.get(imageId));
        return;
      }

      // Tải hình ảnh để lấy metadata nếu chưa có trong cache
      const metadata = cornerstone.metaData.get("instance", imageId);

      if (!metadata) {
        // Nếu metadata chưa có, tải hình ảnh để lấy metadata
        await cornerstone.imageLoader.loadAndCacheImage(imageId);
        // Thử lấy metadata lại sau khi tải
        const updatedMetadata = cornerstone.metaData.get("instance", imageId);
        if (!updatedMetadata) return;
      }

      const finalMetadata =
        metadata || cornerstone.metaData.get("instance", imageId);

      if (finalMetadata) {
        // Trích xuất thông tin từ metadata
        const studyDate = finalMetadata.StudyDate
          ? `${finalMetadata.StudyDate.substring(
              6,
              8
            )}/${finalMetadata.StudyDate.substring(
              4,
              6
            )}/${finalMetadata.StudyDate.substring(0, 4)}`
          : "";

        const seriesDescription = finalMetadata.SeriesDescription || "";
        const patientName = finalMetadata.PatientName || "";
        const patientId = finalMetadata.PatientID || "";

        // Lấy thông tin window/level từ hình ảnh
        const image = await cornerstone.imageLoader.loadAndCacheImage(imageId);
        const windowWidth = image.windowWidth || 0;
        const windowCenter = image.windowCenter || 0;

        // Xử lý trường hợp windowWidth và windowCenter là mảng
        const processedWindowWidth = Array.isArray(windowWidth)
          ? windowWidth[0]
          : windowWidth;
        const processedWindowCenter = Array.isArray(windowCenter)
          ? windowCenter[0]
          : windowCenter;

        const newDicomInfo = {
          studyDate,
          seriesDescription,
          windowWidth: Math.round(processedWindowWidth),
          windowCenter: Math.round(processedWindowCenter),
          patientName,
          patientId,
          orientation: { top: "A", right: "R", bottom: "P", left: "L" },
        };

        // Lưu vào cache
        metadataCacheRef.current.set(imageId, newDicomInfo);

        // Cập nhật state
        setDicomInfo(newDicomInfo);
      }
    } catch (error) {
      console.error("Lỗi khi trích xuất thông tin DICOM:", error);
    }
  }, []);

  // Hàm để điều chỉnh hình ảnh vừa với viewport
  const fitImageToViewport = useCallback(
    (stackViewport: cornerstone.StackViewport) => {
      try {
        // Lấy kích thước của viewport
        const canvas = stackViewport.getCanvas();
        if (!canvas) return;

        const viewportWidth = canvas.width;
        const viewportHeight = canvas.height;

        // Lấy kích thước của hình ảnh
        const image = stackViewport.getImageData();
        if (!image) return;

        const imageWidth = image.dimensions[0];
        const imageHeight = image.dimensions[1];

        // Tính toán tỷ lệ để hình ảnh vừa với viewport
        const widthRatio = viewportWidth / imageWidth;
        const heightRatio = viewportHeight / imageHeight;

        // Chọn tỷ lệ nhỏ hơn để đảm bảo hình ảnh vừa với viewport
        const scale = Math.min(widthRatio, heightRatio) * 0.9; // Giảm xuống 90% để có khoảng cách xung quanh

        // Thiết lập camera với tỷ lệ mới
        const camera = stackViewport.getCamera();
        if (camera) {
          // Đặt lại vị trí camera về trung tâm
          camera.position = [0, 0, 0];
          camera.parallelScale = 1 / scale;
          stackViewport.setCamera(camera);

          // Đặt lại các thông số khác
          stackViewport.resetCamera();
          stackViewport.resetProperties();
        }
      } catch (err) {
        console.error("Lỗi khi điều chỉnh hình ảnh vừa với viewport:", err);
      }
    },
    []
  );

  // Hàm tải và hiển thị hình ảnh
  const loadAndDisplayImage = useCallback(
    async (imageId: string) => {
      if (!viewportRef.current) {
        console.warn("Viewport ref không tồn tại");
        return;
      }

      setIsLoading(true);

      try {
        const renderingEngine =
          cornerstone.getRenderingEngine(renderingEngineId);
        if (!renderingEngine) {
          throw new Error("Rendering engine không tồn tại");
        }

        let stackViewport = renderingEngine.getViewport(
          viewportId
        ) as cornerstone.StackViewport;
        if (!stackViewport) {
          throw new Error("Viewport không tồn tại");
        }

        // Tối ưu: Chỉ reset viewport khi cần thiết
        stackViewport.reset();
        stackViewport.render();

        // Tối ưu: Sử dụng Promise.all để tải hình ảnh và trích xuất metadata song song
        const [image] = await Promise.all([
          cornerstone.imageLoader.loadAndCacheImage(imageId),
          extractDicomInfo(imageId),
        ]);

        // Lấy lại instance viewport mới trước khi setStack
        stackViewport = renderingEngine.getViewport(
          viewportId
        ) as cornerstone.StackViewport;
        if (!stackViewport) {
          throw new Error("Viewport không tồn tại sau khi tải hình ảnh");
        }

        // Thiết lập stack và render
        stackViewport.setStack([imageId]);
        fitImageToViewport(stackViewport);
        stackViewport.render();
      } catch (error) {
        console.error("Lỗi khi tải và hiển thị hình ảnh:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [renderingEngineId, viewportId, fitImageToViewport, extractDicomInfo]
  );

  // Khởi tạo viewport khi component được mount
  useEffect(() => {
    if (!viewportRef.current) return;

    // Kích hoạt element cho cornerstone
    let renderingEngine = cornerstone.getRenderingEngine(renderingEngineId);
    if (!renderingEngine) {
      renderingEngine = new cornerstone.RenderingEngine(renderingEngineId);
    }

    const viewportInput = {
      viewportId,
      element: viewportRef.current,
      type: cornerstone.Enums.ViewportType.STACK,
      background: [0, 0, 0], // Đặt màu nền đen
    };

    renderingEngine.enableElement(viewportInput);

    const toolGroup =
      cornerstoneTools.ToolGroupManager.createToolGroup(toolGroupId);
    if (toolGroup) {
      // Thêm các công cụ cần thiết
      toolGroup.addTool(cornerstoneTools.PanTool.toolName);
      toolGroup.addTool(cornerstoneTools.ZoomTool.toolName);
      toolGroup.addTool(cornerstoneTools.WindowLevelTool.toolName);
      toolGroup.addTool(cornerstoneTools.LengthTool.toolName);
      toolGroup.addTool(cornerstoneTools.AngleTool.toolName);
      toolGroup.addTool(cornerstoneTools.StackScrollTool.toolName);

      // Thiết lập công cụ mặc định
      toolGroup.setToolActive(cornerstoneTools.WindowLevelTool.toolName, {
        bindings: [{ mouseButton: 1 }],
      });

      toolGroup.setToolActive(cornerstoneTools.PanTool.toolName, {
        bindings: [{ mouseButton: 2 }],
      });

      toolGroup.setToolActive(cornerstoneTools.ZoomTool.toolName, {
        bindings: [{ mouseButton: 3 }],
      });

      // Kết nối toolGroup với viewport
      toolGroup.addViewport(viewportId, renderingEngineId);
    }

    // Cleanup khi component unmount
    return () => {
      const engine = cornerstone.getRenderingEngine(renderingEngineId);
      if (engine) {
        engine.disableElement(viewportId);
        engine.destroy();
      }
      cornerstoneTools.ToolGroupManager.destroyToolGroup(toolGroupId);
    };
  }, [id, renderingEngineId, viewportId, toolGroupId]);

  // Xử lý khi imageIds hoặc currentImageIdIndex thay đổi
  useEffect(() => {
    if (!viewportRef.current || !viewport || !viewport.imageIds.length) {
      setIsLoading(false);
      return;
    }

    const imageId = viewport.imageIds[viewport.currentImageIdIndex];
    if (!imageId) {
      setIsLoading(false);
      return;
    }

    loadAndDisplayImage(imageId);
  }, [viewport?.imageIds, viewport?.currentImageIdIndex, loadAndDisplayImage]);

  // Xử lý resize window
  useEffect(() => {
    if (!viewportRef.current) return;

    // Tối ưu: Sử dụng ResizeObserver thay vì window resize event
    const resizeObserver = new ResizeObserver(
      debounce(() => {
        if (!viewport || !viewport.imageIds.length || isLoading) return;

        const renderingEngine =
          cornerstone.getRenderingEngine(renderingEngineId);
        if (!renderingEngine) return;

        const stackViewport = renderingEngine.getViewport(
          viewportId
        ) as cornerstone.StackViewport;
        if (!stackViewport) return;

        // Cập nhật kích thước canvas, giữ camera
        renderingEngine.resize(true, true);

        // Tối ưu: Chỉ cần render lại, không cần tải lại hình ảnh
        stackViewport.render();
      }, 300)
    );

    resizeObserver.observe(viewportRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [viewport, renderingEngineId, viewportId, isLoading]);

  // Xử lý sự kiện cuộn chuột để chuyển đổi frame
  useEffect(() => {
    if (!viewportRef.current) return;

    // Tối ưu: Sử dụng throttle thay vì debounce để trải nghiệm mượt mà hơn
    const handleWheel = throttle((event: WheelEvent) => {
      event.preventDefault();

      if (
        !viewport ||
        !viewport.imageIds.length ||
        viewport.imageIds.length <= 1
      )
        return;

      const { nextImage, previousImage } = useViewportStore.getState();

      // Xác định hướng cuộn
      if (event.deltaY > 0) {
        // Cuộn xuống - chuyển đến hình ảnh tiếp theo
        nextImage(id);
      } else {
        // Cuộn lên - chuyển đến hình ảnh trước đó
        previousImage(id);
      }
    }, 80);

    const viewportElement = viewportRef.current;
    viewportElement.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      viewportElement.removeEventListener("wheel", handleWheel);
    };
  }, [id, viewport]);

  const handleViewportClick = useCallback(() => {
    setActiveViewport(id);
  }, [id, setActiveViewport]);

  // Tính toán các giá trị cho thanh thước dọc
  const scrollIndicatorStyle = useMemo(() => {
    if (!viewport || !viewport.imageIds.length) return {};

    const totalFrames = viewport.imageIds.length;
    const currentFrame = viewport.currentImageIdIndex;
    const position =
      totalFrames > 1 ? (currentFrame / (totalFrames - 1)) * 100 : 0;
    const height = Math.max(8, Math.min(20, 100 / totalFrames));

    return {
      top: `${position}%`,
      height: `${height}%`,
      transform: `translateY(-${height / 2}%)`,
    };
  }, [viewport?.imageIds.length, viewport?.currentImageIdIndex]);

  return (
    <div
      ref={viewportRef}
      className="viewport"
      onClick={handleViewportClick}
      data-viewport-id={id}
    >
      {(!viewport || !viewport.imageIds.length) && (
        <div className="viewport-placeholder">
          <p>Chọn series để hiển thị hình ảnh</p>
        </div>
      )}

      {isLoading && (
        <div className="viewport-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải hình ảnh...</p>
        </div>
      )}

      {viewport && viewport.imageIds.length > 0 && (
        <>
          {/* Thông tin DICOM góc trên bên trái */}
          <div className="dicom-info dicom-info-top-left">
            <p>{dicomInfo.studyDate}</p>
            <p>{dicomInfo.seriesDescription}</p>
          </div>

          {/* Thông tin DICOM góc trên bên phải */}
          <div className="dicom-info dicom-info-top-right">
            <p>{dicomInfo.patientName}</p>
            <p>{dicomInfo.patientId}</p>
          </div>

          {/* Marker hướng */}
          <div className="orientation-marker orientation-marker-top">
            {dicomInfo.orientation.top}
          </div>
          <div className="orientation-marker orientation-marker-right">
            {dicomInfo.orientation.right}
          </div>
          <div className="orientation-marker orientation-marker-bottom">
            {dicomInfo.orientation.bottom}
          </div>
          <div className="orientation-marker orientation-marker-left">
            {dicomInfo.orientation.left}
          </div>

          {/* Thông tin Window/Level */}
          <div className="window-level-info">
            W: {dicomInfo.windowWidth} L: {dicomInfo.windowCenter}
          </div>

          {/* Thông tin slice */}
          <div className="dicom-info dicom-info-bottom-right">
            I: {viewport.currentImageIdIndex + 1} (
            {viewport.currentImageIdIndex + 1}/{viewport.imageIds.length})
          </div>

          {/* Thanh thước dọc bên phải */}
          {viewport.imageIds.length > 1 && (
            <div
              className="vertical-scroll-container"
              style={{
                width: `${Math.max(
                  20,
                  Math.min(40, viewport.imageIds.length / 10)
                )}px`,
              }}
            >
              <div className="vertical-scroll-bar">
                <div
                  className="vertical-scroll-indicator"
                  style={scrollIndicatorStyle}
                ></div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
});

export default Viewport;
