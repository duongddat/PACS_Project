import { create } from "zustand";

interface Viewport {
  id: string;
  element: HTMLElement | null;
  seriesInstanceUID: string | null;
  studyInstanceUID: string | null;  // Add this property
  currentImageIndex: number;
  isActive: boolean;
}

interface ViewerState {
  studyLoaded: boolean;
  stackInitialized: boolean;
  viewportReady: boolean;
  viewports: Viewport[];
  activeViewportIndex: number;
  layout: { rows: number; columns: number };
  
  // Actions
  setStudyLoaded: (loaded: boolean) => void;
  setStackInitialized: (initialized: boolean) => void;
  setViewportReady: (ready: boolean) => void;
  addViewport: (viewport: Viewport) => void;
  removeViewport: (id: string) => void;
  setActiveViewport: (id: string) => void;
  updateViewport: (id: string, updates: Partial<Viewport>) => void;
  setLayout: (rows: number, columns: number) => void;
  resetViewerState: () => void;
}

export const useViewerStore = create<ViewerState>((set, get) => ({
  studyLoaded: false,
  stackInitialized: false,
  viewportReady: false,
  viewports: [],
  activeViewportIndex: 0,
  layout: { rows: 1, columns: 1 },
  
  setStudyLoaded: (loaded: boolean) => set({ studyLoaded: loaded }),
  setStackInitialized: (initialized: boolean) => set({ stackInitialized: initialized }),
  setViewportReady: (ready: boolean) => set({ viewportReady: ready }),
  
  addViewport: (viewport: Viewport) => set((state) => ({
    viewports: [...state.viewports, viewport]
  })),
  
  removeViewport: (id: string) => set((state) => ({
    viewports: state.viewports.filter(v => v.id !== id)
  })),
  
  setActiveViewport: (id: string) => set((state) => {
    const index = state.viewports.findIndex(v => v.id === id);
    if (index === -1) return state;
    
    return {
      activeViewportIndex: index,
      viewports: state.viewports.map((v, i) => ({
        ...v,
        isActive: i === index
      }))
    };
  }),
  
  updateViewport: (id: string, updates: Partial<Viewport>) => set((state) => ({
    viewports: state.viewports.map(v => 
      v.id === id ? { ...v, ...updates } : v
    )
  })),
  
  setLayout: (rows: number, columns: number) => set({
    layout: { rows, columns }
  }),
  
  resetViewerState: () => set({ 
    studyLoaded: false, 
    stackInitialized: false, 
    viewportReady: false,
    viewports: [],
    activeViewportIndex: 0,
    layout: { rows: 1, columns: 1 }
  }),
}));