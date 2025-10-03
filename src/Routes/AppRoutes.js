import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../Context/AuthContext";
import { MarketProvider } from "../Context/MarketContext";
import { CartProvider } from "../Context/CartContext";
import { FavoritosProvider } from "../Context/FavoritosContext";

import PrivateRoute from "./PrivateRoute";
import { publicRoutes, privateRoutes } from "./routes";

function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MarketProvider>
          <CartProvider>
            <FavoritosProvider>
              <Routes>
                {publicRoutes.map(({ path, element }) => (
                  <Route key={path} path={path} element={element} />
                ))}

                {privateRoutes.map(({ path, element }) => (
                  <Route
                    key={path}
                    path={path}
                    element={<PrivateRoute>{element}</PrivateRoute>}
                  />
                ))}

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </FavoritosProvider>
          </CartProvider>
        </MarketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default AppRoutes;