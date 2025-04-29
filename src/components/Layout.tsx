import React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import "./Layout.css";

export const Layout: React.FC = () => {
  return (
    <div className="app-container">
      <Header />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
};
