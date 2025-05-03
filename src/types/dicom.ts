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
  // Add any other properties that might be needed
}

// Instance interface
export interface DicomInstance {
  SOPInstanceUID: string;
  instanceNumber?: number;
  imageId?: string;
  // Add any other properties that might be needed
}