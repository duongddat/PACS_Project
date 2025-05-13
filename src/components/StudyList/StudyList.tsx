import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { DicomWebApi } from "../../api/DicomWebApi";
import { DicomStudy } from "../../utils/dicomUtils";
import styles from "./StudyList.module.css";

interface StudyListProps {
  // Các props nếu cần
}

const StudyList: React.FC<StudyListProps> = () => {
  const [studies, setStudies] = useState<DicomStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);

  const [searchParams, setSearchParams] = useState({
    patientName: "",
    patientId: "",
    studyDate: "",
    modality: "",
    accessionNumber: "",
  });

  const loadStudies = async () => {
    try {
      setLoading(true);
      setError(null);

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

  useEffect(() => {
    loadStudies();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadStudies();
  };

  const handleClearSearch = () => {
    setSearchParams({
      patientName: "",
      patientId: "",
      studyDate: "",
      modality: "",
      accessionNumber: "",
    });
    loadStudies();
  };

  const clearSearchInput = () => {
    setSearchParams((prev) => ({ ...prev, patientName: "" }));
  };

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

  const handleInputFocus = () => {
    setIsTyping(true);
  };

  const handleInputBlur = () => {
    setIsTyping(false);
  };

  return (
    <div className={`${styles["study-list-container"]} dark-theme`}>
      <div className={styles["study-list-header"]}>
        <h1>Danh sách nghiên cứu</h1>
        <p className={styles["study-count"]}>
          {!loading && (
            <span>
              Tìm thấy <strong>{studies.length}</strong> nghiên cứu
            </span>
          )}
        </p>
      </div>
      <div
        ref={searchBarRef}
        className={`${styles["search-bar"]} ${
          isTyping ? styles["typing"] : ""
        }`}
      >
        <form onSubmit={handleSearch} className={styles["basic-search-form"]}>
          <div className={styles["search-input-wrapper"]}>
            <i className={`fas fa-search ${styles["search-icon"]}`}></i>
            <input
              type="text"
              name="patientName"
              value={searchParams.patientName}
              onChange={handleSearchChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder="Tìm kiếm theo tên bệnh nhân..."
              className={styles["basic-search-input"]}
            />
            {searchParams.patientName && (
              <button
                type="button"
                className={styles["clear-input-btn"]}
                onClick={clearSearchInput}
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
          <button type="submit" className={styles["basic-search-btn"]}>
            Tìm kiếm
          </button>
          <button
            type="button"
            className={`${styles["advanced-search-toggle"]} ${
              isAdvancedSearchOpen ? styles["active"] : ""
            }`}
            onClick={toggleAdvancedSearch}
          >
            <span className={styles["toggle-text"]}>Tìm kiếm nâng cao</span>
            <i className="fas fa-chevron-down"></i>
          </button>
        </form>
      </div>
      <div
        className={`${styles["advanced-search-panel"]} ${
          isAdvancedSearchOpen ? styles["open"] : ""
        }`}
      >
        <form
          onSubmit={handleSearch}
          className={styles["advanced-search-form"]}
        >
          <div className={styles["search-grid"]}>
            <div className={styles["search-field"]}>
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
            <div className={styles["search-field"]}>
              <label htmlFor="studyDate">Ngày nghiên cứu</label>
              <input
                type="date"
                id="studyDate"
                name="studyDate"
                value={searchParams.studyDate}
                onChange={handleSearchChange}
              />
            </div>
            <div className={styles["search-field"]}>
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
            <div className={styles["search-field"]}>
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
          <div className={styles["advanced-search-buttons"]}>
            <button type="submit" className={styles["search-button"]}>
              <i className="fas fa-search"></i> Áp dụng bộ lọc
            </button>
            <button
              type="button"
              className={styles["clear-button"]}
              onClick={handleClearSearch}
            >
              <i className="fas fa-eraser"></i> Xóa bộ lọc
            </button>
          </div>
        </form>
      </div>
      {error && (
        <div className={`${styles["message"]} ${styles["error-message"]}`}>
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}
      {loading && (
        <div className={`${styles["message"]} ${styles["loading-message"]}`}>
          <div className="spinner"></div> Đang tải danh sách nghiên cứu...
        </div>
      )}
      {!loading && studies.length === 0 && (
        <div className={`${styles["message"]} ${styles["info-message"]}`}>
          <i className="fas fa-info-circle"></i> Không tìm thấy nghiên cứu nào.
        </div>
      )}
      {!loading && studies.length > 0 && (
        <div className={styles["table-responsive"]}>
          <table className={styles["studies-table"]}>
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
                        className={styles["view-button"]}
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
