import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Offcanvas from 'react-bootstrap/Offcanvas';
import cartIcon from '../../assets/teste.png';
import { useAuth } from '../../Context/AuthContext'; // ajuste o caminho se necessário

export default function HeaderMercado({ onResetar }) {
  const { logout } = useAuth();

  return (
    <>
      {['sm'].map((expand) => (
        <Navbar key={expand} expand={expand} className="bg-body-tertiary mb-3">
          <Container fluid>
            <Navbar.Brand
              style={{ color: '#012E0D', fontWeight: '650' }}
              href="#"
              onClick={onResetar}
            >
              <img
                alt="Logo do Mercado Connect"
                src={cartIcon}
                width="30"
                height="30"
                className="d-inline-block align-top"
              />{' '}
              Mercado Connect
            </Navbar.Brand>
            <Navbar.Toggle aria-controls={`offcanvasNavbar-expand-${expand}`} />
            <Navbar.Offcanvas
              id={`offcanvasNavbar-expand-${expand}`}
              aria-labelledby={`offcanvasNavbarLabel-expand-${expand}`}
              placement="end"
            >
              <Offcanvas.Header closeButton>
                <Offcanvas.Title
                  style={{ color: '#012E0D', fontWeight: '650' }}
                  id={`offcanvasNavbarLabel-expand-${expand}`}
                >
                  Mercado Connect
                </Offcanvas.Title>
              </Offcanvas.Header>
              <Offcanvas.Body>
                <Nav className="justify-content-end flex-grow-1 pe-5">
                  <Nav.Link style={{ color: '#012E0D' }} href="#action1">
                    Pedidos
                  </Nav.Link>
                  <Nav.Link style={{ color: '#012E0D' }} href="#action2">
                    Estoque
                  </Nav.Link>
                  <NavDropdown
                    title="Minha Loja"
                    id={`offcanvasNavbarDropdown-expand-${expand}`}
                  >
                    <NavDropdown.Item style={{ color: '#012E0D' }} href="#action3">
                      Editar Informações
                    </NavDropdown.Item>
                    <NavDropdown.Item style={{ color: '#012E0D' }} href="#action4">
                      Deletar Loja
                    </NavDropdown.Item>
                  </NavDropdown>
                  
                  <Nav.Link
                    style={{ color: '#0c0c0cff', fontWeight: '600' }}
                    onClick={logout}
                  >
                    Sair da conta
                  </Nav.Link>
                </Nav>
              </Offcanvas.Body>
            </Navbar.Offcanvas>
          </Container>
        </Navbar>
      ))}
    </>
  );
}
