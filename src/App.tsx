import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { StudyList } from "./components/StudyList";
import { DicomViewer } from "./components/DicomViewer";
import { Layout } from "./components/Layout";
import "./App.css";
// Import file khởi tạo Cornerstone
import "./utils/cornerstoneInit";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<StudyList />} />
          <Route path="viewer/:studyInstanceUID" element={<DicomViewer />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
