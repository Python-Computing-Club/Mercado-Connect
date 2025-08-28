export default function useValidarCodigo({ form, tempoRestante, setStep, setForm, showAlert }) {
  const validarCodigo = () => {
    if (tempoRestante === 0) return showAlert("Código expirado", "Reenvie o código para continuar.");
    if (form.codigo.length !== 6) return;
    if (form.codigo === form.codigoGerado) {
      setStep(3);
      setForm((prev) => ({ ...prev, codigo: "" }));
    } else {
      showAlert("Inválido", "Código incorreto.");
    }
  };

  return { validarCodigo };
}