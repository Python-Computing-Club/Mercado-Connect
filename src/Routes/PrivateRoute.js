import { Navigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

const PrivateRoute = ({ children }) => {
  const { usuario, loading } = useAuth();

  if (loading) return <div>Carregando...</div>;

  return usuario ? children : <Navigate to="/" replace />;
};

export default PrivateRoute;
