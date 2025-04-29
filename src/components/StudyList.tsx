import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDicomStore } from "../store/dicomStore";
import "./StudyList.css";

export const StudyList: React.FC = () => {
  const { studyList, fetchStudyList, isLoading, error } = useDicomStore();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchStudyList();
  }, [fetchStudyList]);

  // Lọc danh sách study dựa trên từ khóa tìm kiếm
  const filteredStudies = studyList.filter((study) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      study.PatientName?.toLowerCase().includes(searchLower) ||
      study.PatientID?.toLowerCase().includes(searchLower) ||
      study.StudyDescription?.toLowerCase().includes(searchLower) ||
      study.AccessionNumber?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="study-list-container">
      <div className="study-list-header">
        <h2>Danh sách Studies</h2>
        <div className="search-container">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên bệnh nhân, ID, mô tả..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {isLoading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải danh sách studies...</p>
        </div>
      )}

      {error && (
        <div className="error-container">
          <p>Lỗi: {error}</p>
          <button onClick={() => fetchStudyList()} className="retry-button">
            Thử lại
          </button>
        </div>
      )}

      {!isLoading && !error && filteredStudies.length === 0 && (
        <div className="empty-list">
          <p>Không tìm thấy studies nào.</p>
        </div>
      )}

      {!isLoading && !error && filteredStudies.length > 0 && (
        <div className="study-list">
          <table className="study-table">
            <thead>
              <tr>
                <th>Tên bệnh nhân</th>
                <th>ID bệnh nhân</th>
                <th>Ngày</th>
                <th>Mô tả</th>
                <th>Accession #</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudies.map((study) => (
                <tr key={study.StudyInstanceUID}>
                  <td>{study.PatientName}</td>
                  <td>{study.PatientID}</td>
                  <td>{study.StudyDate}</td>
                  <td>{study.StudyDescription}</td>
                  <td>{study.AccessionNumber}</td>
                  <td>
                    <Link
                      to={`/viewer/${study.StudyInstanceUID}`}
                      className="view-button"
                    >
                      Xem
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
