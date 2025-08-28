// src/hooks/useEmailCodigo.js
import emailjs from "emailjs-com";

export default function useEmailCodigo() {
  const gerarCodigo = () => Math.floor(100000 + Math.random() * 900000).toString();

  const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const enviarCodigo = async (contato, tipoContato, onSuccess, onError) => {
    const codigo = gerarCodigo();

    if (!contato.trim()) {
      onError("Campo vazio", "Informe e-mail ou telefone.");
      return null;
    }

    if (tipoContato === "email") {
      if (!validarEmail(contato)) {
        onError("Email inválido", "Informe um email válido.");
        return null;
      }

      try {
        await emailjs.send(
          process.env.REACT_APP_EMAILJS_SERVICE_ID,
          process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
          { to_email: contato, codigo },
          process.env.REACT_APP_EMAILJS_PUBLIC_KEY
        );
        onSuccess("Código enviado", `Código enviado para: ${contato}`);
      } catch (err) {
        console.error(err);
        onError("Erro", "Falha ao enviar código pelo EmailJS.");
        return null;
      }
    } else {
      onSuccess("Código enviado", `Código enviado para: ${contato}`);
    }

    return codigo;
  };

  return { enviarCodigo };
}