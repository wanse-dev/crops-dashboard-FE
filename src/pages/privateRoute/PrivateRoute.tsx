import { Navigate } from "react-router";
import { useAuth } from "../../contexts/authContext";
import type { PrivateRouteProps } from "../../types/PrivateRouteProps";

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  component: Component,
}) => {
  const auth = useAuth();
  if (auth?.userLoggedIn === null) return <div>Loading...</div>;
  return auth?.userLoggedIn ? <Component /> : <Navigate to="/register" />;
};

export default PrivateRoute;
