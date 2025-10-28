import "./BelowMenuButton.css";
import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/authContext";

import { LogoutButton } from "../../logoutButton/LogoutButton";

export const BelowMenuButton = () => {
  const auth = useAuth();

  return (
    <div className="below-menu-button">
      <LogoutButton>
        Cerrar sesión
      </LogoutButton>
    </div>
  );
};
