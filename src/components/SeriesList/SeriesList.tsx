import React from "react";
import { SeriesItem } from "../../store/dicomStore";
import "./SeriesList.css";

interface SeriesListProps {
  studyInfo?: any;
  currentSeriesUID: string | null;
  onSeriesSelect: (seriesUID: string) => void;
}

export const SeriesList: React.FC<SeriesListProps> = ({
  studyInfo,
  currentSeriesUID,
  onSeriesSelect,
}) => {
  // Lấy danh sách series từ studyInfo hoặc sử dụng mảng rỗng nếu không có
  const seriesList: SeriesItem[] = studyInfo?.seriesList || [];

  if (seriesList.length === 0) {
    return (
      <div className="series-list-container">
        <div className="series-list-header">
          <h3>Danh sách Series</h3>
        </div>
        <div className="series-list-empty">
          <p>Không có series nào</p>
        </div>
      </div>
    );
  }

  return (
    <div className="series-list-container">
      <div className="series-list-header">
        <h3>Danh sách Series</h3>
      </div>
      <div className="series-list">
        {seriesList.map((series) => (
          <div
            key={series.seriesInstanceUID}
            className={`series-item ${
              currentSeriesUID === series.seriesInstanceUID ? "active" : ""
            }`}
            onClick={() => onSeriesSelect(series.seriesInstanceUID)}
          >
            <div className="series-thumbnail">
              {series.thumbnailUrl ? (
                <img src={series.thumbnailUrl} alt="Series thumbnail" />
              ) : (
                <div className="thumbnail-placeholder">
                  <span>{series.modality}</span>
                </div>
              )}
            </div>
            <div className="series-info">
              <div className="series-description">
                {series.seriesDescription || "Không có mô tả"}
              </div>
              <div className="series-details">
                <span>Series #{series.seriesNumber}</span>
                <span>{series.instanceCount} images</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
