import { create } from "zustand";
import { Tool } from "../api/types";

interface ToolState {
  activeTool: string | null;
  tools: Tool[];

  // Actions
  setActiveTool: (toolName: string) => void;
  addTool: (tool: Tool) => void;
  removeTool: (toolName: string) => void;
  getToolByName: (toolName: string) => Tool | undefined;
}

export const useToolStore = create<ToolState>((set, get) => ({
  activeTool: null,
  tools: [
    { name: "Pan", mode: "passive", bindings: { mouseButton: 1 } },
    { name: "Zoom", mode: "passive", bindings: { mouseButton: 2 } },
    { name: "WindowLevel", mode: "passive", bindings: { mouseButton: 4 } },
    { name: "Length", mode: "passive" },
    { name: "Probe", mode: "passive" },
    { name: "StackScroll", mode: "passive" },
    // Thêm các công cụ mới
    { name: "RectangleROI", mode: "passive" },
    { name: "Bidirectional", mode: "passive" },
    { name: "Annotation", mode: "passive" },
    { name: "Ellipse", mode: "passive" },
    { name: "Rectangle", mode: "passive" },
    { name: "Circle", mode: "passive" },
    { name: "FreehandRoi", mode: "passive" },
    { name: "SplineRoi", mode: "passive" },
    { name: "LivewireTool", mode: "passive" },
  ],

  setActiveTool: (toolName) => {
    set({ activeTool: toolName });
  },

  addTool: (tool) => {
    set((state) => ({
      tools: [...state.tools.filter((t) => t.name !== tool.name), tool],
    }));
  },

  removeTool: (toolName) => {
    set((state) => ({
      tools: state.tools.filter((tool) => tool.name !== toolName),
    }));
  },

  getToolByName: (toolName) => {
    return get().tools.find((tool) => tool.name === toolName);
  },
}));
