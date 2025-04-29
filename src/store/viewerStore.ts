import { create } from "zustand";

interface ViewerState {
  studyLoaded: boolean;
  stackInitialized: boolean;
  viewportReady: boolean;
  
  // Actions
  setStudyLoaded: (loaded: boolean) => void;
  setStackInitialized: (initialized: boolean) => void;
  setViewportReady: (ready: boolean) => void;
  resetViewerState: () => void;
}

export const useViewerStore = create<ViewerState>((set) => ({
  studyLoaded: false,
  stackInitialized: false,
  viewportReady: false,
  
  setStudyLoaded: (loaded: boolean) => set({ studyLoaded: loaded }),
  setStackInitialized: (initialized: boolean) => set({ stackInitialized: initialized }),
  setViewportReady: (ready: boolean) => set({ viewportReady: ready }),
  resetViewerState: () => set({ 
    studyLoaded: false, 
    stackInitialized: false, 
    viewportReady: false 
  }),
}));