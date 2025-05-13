import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  metaData,
  imageLoader,
  StackViewport,
  getRenderingEngine,
  RenderingEngine,
  Enums,
  cache,
} from "@cornerstonejs/core";
import {
  ToolGroupManager,
  AngleTool,
  ArrowAnnotateTool,
  BidirectionalTool,
  StackScrollTool,
  CircleROITool,
  EllipticalROITool,
  LengthTool,
  PanTool,
  PlanarFreehandROITool,
  SplineROITool,
  WindowLevelTool,
  ZoomTool,
} from "@cornerstonejs/tools";
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
  const previousImageIdRef = useRef<string | null>(null);

  const [dicomInfo, setDicomInfo] = useState({
    studyDate: "",
    seriesDescription: "",
    windowWidth: 0,
    windowCenter: 0,
    patientName: "",
    patientId: "",
    orientation: { top: "A", right: "R", bottom: "P", left: "L" },
  });

  const extractDicomInfo = useCallback(async (imageId: string) => {
    try {
      if (metadataCacheRef.current.has(imageId)) {
        setDicomInfo(metadataCacheRef.current.get(imageId));
        return;
      }

      const metadata = metaData.get("instance", imageId);

      if (!metadata) {
        await imageLoader.loadAndCacheImage(imageId);
        const updatedMetadata = metaData.get("instance", imageId);
        if (!updatedMetadata) return;
      }

      const finalMetadata = metadata || metaData.get("instance", imageId);

      if (finalMetadata) {
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

        const image = await imageLoader.loadAndCacheImage(imageId);
        const windowWidth = image.windowWidth || 0;
        const windowCenter = image.windowCenter || 0;

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

        metadataCacheRef.current.set(imageId, newDicomInfo);

        setDicomInfo(newDicomInfo);
      }
    } catch (error) {
      console.error("Lỗi khi trích xuất thông tin DICOM:", error);
    }
  }, []);

  const fitImageToViewport = useCallback((stackViewport: StackViewport) => {
    try {
      const canvas = stackViewport.getCanvas();
      if (!canvas) return;

      const viewportWidth = canvas.width;
      const viewportHeight = canvas.height;

      const image = stackViewport.getImageData();
      if (!image) return;

      const imageWidth = image.dimensions[0];
      const imageHeight = image.dimensions[1];

      const widthRatio = viewportWidth / imageWidth;
      const heightRatio = viewportHeight / imageHeight;

      const scale = Math.min(widthRatio, heightRatio) * 0.9;

      const camera = stackViewport.getCamera();
      if (camera) {
        camera.position = [0, 0, 0];
        camera.parallelScale = 1 / scale;
        stackViewport.setCamera(camera);

        stackViewport.resetCamera();
        stackViewport.resetProperties();
      }
    } catch (err) {
      console.error("Lỗi khi điều chỉnh hình ảnh vừa với viewport:", err);
    }
  }, []);

  const loadAndDisplayImage = useCallback(
    async (imageId: string) => {
      if (previousImageIdRef.current === imageId) {
        return;
      }

      previousImageIdRef.current = imageId;

      if (!viewportRef.current) {
        return;
      }

      setIsLoading(true);

      try {
        if (!viewportRef.current || !viewportRef.current.isConnected) {
          return;
        }

        let renderingEngine = getRenderingEngine(renderingEngineId);

        if (!renderingEngine || renderingEngine.hasBeenDestroyed) {
          renderingEngine = new RenderingEngine(renderingEngineId);
        }

        let stackViewport;
        try {
          stackViewport = renderingEngine.getViewport(
            viewportId
          ) as StackViewport;
        } catch (error) {
          stackViewport = null;
        }

        if (!viewportRef.current || !viewportRef.current.isConnected) {
          return;
        }

        if (!stackViewport) {
          try {
            renderingEngine.enableElement({
              viewportId,
              element: viewportRef.current,
              type: Enums.ViewportType.STACK,
            });

            stackViewport = renderingEngine.getViewport(
              viewportId
            ) as StackViewport;

            if (!stackViewport) {
              throw new Error("Không thể tạo viewport mới");
            }
          } catch (error: any) {
            console.error("Lỗi khi tạo viewport mới:", error);

            if (!viewportRef.current || !viewportRef.current.isConnected) {
              return;
            }

            if (
              error.message &&
              error.message.includes(
                "has been manually called to free up memory"
              )
            ) {
              renderingEngine = new RenderingEngine(renderingEngineId);
              renderingEngine.enableElement({
                viewportId,
                element: viewportRef.current,
                type: Enums.ViewportType.STACK,
              });
              stackViewport = renderingEngine.getViewport(
                viewportId
              ) as StackViewport;
            } else {
              throw error;
            }
          }
        }

        stackViewport.reset();
        stackViewport.render();

        try {
          await imageLoader.loadAndCacheImage(imageId);
          await extractDicomInfo(imageId);

          if (!viewportRef.current || !viewportRef.current.isConnected) {
            console.warn("Element không còn tồn tại, hủy thao tác");
            return;
          }

          try {
            if (renderingEngine.hasBeenDestroyed) {
              if (!viewportRef.current || !viewportRef.current.isConnected) {
                return;
              }

              renderingEngine = new RenderingEngine(renderingEngineId);
              renderingEngine.enableElement({
                viewportId,
                element: viewportRef.current,
                type: Enums.ViewportType.STACK,
              });
              stackViewport = renderingEngine.getViewport(
                viewportId
              ) as StackViewport;
            } else {
              stackViewport = renderingEngine.getViewport(
                viewportId
              ) as StackViewport;
            }

            if (!stackViewport) {
              if (!viewportRef.current || !viewportRef.current.isConnected) {
                return;
              }

              renderingEngine.enableElement({
                viewportId,
                element: viewportRef.current,
                type: Enums.ViewportType.STACK,
              });

              stackViewport = renderingEngine.getViewport(
                viewportId
              ) as StackViewport;
            }

            stackViewport.setStack([imageId]);
            fitImageToViewport(stackViewport);
            stackViewport.render();
          } catch (viewportError: any) {
            console.error(
              "Lỗi khi truy cập viewport sau khi tải hình ảnh:",
              viewportError
            );

            if (!viewportRef.current || !viewportRef.current.isConnected) {
              return;
            }

            if (
              viewportError.message &&
              viewportError.message.includes(
                "has been manually called to free up memory"
              )
            ) {
              renderingEngine = new RenderingEngine(renderingEngineId);
            }

            // Tạo lại viewport
            renderingEngine.enableElement({
              viewportId,
              element: viewportRef.current,
              type: Enums.ViewportType.STACK,
            });

            const newViewport = renderingEngine.getViewport(
              viewportId
            ) as StackViewport;

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

  const clearCache = useCallback(() => {
    metadataCacheRef.current.clear();
    cache.purgeCache();
  }, []);

  useEffect(() => {
    if (!viewportRef.current) return;
    clearCache();

    const initTimer = setTimeout(() => {
      if (!viewportRef.current || !viewportRef.current.isConnected) {
        return;
      }

      let renderingEngine = getRenderingEngine(renderingEngineId);
      if (!renderingEngine || renderingEngine.hasBeenDestroyed) {
        renderingEngine = new RenderingEngine(renderingEngineId);
      }

      const viewportInput = {
        viewportId,
        element: viewportRef.current,
        type: Enums.ViewportType.STACK,
        background: [0, 0, 0],
      };

      try {
        renderingEngine.enableElement(viewportInput);
      } catch (error: any) {
        console.error("Lỗi khi kích hoạt element:", error);

        if (!viewportRef.current || !viewportRef.current.isConnected) {
          return;
        }

        if (
          error.message &&
          error.message.includes("has been manually called to free up memory")
        ) {
          renderingEngine = new RenderingEngine(renderingEngineId);
          renderingEngine.enableElement(viewportInput);
        }
      }

      let toolGroup = ToolGroupManager.getToolGroup(toolGroupId);

      if (!toolGroup) {
        toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
      }

      if (toolGroup) {
        toolGroup.addTool(PanTool.toolName);
        toolGroup.addTool(ZoomTool.toolName);
        toolGroup.addTool(WindowLevelTool.toolName);
        toolGroup.addTool(LengthTool.toolName);
        toolGroup.addTool(AngleTool.toolName);
        toolGroup.addTool(StackScrollTool.toolName);
        toolGroup.addTool(BidirectionalTool.toolName);
        toolGroup.addTool(ArrowAnnotateTool.toolName);
        toolGroup.addTool(EllipticalROITool.toolName);
        toolGroup.addTool(CircleROITool.toolName);
        toolGroup.addTool(PlanarFreehandROITool.toolName);
        toolGroup.addTool(SplineROITool.toolName);

        toolGroup.setToolActive(WindowLevelTool.toolName, {
          bindings: [{ mouseButton: 1 }],
        });

        toolGroup.setToolActive(PanTool.toolName, {
          bindings: [{ mouseButton: 2 }],
        });

        toolGroup.setToolActive(ZoomTool.toolName, {
          bindings: [{ mouseButton: 3 }],
        });

        toolGroup.addViewport(viewportId, renderingEngineId);
      }
    }, 50);

    return () => {
      clearTimeout(initTimer);
      clearCache();

      try {
        const engine = getRenderingEngine(renderingEngineId);
        if (engine && !engine.hasBeenDestroyed) {
          engine.disableElement(viewportId);
          engine.destroy();
        }

        if (ToolGroupManager.getToolGroup(toolGroupId)) {
          ToolGroupManager.destroyToolGroup(toolGroupId);
        }
      } catch (error) {
        console.error("Lỗi khi dọn dẹp rendering engine:", error);
      }
    };
  }, [id, renderingEngineId, viewportId, toolGroupId, clearCache]);

  useEffect(() => {
    if (!viewportRef.current || !viewport || !viewport.imageIds.length) {
      setIsLoading(false);
      return;
    }

    if (!viewportRef.current.isConnected) {
      setIsLoading(false);
      return;
    }

    const imageId = viewport.imageIds[viewport.currentImageIdIndex];
    if (!imageId) {
      setIsLoading(false);
      return;
    }

    const loadTimer = setTimeout(() => {
      if (!viewportRef.current || !viewportRef.current.isConnected) {
        setIsLoading(false);
        return;
      }

      loadAndDisplayImage(imageId);
    }, 50);

    return () => {
      clearTimeout(loadTimer);
    };
  }, [viewport?.imageIds, viewport?.currentImageIdIndex, loadAndDisplayImage]);

  useEffect(() => {
    if (!viewportRef.current) return;

    const resizeObserver = new ResizeObserver(
      debounce(() => {
        if (!viewport || !viewport.imageIds.length || isLoading) return;

        const renderingEngine = getRenderingEngine(renderingEngineId);
        if (!renderingEngine) return;

        const stackViewport = renderingEngine.getViewport(
          viewportId
        ) as StackViewport;
        if (!stackViewport) return;
        renderingEngine.resize(true, true);
        stackViewport.render();
      }, 300)
    );

    resizeObserver.observe(viewportRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, [viewport, renderingEngineId, viewportId, isLoading]);

  useEffect(() => {
    if (!viewportRef.current) return;

    const handleWheel = throttle((event: WheelEvent) => {
      event.preventDefault();

      if (
        !viewport ||
        !viewport.imageIds.length ||
        viewport.imageIds.length <= 1 ||
        isLoading
      )
        return;

      const { nextImage, previousImage } = useViewportStore.getState();

      if (event.deltaY > 0) {
        nextImage(id);
      } else {
        previousImage(id);
      }
    }, 150);

    const viewportElement = viewportRef.current;
    viewportElement.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      viewportElement.removeEventListener("wheel", handleWheel);
    };
  }, [id, viewport, isLoading]);

  const handleViewportClick = useCallback(() => {
    setActiveViewport(id);
  }, [id, setActiveViewport]);

  const scrollIndicatorStyle = useMemo(() => {
    if (!viewport || !viewport.imageIds?.length) return {};

    const totalFrames = viewport.imageIds.length;
    const currentFrame = viewport.currentImageIdIndex;

    if (totalFrames <= 1) return { top: "0%", height: "100%" };

    const height = 100 / totalFrames;

    const top = (currentFrame / (totalFrames - 1)) * (100 - height);

    return {
      top: `${top}%`,
      height: `${height}%`,
    };
  }, [viewport?.imageIds?.length, viewport?.currentImageIdIndex]);

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
          <div className="dicom-info dicom-info-top-left">
            <p>{dicomInfo.studyDate}</p>
            <p>{dicomInfo.seriesDescription}</p>
          </div>
          <div className="dicom-info dicom-info-top-right">
            <p>{dicomInfo.patientName}</p>
            <p>{dicomInfo.patientId}</p>
          </div>
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
          <div className="dicom-info dicom-info-bottom-left">
            <p>
              W: {dicomInfo.windowWidth} / L: {dicomInfo.windowCenter}
            </p>
          </div>
          <div className="dicom-info dicom-info-bottom-right">
            <p>
              Frame: {viewport.currentImageIdIndex + 1} /{" "}
              {viewport.imageIds.length}
            </p>
          </div>
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
