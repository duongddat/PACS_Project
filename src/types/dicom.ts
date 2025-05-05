// DICOM Study interface
export interface DicomStudy {
  StudyInstanceUID: string;
  PatientID?: string;
  PatientName?: string;
  PatientBirthDate?: string;
  PatientSex?: string;
  StudyDate?: string;
  StudyTime?: string;
  AccessionNumber?: string;
  StudyDescription?: string;
  seriesList?: SeriesItem[];
  Modalities?: string; // Thêm trường này để hiển thị các loại hình ảnh trong study
  NumberOfSeries?: number; // Số lượng series trong study
  NumberOfInstances?: number; // Tổng số instances trong study
  // Add any other properties that might be needed
}

// Series interface
export interface SeriesItem {
  seriesInstanceUID: string;
  seriesNumber?: number;
  seriesDescription?: string;
  modality?: string;
  instanceCount?: number;
  thumbnailUrl?: string;
  firstInstanceUID?: string; // UID của instance đầu tiên để lấy thumbnail
  hasWarning?: boolean; // Cờ hiển thị cảnh báo như trong hình
  // Add any other properties that might be needed
}

// Instance interface
export interface DicomInstance {
  SOPInstanceUID: string;
  instanceNumber?: number;
  imageId?: string;
  rows?: number;
  columns?: number;
  // Add any other properties that might be needed
}