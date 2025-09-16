import Home from "../pages/home";
import Login from "../pages/login";
import CadastroUsuario from "../pages/cadastroUsuario";
import CadastroMercado from "../pages/cadastroMercado";
import PainelMercado from '../pages/painelMercado/index';
import GerenciarEstoque from "../pages/cadastroProdutos";
import CartPage from '../pages/CartPage/index';
import CategoriaPage from "../pages/produtosCategoria/CategoriaPage";
import Buscar from "../pages/buscar/index"

export const publicRoutes = [
  { path: "/", element: <Login /> },
  { path: "/cadastro", element: <CadastroUsuario /> },
  { path: "/cadastro-parceiro", element: <CadastroMercado /> },
  { path: "*", element: <Login /> }
];

export const privateRoutes = [
  { path: "/home", element: <Home /> },
  { path: "/painel-mercado", element: <PainelMercado /> },
  { path: "/painel-mercado/estoque", element: <GerenciarEstoque /> },
  { path: "/carrinho", element: <CartPage /> },
  { path: "/produtos/:categoriaSlug", element: <CategoriaPage /> },
  { path: "/buscar", element: <Buscar /> }
];