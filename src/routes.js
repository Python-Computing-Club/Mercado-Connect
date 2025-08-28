import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Login from './pages/login';
import Cadastro from "./pages/cadastro";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;