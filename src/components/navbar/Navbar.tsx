import "./Navbar.css";
import { AboveMenuButton } from "./components/AboveMenuButton";
import { BelowMenuButton } from "./components/BelowMenuButton";

export const Navbar = () => {
  return (
    <nav className="navbar">
      <AboveMenuButton />
      <BelowMenuButton />
    </nav>
  );
};
