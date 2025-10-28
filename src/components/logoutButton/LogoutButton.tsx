import { signOut } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import { useAuth } from "../../contexts/authContext/index";

export const LogoutButton = ({ children, className }: any) => {
  const { currentUser } = useAuth() || {};

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      console.log("Sesión cerrada correctamente.");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  if (!currentUser) return null;

  return (
    <button className={className} onClick={handleLogout}>
      {children}
    </button>
  );
};