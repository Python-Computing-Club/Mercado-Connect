import Home from "../pages/home";
import Login from "../pages/login";
import CadastroUsuario from "../pages/cadastroUsuario";
import CadastroMercado from "../pages/cadastroMercado";
import PainelMercado from "../pages/painelMercado/index";
import GerenciarEstoque from "../pages/cadastroProdutos";
import GerenciarPedidos from "../pages/painelMercado/GerenciarPedidos";
import AcompanhamentoPedido from "../pages/checkoutPedido/AcompanharPedido";
import CartPage from "../pages/CartPage/index";
import CategoriaPage from "../pages/produtosCategoria/CategoriaPage";
import Buscar from "../pages/buscar/index";
import CatalogoMercado from "../pages/catalogo/index";
import TodasLojas from "../pages/TodosMercados";
import FavoritosPage from "../pages/favoritos/favoritosPage";
import CheckoutPedido from "../pages/checkoutPedido";
import PagamentoSucesso from "../components/telasPagamento/pagamentoSucesso";
import PagamentoErro from "../components/telasPagamento/pagamentoErro";
import PagamentoPendente from "../components/telasPagamento/pagamentoPendente";
import Pedidos from "../pages/ListarPedidos/index"

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
  { path: "/painel-mercado/pedidos", element: <GerenciarPedidos /> },
  { path: "/pedidos", element: <Pedidos /> },
  { path: "/acompanhar-pedido/:id", element: <AcompanhamentoPedido /> },
  { path: "/acompanhar-pedido/pedidos", element: <AcompanhamentoPedido /> },
  { path: "/carrinho", element: <CartPage /> },
  { path: "/produtos/:categoriaSlug", element: <CategoriaPage /> },
  { path: "/buscar", element: <Buscar /> },
  { path: "/mercado/:id", element: <CatalogoMercado /> },
  { path: "/mercados", element: <TodasLojas /> },
  { path: "/favoritos", element: <FavoritosPage /> },
  { path: "/checkout-pedido", element: <CheckoutPedido /> },
  { path: "/pagamento-sucesso", element: <PagamentoSucesso /> },
  { path: "/pagamento-erro", element: <PagamentoErro /> },
  { path: "/pagamento-pendente", element: <PagamentoPendente /> }
];