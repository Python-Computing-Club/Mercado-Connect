import Home from "../pages/home";
import Login from "../pages/login";
import CadastroUsuario from "../pages/cadastroUsuario";
import CadastroMercado from "../pages/cadastroMercado";
import PainelMercado from '../pages/painelMercado/index';
import GerenciarEstoque from "../pages/cadastroProdutos";
import CartPage from '../pages/CartPage/index';

export const publicRoutes = [
  { path: "/", element: <Login /> },
  { path: "/cadastro", element: <CadastroUsuario /> },
  { path: "/cadastro-parceiro", element: <CadastroMercado /> },
  { path: "/painel-mercado/estoque", element: <GerenciarEstoque /> }
];
export const privateRoutes = [
  { path: "/home", element: <Home /> },
  { path: "/painel-mercado", element: <PainelMercado /> },
  { path: "/painel-mercado/estoque", element: <GerenciarEstoque /> },
  { path: "/carrinho", element: <CartPage /> }
];