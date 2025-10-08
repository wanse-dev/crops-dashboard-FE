import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { AuthProvider } from "./contexts/authContext/index.tsx";
import PrivateRoute from "./pages/privateRoute/PrivateRoute";

import { Layout } from "./components/layout/Layout";
import { Login } from "./pages/login/Login";
import { Register } from "./pages/register/Register";
import { Dashboard } from "./pages/dashboard/Dashboard";
import { Fallback } from "./pages/fallback/Fallback";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
    errorElement: <Fallback />,
  },
  {
    path: "/register",
    element: <Register />,
    errorElement: <Fallback />,
  },
  {
    element: <Layout />,
    errorElement: <Fallback />,
    children: [
      {
        path: "/",
        element: <PrivateRoute component={Dashboard} />,
        errorElement: <Fallback />,
      },
      {
        path: "/dashboard",
        element: <PrivateRoute component={Dashboard} />,
        errorElement: <Fallback />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
);
