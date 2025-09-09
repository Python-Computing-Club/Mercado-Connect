import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buscarUsuario } from "../services/firestore/usuarios";
import { useAuth } from "../Context/AuthContext";

function carregarFacebookSDK(appId) {
  return new Promise((resolve, reject) => {
    if (window.FB) {
      resolve(window.FB);
      return;
    }

    window.fbAsyncInit = function () {
      window.FB.init({
        appId,
        cookie: true,
        xfbml: true,
        version: "v17.0",
      });
      resolve(window.FB);
    };

    if (!document.getElementById("facebook-jssdk")) {
      const js = document.createElement("script");
      js.id = "facebook-jssdk";
      js.src = "https://connect.facebook.net/pt_BR/sdk.js";
      js.onerror = () => reject(new Error("Falha ao carregar SDK do Facebook."));
      document.body.appendChild(js);
    }
  });
}

export default function useFacebookLogin(
  setModal,
  setForm,
  setStep,
  setAcceptedTerms = () => {},
  modo = "cadastro"
) {
  const [fbReady, setFbReady] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const appId = process.env.REACT_APP_FACEBOOK_APP_ID;
    if (!appId) {
      setModal({
        open: true,
        title: "Erro",
        message: "App ID do Facebook não configurado.",
      });
      return;
    }

    carregarFacebookSDK(appId)
      .then(() => setFbReady(true))
      .catch(() => {
        setModal({
          open: true,
          title: "Erro",
          message: "Não foi possível carregar o SDK do Facebook.",
        });
      });
  }, [setModal]);

  const loginComFacebook = useCallback(() => {
    if (!fbReady || !window.FB) {
      setModal({
        open: true,
        title: "Erro",
        message: "Facebook SDK não carregado.",
      });
      return;
    }

    window.FB.login(
      (response) => {
        if (response.authResponse) {
          const accessToken = response.authResponse.accessToken;

          window.FB.api("/me", { fields: "name,email" }, async (userInfo) => {
            if (userInfo && !userInfo.error) {
              try {
                const existente = await buscarUsuario(userInfo.email, "email");

                if (modo === "cadastro") {
                  if (existente) {
                    setModal({
                      open: true,
                      title: "Conta já existe",
                      message:
                        "Você já possui uma conta cadastrada com este e-mail. Redirecionando para a tela de login.",
                    });

                    setTimeout(() => {
                      setModal({ open: false });
                      navigate("/");
                    }, 3000);
                    return;
                  }

                  setForm((form) => ({
                    ...form,
                    nome: userInfo.name || "",
                    contato: userInfo.email || "",
                    tipoContato: "email",
                    facebookAccessToken: accessToken,
                  }));
                  setStep(3);
                  setAcceptedTerms(false);
                }

                if (modo === "login") {
                  if (!existente) {
                    setModal({
                      open: true,
                      title: "Conta não encontrada",
                      message:
                        "Não encontramos uma conta com este e-mail. Redirecionando para o cadastro...",
                    });

                    setTimeout(() => {
                      setModal({ open: false });
                      navigate("/cadastro");
                    }, 3000);
                    return;
                  }

                  const sessionData = {
                    nome: existente.nome,
                    email: existente.email,
                    telefone: existente.telefone,
                    id: existente.id,
                    loginTime: Date.now(),
                    tipoLogin: "usuario",
                    tipoContato: "email",
                  };

                  const sucesso = await login(sessionData);
                  if (sucesso !== false) {
                    localStorage.setItem("tipoLogin", "usuario");
                    localStorage.setItem("entidade", JSON.stringify(existente));
                    navigate("/home");
                  } else {
                    setModal({
                      open: true,
                      title: "Erro",
                      message: "Falha ao realizar login.",
                    });
                  }
                }

              } catch (error) {
                console.error("Erro no login com Facebook:", error);
                setModal({
                  open: true,
                  title: "Erro",
                  message: "Falha ao autenticar com o Facebook.",
                });
              }
            } else {
              setModal({
                open: true,
                title: "Erro",
                message: "Não foi possível obter informações do Facebook.",
              });
            }
          });
        } else {
          setModal({
            open: true,
            title: "Erro",
            message: "Login com Facebook cancelado ou falhou.",
          });
        }
      },
      { scope: "email" }
    );
  }, [fbReady, setModal, setForm, setStep, setAcceptedTerms, navigate, login, modo]);

  return { loginComFacebook };
}
