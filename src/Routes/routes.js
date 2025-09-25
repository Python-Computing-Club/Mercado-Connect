import Home from "../pages/home";
import Login from "../pages/login";
import CadastroUsuario from "../pages/cadastroUsuario";
import CadastroMercado from "../pages/cadastroMercado";
import PainelMercado from "../pages/painelMercado/index";
import GerenciarEstoque from "../pages/cadastroProdutos";
import CartPage from "../pages/CartPage/index";
import CategoriaPage from "../pages/produtosCategoria/CategoriaPage";
import Buscar from "../pages/buscar/index";
import CatalogoMercado from "../pages/catalogo/index";
import TodasLojas from "../pages/TodosMercados";
import FavoritosPage from "../pages/favoritos/favoritosPage";


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
  { path: "/buscar", element: <Buscar /> },
  { path: "/mercado/:id", element: <CatalogoMercado /> },
  { path: "/mercados", element: <TodasLojas /> },
  { path: "/favoritos", element: <FavoritosPage /> }
];