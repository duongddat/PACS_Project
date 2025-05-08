import { create } from 'zustand';
import { DicomWebApi } from '../api/DicomWebApi';

interface ViewportState {
  activeViewportId: string | null;
  viewports: Record<string, {
    renderingEngineId: string;
    viewportId: string;
    imageIds: string[];
    currentImageIdIndex: number;
  }>;
  
  // Actions
  setActiveViewport: (viewportId: string) => void;
  addViewport: (viewportId: string, renderingEngineId: string) => void;
  removeViewport: (viewportId: string) => void;
  loadImagesForViewport: (
    viewportId: string, 
    studyInstanceUID: string, 
    seriesInstanceUID: string
  ) => Promise<void>;
  setCurrentImageIndex: (viewportId: string, index: number) => void;
  nextImage: (viewportId: string) => void;
  previousImage: (viewportId: string) => void;
}

export const useViewportStore = create<ViewportState>((set, get) => ({
  activeViewportId: null,
  viewports: {},
  
  setActiveViewport: (viewportId) => {
    set({ activeViewportId: viewportId });
  },
  
  addViewport: (viewportId, renderingEngineId) => {
    set(state => ({
      viewports: {
        ...state.viewports,
        [viewportId]: {
          renderingEngineId,
          viewportId,
          imageIds: [],
          currentImageIdIndex: 0,
        }
      }
    }));
  },
  
  removeViewport: (viewportId) => {
    set(state => {
      const { [viewportId]: _, ...rest } = state.viewports;
      return { viewports: rest };
    });
  },
  
  loadImagesForViewport: async (viewportId, studyInstanceUID, seriesInstanceUID) => {
    try {
      const imageIds = await DicomWebApi.getSeriesImageIds(studyInstanceUID, seriesInstanceUID);
      
      set(state => ({
        viewports: {
          ...state.viewports,
          [viewportId]: {
            ...state.viewports[viewportId],
            imageIds,
            currentImageIdIndex: 0,
          }
        }
      }));
      
      return;
    } catch (error) {
      console.error('Lỗi khi tải hình ảnh cho viewport:', error);
      throw error;
    }
  },
  
  setCurrentImageIndex: (viewportId, index) => {
    set(state => {
      const viewport = state.viewports[viewportId];
      if (!viewport) return state;
      
      const clampedIndex = Math.max(0, Math.min(index, viewport.imageIds.length - 1));
      
      return {
        viewports: {
          ...state.viewports,
          [viewportId]: {
            ...viewport,
            currentImageIdIndex: clampedIndex,
          }
        }
      };
    });
  },
  
  nextImage: (viewportId) => {
    set(state => {
      const viewport = state.viewports[viewportId];
      if (!viewport) return state;
      
      const newIndex = Math.min(viewport.currentImageIdIndex + 1, viewport.imageIds.length - 1);
      
      return {
        viewports: {
          ...state.viewports,
          [viewportId]: {
            ...viewport,
            currentImageIdIndex: newIndex,
          }
        }
      };
    });
  },
  
  previousImage: (viewportId) => {
    set(state => {
      const viewport = state.viewports[viewportId];
      if (!viewport) return state;
      
      const newIndex = Math.max(0, viewport.currentImageIdIndex - 1);
      
      return {
        viewports: {
          ...state.viewports,
          [viewportId]: {
            ...viewport,
            currentImageIdIndex: newIndex,
          }
        }
      };
    });
  },
}));