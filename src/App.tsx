import React, { useEffect, Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { initCornerstone } from "./utils/cornerstoneInit";
import "hammerjs";
import "./App.css";

// 👉 Lazy loading các component lớn
const StudyList = lazy(() => import("./components/StudyList/StudyList"));
const Viewer = lazy(() => import("./components/Viewer/Viewer"));

// ✅ Tách riêng component Redirect
const ViewerRedirect: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const studyInstanceUIDs = params.get("StudyInstanceUIDs");

    if (studyInstanceUIDs) {
      const firstStudyUID = studyInstanceUIDs.split(",")[0];
      navigate(`/viewer/${firstStudyUID}`, { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [location, navigate]);

  return <div>Đang chuyển hướng...</div>;
};

const App: React.FC = () => {
  useEffect(() => {
    const initialize = async () => {
      try {
        await initCornerstone();
      } catch (error) {
        console.error("Lỗi khi khởi tạo Cornerstone:", error);
      }
    };

    initialize();
  }, []);

  return (
    <Router>
      <div className="App dark-theme">
        <Suspense fallback={<div>Đang tải...</div>}>
          <Routes>
            <Route path="/" element={<StudyList />} />
            <Route path="/viewer" element={<ViewerRedirect />} />
            <Route path="/viewer/:studyInstanceUID" element={<Viewer />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
};

export default App;
