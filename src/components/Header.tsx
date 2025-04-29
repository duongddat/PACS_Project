import React from "react";
import { Link } from "react-router-dom";
import "./Header.css";

export const Header: React.FC = () => {
  return (
    <header className="app-header">
      <div className="logo">
        <Link to="/">PACS Viewer</Link>
      </div>
      <nav className="main-nav">
        <ul>
          <li>
            <Link to="/">Danh sách Studies</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};