import Home from "../pages/home";
import Login from "../pages/login";
import CadastroUsuario from "../pages/cadastroUsuario";
import CadastroMercado from "../pages/cadastroMercado";
import PainelMercado from './pages/painelMercado/index.js';

export const publicRoutes = [
  { path: "/", element: <Login /> },
  { path: "/cadastro", element: <CadastroUsuario /> },
  { path: "/cadastro-parceiro", element: <CadastroMercado /> },
  {path:"/painel-mercado", element: <PainelMercado/>}/>}
];

export const privateRoutes = [{ path: "/home", element: <Home /> }];
