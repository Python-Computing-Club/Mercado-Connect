import { Navigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

const PrivateRoute = ({ children }) => {
  const { usuario, loading } = useAuth();

  if (loading || usuario === undefined) return null;

  return usuario ? children : <Navigate to="/" replace />;
};

export default PrivateRoute;
