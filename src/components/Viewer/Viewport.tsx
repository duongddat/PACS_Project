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

  // Hàm để điều chỉnh hình hình hình hình hình hình hình ảnh vừa với viewport
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
        console.error(
          "Lỗi khi điều chỉnh hình hình hình hình hình hình hình hình ảnh vừa với viewport:",
          err
        );
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
        let renderingEngine = cornerstone.getRenderingEngine(renderingEngineId);

        // Kiểm tra xem rendering engine có tồn tại không hoặc đã bị hủy
        if (!renderingEngine || renderingEngine.hasBeenDestroyed) {
          console.log(
            "Rendering engine không tồn tại hoặc đã bị hủy, tạo mới..."
          );
          renderingEngine = new cornerstone.RenderingEngine(renderingEngineId);
        }

        // Lưu trữ tham chiếu đến viewport hiện tại
        let stackViewport;
        try {
          stackViewport = renderingEngine.getViewport(
            viewportId
          ) as cornerstone.StackViewport;
        } catch (error) {
          console.log("Không thể lấy viewport, tạo mới...");
          stackViewport = null;
        }

        if (!stackViewport) {
          // Nếu viewport không tồn tại, tạo mới
          console.log("Viewport không tồn tại, tạo mới...");
          try {
            renderingEngine.enableElement({
              viewportId,
              element: viewportRef.current,
              type: cornerstone.Enums.ViewportType.STACK,
            });

            stackViewport = renderingEngine.getViewport(
              viewportId
            ) as cornerstone.StackViewport;

            if (!stackViewport) {
              throw new Error("Không thể tạo viewport mới");
            }
          } catch (error: any) {
            console.error("Lỗi khi tạo viewport mới:", error);

            // Nếu rendering engine đã bị hủy, tạo mới
            if (
              error.message &&
              error.message.includes(
                "has been manually called to free up memory"
              )
            ) {
              renderingEngine = new cornerstone.RenderingEngine(
                renderingEngineId
              );
              renderingEngine.enableElement({
                viewportId,
                element: viewportRef.current,
                type: cornerstone.Enums.ViewportType.STACK,
              });
              stackViewport = renderingEngine.getViewport(
                viewportId
              ) as cornerstone.StackViewport;
            } else {
              throw error;
            }
          }
        }

        // Reset viewport
        stackViewport.reset();
        stackViewport.render();

        // Tải hình ảnh và trích xuất metadata
        try {
          // Tải hình ảnh
          const image = await cornerstone.imageLoader.loadAndCacheImage(
            imageId
          );

          // Trích xuất thông tin DICOM
          await extractDicomInfo(imageId);

          // Kiểm tra lại viewport sau khi tải hình ảnh
          try {
            // Kiểm tra xem rendering engine có còn tồn tại không
            if (renderingEngine.hasBeenDestroyed) {
              console.log("Rendering engine đã bị hủy, tạo mới...");
              renderingEngine = new cornerstone.RenderingEngine(
                renderingEngineId
              );
              renderingEngine.enableElement({
                viewportId,
                element: viewportRef.current,
                type: cornerstone.Enums.ViewportType.STACK,
              });
              stackViewport = renderingEngine.getViewport(
                viewportId
              ) as cornerstone.StackViewport;
            } else {
              stackViewport = renderingEngine.getViewport(
                viewportId
              ) as cornerstone.StackViewport;
            }

            if (!stackViewport) {
              // Nếu viewport không còn tồn tại, tạo mới
              renderingEngine.enableElement({
                viewportId,
                element: viewportRef.current,
                type: cornerstone.Enums.ViewportType.STACK,
              });

              stackViewport = renderingEngine.getViewport(
                viewportId
              ) as cornerstone.StackViewport;
            }

            // Thiết lập stack và render
            stackViewport.setStack([imageId]);
            fitImageToViewport(stackViewport);
            stackViewport.render();
          } catch (viewportError: any) {
            console.error(
              "Lỗi khi truy cập viewport sau khi tải hình ảnh:",
              viewportError
            );
            // Kiểm tra xem lỗi có phải do rendering engine đã bị hủy không
            if (
              viewportError.message &&
              viewportError.message.includes(
                "has been manually called to free up memory"
              )
            ) {
              console.log("Rendering engine đã bị hủy, tạo mới...");
              renderingEngine = new cornerstone.RenderingEngine(
                renderingEngineId
              );
            }

            // Tạo lại viewport
            renderingEngine.enableElement({
              viewportId,
              element: viewportRef.current,
              type: cornerstone.Enums.ViewportType.STACK,
            });

            const newViewport = renderingEngine.getViewport(
              viewportId
            ) as cornerstone.StackViewport;

            newViewport.setStack([imageId]);
            fitImageToViewport(newViewport);
            newViewport.render();
          }
        } catch (loadError) {
          console.error("Lỗi khi tải hình ảnh:", loadError);
          throw loadError;
        }
      } catch (error) {
        console.error("Lỗi khi tải và hiển thị hình ảnh:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [renderingEngineId, viewportId, fitImageToViewport, extractDicomInfo]
  );

  // Thêm hàm để xóa cache khi cần thiết
  const clearCache = useCallback(() => {
    metadataCacheRef.current.clear();
    // Xóa cache của cornerstone
    cornerstone.cache.purgeCache();
  }, []);

  // Khởi tạo viewport khi component được mount
  useEffect(() => {
    if (!viewportRef.current) return;

    // Xóa cache khi component được mount
    clearCache();

    // Kiểm tra xem rendering engine có tồn tại không hoặc đã bị hủy
    let renderingEngine = cornerstone.getRenderingEngine(renderingEngineId);
    if (!renderingEngine || renderingEngine.hasBeenDestroyed) {
      console.log("Tạo mới rendering engine...");
      renderingEngine = new cornerstone.RenderingEngine(renderingEngineId);
    }

    const viewportInput = {
      viewportId,
      element: viewportRef.current,
      type: cornerstone.Enums.ViewportType.STACK,
      background: [0, 0, 0], // Đặt màu nền đen
    };

    try {
      renderingEngine.enableElement(viewportInput);
    } catch (error: any) {
      console.error("Lỗi khi kích hoạt element:", error);

      // Nếu rendering engine đã bị hủy, tạo mới
      if (
        error.message &&
        error.message.includes("has been manually called to free up memory")
      ) {
        console.log("Rendering engine đã bị hủy, tạo mới...");
        renderingEngine = new cornerstone.RenderingEngine(renderingEngineId);
        renderingEngine.enableElement(viewportInput);
      }
    }

    // Kiểm tra xem tool group đã tồn tại chưa
    let toolGroup = cornerstoneTools.ToolGroupManager.getToolGroup(toolGroupId);

    if (!toolGroup) {
      toolGroup =
        cornerstoneTools.ToolGroupManager.createToolGroup(toolGroupId);
    }

    if (toolGroup) {
      // Thêm các công cụ cần thiết
      toolGroup.addTool(cornerstoneTools.PanTool.toolName);
      toolGroup.addTool(cornerstoneTools.ZoomTool.toolName);
      toolGroup.addTool(cornerstoneTools.WindowLevelTool.toolName);
      toolGroup.addTool(cornerstoneTools.LengthTool.toolName);
      toolGroup.addTool(cornerstoneTools.AngleTool.toolName);
      toolGroup.addTool(cornerstoneTools.StackScrollTool.toolName);
      toolGroup.addTool(cornerstoneTools.BidirectionalTool.toolName);
      toolGroup.addTool(cornerstoneTools.AnnotationTool.toolName);
      toolGroup.addTool(cornerstoneTools.EllipticalROITool.toolName);
      toolGroup.addTool(cornerstoneTools.CircleROITool.toolName);
      toolGroup.addTool(cornerstoneTools.PlanarFreehandROITool.toolName);
      toolGroup.addTool(cornerstoneTools.SplineROITool.toolName);

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
      // Xóa cache trước khi unmount
      clearCache();

      try {
        const engine = cornerstone.getRenderingEngine(renderingEngineId);
        if (engine && !engine.hasBeenDestroyed) {
          engine.disableElement(viewportId);
          engine.destroy();
        }

        if (cornerstoneTools.ToolGroupManager.getToolGroup(toolGroupId)) {
          cornerstoneTools.ToolGroupManager.destroyToolGroup(toolGroupId);
        }
      } catch (error) {
        console.error("Lỗi khi dọn dẹp rendering engine:", error);
      }
    };
  }, [id, renderingEngineId, viewportId, toolGroupId, clearCache]);

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

    // Xóa cache khi chuyển sang hình ảnh mới
    // Chỉ xóa cache cornerstone, giữ lại metadata cache
    cornerstone.cache.purgeCache();

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
    if (!viewport || !viewport.imageIds?.length) return {};

    const totalFrames = viewport.imageIds.length;
    const currentFrame = viewport.currentImageIdIndex;

    if (totalFrames <= 0) return { top: "0%", height: "100%" };

    // Tính chiều cao của thanh chỉ báo dựa trên số lượng frame
    const height = 100 / totalFrames;
    
    // Tính vị trí top dựa trên frame hiện tại
    // Sử dụng currentFrame / (totalFrames - 1) để đảm bảo frame cuối cùng ở vị trí 100%
    let top = totalFrames > 1 
      ? (currentFrame / (totalFrames - 1)) * (100 - height) 
      : 0;

    return {
      top: `${top}%`,
      height: `${height}%`,
    };
  }, [viewport?.imageIds?.length, viewport?.currentImageIdIndex]);

  // Cập nhật phần render của component
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

          {/* Thông tin window/level */}
          <div className="dicom-info dicom-info-bottom-left">
            <p>
              W: {dicomInfo.windowWidth} / L: {dicomInfo.windowCenter}
            </p>
          </div>

          {/* Thêm hiển thị số frame ở góc dưới bên phải */}
          <div className="dicom-info dicom-info-bottom-right">
            <p>
              Frame: {viewport.currentImageIdIndex + 1} / {viewport.imageIds.length}
            </p>
          </div>

          {/* Thanh cuộn dọc */}
          {viewport.imageIds.length > 1 && (
            <div className="vertical-scroll-container">
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
