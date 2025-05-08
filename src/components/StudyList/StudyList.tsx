import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DicomWebApi } from "../../api/DicomWebApi";
import { DicomStudy } from "../../utils/dicomUtils";
import "./StudyList.css";

interface StudyListProps {
  // Các props nếu cần
}

const StudyList: React.FC<StudyListProps> = () => {
  const [studies, setStudies] = useState<DicomStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [searchParams, setSearchParams] = useState({
    patientName: "",
    patientId: "",
    studyDate: "",
    modality: "",
    accessionNumber: "",
  });

  // Tải danh sách nghiên cứu
  const loadStudies = async () => {
    try {
      setLoading(true);
      setError(null);

      // Tạo tham số tìm kiếm
      const params: Record<string, string> = {};
      if (searchParams.patientName)
        params["PatientName"] = searchParams.patientName;
      if (searchParams.patientId) params["PatientID"] = searchParams.patientId;
      if (searchParams.studyDate) params["StudyDate"] = searchParams.studyDate;
      if (searchParams.modality)
        params["ModalitiesInStudy"] = searchParams.modality;
      if (searchParams.accessionNumber)
        params["AccessionNumber"] = searchParams.accessionNumber;

      const studiesData = await DicomWebApi.getStudies(params);
      setStudies(studiesData);
    } catch (err) {
      console.error("Lỗi khi tải danh sách nghiên cứu:", err);
      setError("Không thể tải danh sách nghiên cứu. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  // Tải danh sách nghiên cứu khi component được mount
  useEffect(() => {
    loadStudies();
  }, []);

  // Xử lý thay đổi tham số tìm kiếm
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Xử lý tìm kiếm
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadStudies();
  };

  // Xử lý xóa tìm kiếm
  const handleClearSearch = () => {
    setSearchParams({
      patientName: "",
      patientId: "",
      studyDate: "",
      modality: "",
      accessionNumber: "",
    });
    // Tải lại danh sách nghiên cứu không có tham số tìm kiếm
    loadStudies();
  };

  // Format ngày từ YYYYMMDD sang DD/MM/YYYY
  const formatDate = (dateString: string) => {
    if (!dateString || dateString.length !== 8) return dateString;
    return `${dateString.slice(6, 8)}/${dateString.slice(
      4,
      6
    )}/${dateString.slice(0, 4)}`;
  };

  // Toggle advanced search
  const toggleAdvancedSearch = () => {
    setIsAdvancedSearchOpen(!isAdvancedSearchOpen);
  };

  return (
    <div className="study-list-container">
      <div className="study-list-header">
        <h1>Danh sách nghiên cứu</h1>
        <p className="study-count">
          {!loading && (
            <span>
              Tìm thấy <strong>{studies.length}</strong> nghiên cứu
            </span>
          )}
        </p>
      </div>

      {/* Form tìm kiếm cơ bản luôn hiển thị */}
      <div className="search-bar">
        <form onSubmit={handleSearch} className="basic-search-form">
          <div className="search-input-wrapper">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              name="patientName"
              value={searchParams.patientName}
              onChange={handleSearchChange}
              placeholder="Tìm kiếm theo tên bệnh nhân..."
              className="basic-search-input"
            />
            {searchParams.patientName && (
              <button
                type="button"
                className="clear-input-btn"
                onClick={() => {
                  setSearchParams((prev) => ({ ...prev, patientName: "" }));
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
          <button type="submit" className="basic-search-btn">
            Tìm kiếm
          </button>
          <button
            type="button"
            className={`advanced-search-toggle ${
              isAdvancedSearchOpen ? "active" : ""
            }`}
            onClick={toggleAdvancedSearch}
          >
            <i className="fas fa-sliders-h"></i>
            <span className="toggle-text">Tìm kiếm nâng cao</span>
          </button>
        </form>
      </div>

      {/* Form tìm kiếm nâng cao có thể mở/đóng */}
      <div
        className={`advanced-search-panel ${
          isAdvancedSearchOpen ? "open" : ""
        }`}
      >
        <form onSubmit={handleSearch} className="advanced-search-form">
          <div className="search-grid">
            <div className="search-field">
              <label htmlFor="patientId">ID bệnh nhân</label>
              <input
                type="text"
                id="patientId"
                name="patientId"
                value={searchParams.patientId}
                onChange={handleSearchChange}
                placeholder="Nhập ID bệnh nhân"
              />
            </div>

            <div className="search-field">
              <label htmlFor="studyDate">Ngày nghiên cứu</label>
              <input
                type="date"
                id="studyDate"
                name="studyDate"
                value={searchParams.studyDate}
                onChange={handleSearchChange}
              />
            </div>

            <div className="search-field">
              <label htmlFor="modality">Phương thức</label>
              <input
                type="text"
                id="modality"
                name="modality"
                value={searchParams.modality}
                onChange={handleSearchChange}
                placeholder="CT, MR, XR, ..."
              />
            </div>

            <div className="search-field">
              <label htmlFor="accessionNumber">Số tiếp nhận</label>
              <input
                type="text"
                id="accessionNumber"
                name="accessionNumber"
                value={searchParams.accessionNumber}
                onChange={handleSearchChange}
                placeholder="Nhập số tiếp nhận"
              />
            </div>
          </div>

          <div className="advanced-search-buttons">
            <button type="submit" className="search-button">
              <i className="fas fa-search"></i> Áp dụng bộ lọc
            </button>
            <button
              type="button"
              className="clear-button"
              onClick={handleClearSearch}
            >
              <i className="fas fa-eraser"></i> Xóa bộ lọc
            </button>
          </div>
        </form>
      </div>

      {/* Hiển thị lỗi nếu có */}
      {error && (
        <div className="message error-message">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      {/* Hiển thị trạng thái đang tải */}
      {loading && (
        <div className="message loading-message">
          <div className="spinner"></div> Đang tải danh sách nghiên cứu...
        </div>
      )}

      {/* Không có kết quả */}
      {!loading && studies.length === 0 && (
        <div className="message info-message">
          <i className="fas fa-info-circle"></i> Không tìm thấy nghiên cứu nào.
        </div>
      )}

      {/* Bảng danh sách nghiên cứu */}
      {!loading && studies.length > 0 && (
        <div className="table-responsive">
          <table className="studies-table">
            <thead>
              <tr>
                <th>Tên bệnh nhân</th>
                <th>ID bệnh nhân</th>
                <th>Ngày nghiên cứu</th>
                <th>Mô tả</th>
                <th>Số tiếp nhận</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {studies.map((study, index) => {
                const studyInstanceUID =
                  study.StudyInstanceUID || `study-${index}`;

                return (
                  <tr key={studyInstanceUID}>
                    <td data-label="Tên bệnh nhân">{study.PatientName}</td>
                    <td data-label="ID bệnh nhân">{study.PatientID}</td>
                    <td data-label="Ngày nghiên cứu">
                      {formatDate(study.StudyDate)}
                    </td>
                    <td data-label="Mô tả">{study.StudyDescription || "—"}</td>
                    <td data-label="Số tiếp nhận">
                      {study.AccessionNumber || "—"}
                    </td>
                    <td data-label="Hành động">
                      <Link
                        to={`/viewer/${studyInstanceUID}`}
                        className="view-button"
                      >
                        <i className="fas fa-eye"></i> Xem
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudyList;
