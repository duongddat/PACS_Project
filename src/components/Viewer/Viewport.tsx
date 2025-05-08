import React, { useEffect, useRef, useState } from "react";
import * as cornerstone from "@cornerstonejs/core";
import * as cornerstoneTools from "@cornerstonejs/tools";
import { useViewportStore } from "../../store/viewportStore";
import "./Viewport.css";

interface ViewportProps {
  id: string;
}

const Viewport: React.FC<ViewportProps> = ({ id }) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const { viewports, setActiveViewport } = useViewportStore();
  const viewport = viewports[id];
  const renderingEngineId = `engine-${id}`;
  const viewportId = `viewport-${id}`;
  const toolGroupId = `toolgroup-${id}`;
  const [isLoading, setIsLoading] = useState(false);

  // Khởi tạo viewport khi component được mount
  useEffect(() => {
    if (!viewportRef.current) return;

    // Kích hoạt element cho cornerstone
    let renderingEngine = cornerstone.getRenderingEngine(renderingEngineId);

    // If the rendering engine already exists, destroy it first
    if (renderingEngine) {
      renderingEngine.destroy();
    }

    // Create a new rendering engine
    renderingEngine = new cornerstone.RenderingEngine(renderingEngineId);

    const viewportInput = {
      viewportId,
      element: viewportRef.current,
      type: cornerstone.Enums.ViewportType.STACK,
      background: [0, 0, 0], // Đặt màu nền đen
    };

    renderingEngine.enableElement(viewportInput);

    // Đăng ký các công cụ
    const toolGroup =
      cornerstoneTools.ToolGroupManager.createToolGroup(toolGroupId);
    if (toolGroup) {
      // Đăng ký các công cụ
      toolGroup.addTool(cornerstoneTools.PanTool.toolName);
      toolGroup.addTool(cornerstoneTools.ZoomTool.toolName);
      toolGroup.addTool(cornerstoneTools.WindowLevelTool.toolName);
      toolGroup.addTool(cornerstoneTools.LengthTool.toolName);
      toolGroup.addTool(cornerstoneTools.AngleTool.toolName);

      // Kích hoạt công cụ mặc định
      toolGroup.setToolActive(cornerstoneTools.WindowLevelTool.toolName, {
        bindings: [{ mouseButton: 1 }],
      });

      // Thêm viewport vào toolGroup
      toolGroup.addViewport(viewportId, renderingEngineId);
    }

    // Cleanup khi component unmount
    return () => {
      const engine = cornerstone.getRenderingEngine(renderingEngineId);
      if (engine) {
        engine.disableElement(viewportId);
        engine.destroy();
      }

      // Xóa toolGroup
      cornerstoneTools.ToolGroupManager.destroyToolGroup(toolGroupId);
    };
  }, [id, renderingEngineId, viewportId, toolGroupId]);

  // Xử lý khi imageIds thay đổi
  useEffect(() => {
    if (!viewportRef.current || !viewport || !viewport.imageIds.length) return;

    // Đánh dấu đang tải
    setIsLoading(true);

    // Always get a fresh reference to the rendering engine
    const renderingEngine = cornerstone.getRenderingEngine(renderingEngineId);
    if (!renderingEngine) {
      setIsLoading(false);
      return;
    }

    // Always get a fresh reference to the viewport
    const stackViewport = renderingEngine.getViewport(
      viewportId
    ) as cornerstone.StackViewport;
    if (!stackViewport) {
      setIsLoading(false);
      return;
    }

    const imageId = viewport.imageIds[viewport.currentImageIdIndex];

    // Xóa cache của ảnh hiện tại trước khi tải ảnh mới
    try {
      cornerstone.cache.purgeCache();

      // Reset viewport để xóa ảnh cũ
      stackViewport.reset();
      stackViewport.render();
    } catch (error) {
      console.error("Lỗi khi reset viewport:", error);
    }

    // Tải và hiển thị hình ảnh
    cornerstone.imageLoader
      .loadAndCacheImage(imageId)
      .then(() => {
        // Get a fresh reference again before using it
        const freshRenderingEngine =
          cornerstone.getRenderingEngine(renderingEngineId);
        if (!freshRenderingEngine) {
          setIsLoading(false);
          return;
        }

        const freshViewport = freshRenderingEngine.getViewport(
          viewportId
        ) as cornerstone.StackViewport;
        if (!freshViewport) {
          setIsLoading(false);
          return;
        }

        freshViewport.setStack([imageId]);
        freshViewport.render();

        // Kết thúc tải
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Lỗi khi tải hình ảnh:", error);
        setIsLoading(false);
      });
  }, [
    viewport?.imageIds,
    viewport?.currentImageIdIndex,
    id,
    renderingEngineId,
    viewportId,
  ]);

  // Xử lý khi currentImageIdIndex thay đổi
  useEffect(() => {
    if (!viewportRef.current || !viewport || !viewport.imageIds.length) return;

    // Đánh dấu đang tải
    setIsLoading(true);

    // Always get a fresh reference to the rendering engine
    const renderingEngine = cornerstone.getRenderingEngine(renderingEngineId);
    if (!renderingEngine) {
      setIsLoading(false);
      return;
    }

    // Always get a fresh reference to the viewport
    const stackViewport = renderingEngine.getViewport(
      viewportId
    ) as cornerstone.StackViewport;
    if (!stackViewport) {
      setIsLoading(false);
      return;
    }

    const imageId = viewport.imageIds[viewport.currentImageIdIndex];

    // Xóa cache của ảnh hiện tại trước khi tải ảnh mới
    try {
      // Reset viewport để xóa ảnh cũ
      stackViewport.reset();
      stackViewport.render();
    } catch (error) {
      console.error("Lỗi khi reset viewport:", error);
    }

    // Tải và hiển thị hình ảnh mới
    cornerstone.imageLoader
      .loadAndCacheImage(imageId)
      .then(() => {
        // Get a fresh reference again before using it
        const freshRenderingEngine =
          cornerstone.getRenderingEngine(renderingEngineId);
        if (!freshRenderingEngine) {
          setIsLoading(false);
          return;
        }

        const freshViewport = freshRenderingEngine.getViewport(
          viewportId
        ) as cornerstone.StackViewport;
        if (!freshViewport) {
          setIsLoading(false);
          return;
        }

        freshViewport.setStack([imageId]);
        freshViewport.render();

        // Kết thúc tải
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Lỗi khi tải hình ảnh:", error);
        setIsLoading(false);
      });
  }, [viewport?.currentImageIdIndex, id, renderingEngineId, viewportId]);

  // Xử lý khi click vào viewport
  const handleViewportClick = () => {
    setActiveViewport(id);
  };

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
        <div className="viewport-overlay">
          <div className="image-index">
            {viewport.currentImageIdIndex + 1} / {viewport.imageIds.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default Viewport;
