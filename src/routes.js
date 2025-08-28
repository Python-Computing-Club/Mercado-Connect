import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Login from './pages/login';
import CadastroUsuario from "./pages/cadastroUsuario";
import CadastroMercado from './pages/cadastroMercado';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<CadastroUsuario />} />
        <Route path='/cadastro-parceiro' element={<CadastroMercado/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;