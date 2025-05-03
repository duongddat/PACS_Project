import React from "react";
import { DicomStudy } from "../../types/dicom";
import "./ViewportInfo.css";

export interface ViewportInfoProps {
  studyInfo: DicomStudy | null;
  currentImageIndex: number;
  totalImages: number;
}

export const ViewportInfo: React.FC<ViewportInfoProps> = ({
  studyInfo,
  currentImageIndex,
  totalImages,
}) => {
  if (!studyInfo) {
    return null;
  }

  return (
    <div className="viewport-info">
      <div className="info-section">
        <div className="info-row">
          <div className="info-label">Bệnh nhân:</div>
          <div className="info-value">{studyInfo.PatientName || "N/A"}</div>
        </div>
        <div className="info-row">
          <div className="info-label">ID:</div>
          <div className="info-value">{studyInfo.PatientID || "N/A"}</div>
        </div>
        <div className="info-row">
          <div className="info-label">Ngày:</div>
          <div className="info-value">{studyInfo.StudyDate || "N/A"}</div>
        </div>
        <div className="info-row">
          <div className="info-label">Mô tả:</div>
          <div className="info-value">
            {studyInfo.StudyDescription || "N/A"}
          </div>
        </div>
        <div className="info-row">
          <div className="info-label">Hình ảnh:</div>
          <div className="info-value">
            {currentImageIndex + 1} / {totalImages}
          </div>
        </div>
      </div>
    </div>
  );
};
