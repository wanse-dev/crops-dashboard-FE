import { Outlet } from "react-router";
import { Navbar } from "../navbar/Navbar";
import "./Layout.css";

export const Layout = () => {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};
