// Kiểu dữ liệu cho nghiên cứu
export interface Study {
  StudyInstanceUID: string;
  PatientName?: string;
  PatientID?: string;
  StudyDate?: string;
  StudyTime?: string;
  AccessionNumber?: string;
  StudyDescription?: string;
  Modalities?: string;
  NumberOfSeries?: number;
  NumberOfInstances?: number;
}

// Kiểu dữ liệu cho series
export interface Series {
  SeriesInstanceUID: string;
  SeriesNumber?: string;
  SeriesDescription?: string;
  Modality?: string;
  NumberOfInstances?: number;
  BodyPartExamined?: string;
}

// Kiểu dữ liệu cho instance
export interface Instance {
  SOPInstanceUID: string;
  SOPClassUID?: string;
  InstanceNumber?: string;
  Rows?: number;
  Columns?: number;
  BitsAllocated?: number;
  PhotometricInterpretation?: string;
}

// Kiểu dữ liệu cho viewport
export interface Viewport {
  viewportId: string;
  renderingEngineId: string;
  element: HTMLDivElement;
  type: string;
}

// Kiểu dữ liệu cho công cụ
export interface Tool {
  name: string;
  mode: 'active' | 'passive' | 'enabled' | 'disabled';
  bindings?: {
    mouseButton?: number;
    modifierKey?: string;
  };
}