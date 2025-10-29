import "./BelowMenuButton.css";
import { LogOut, User } from "lucide-react";
import { LogoutButton } from "../../logoutButton/LogoutButton";

export const BelowMenuButton = () => {
  return (
    <div className="below-menu-button">
      <div className="navbar-item navbar-user-info">
        <User size={28} />
      </div>
      <LogoutButton className="navbar-item navbar-logout">
        <LogOut size={24} />
        <span>Logout</span>
      </LogoutButton>
    </div>
  );
};
