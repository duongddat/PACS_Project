import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { StudyList } from "./components/StudyList/StudyList";
import { DicomViewer } from "./components/DicomViewer/DicomViewer";
import { initCornerstone } from "./utils/cornerstoneInit";
import "hammerjs";
import "./App.css";

// Component để xử lý URL query params
const ViewerRedirect: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const studyInstanceUIDs = params.get("StudyInstanceUIDs");

    if (studyInstanceUIDs) {
      // Nếu có nhiều StudyInstanceUID, lấy cái đầu tiên
      const firstStudyUID = studyInstanceUIDs.split(",")[0];
      navigate(`/viewer/${firstStudyUID}`);
    } else {
      // Nếu không có StudyInstanceUID, chuyển về trang danh sách
      navigate("/");
    }
  }, [location, navigate]);

  return <div>Đang chuyển hướng...</div>;
};

function App() {
  // Khởi tạo Cornerstone khi ứng dụng được tải
  useEffect(() => {
    try {
      console.log("Đang khởi tạo Cornerstone từ App...");
      const initialized = initCornerstone();
      console.log("Kết quả khởi tạo Cornerstone từ App:", initialized);
    } catch (error) {
      console.error("Lỗi khi khởi tạo Cornerstone từ App:", error);
    }
  }, []);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<StudyList />} />
          <Route path="/viewer" element={<ViewerRedirect />} />
          <Route path="/viewer/:studyInstanceUID" element={<DicomViewer />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
