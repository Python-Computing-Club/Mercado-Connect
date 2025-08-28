export default function useFormatTelefone() {
  const formatTelefone = (value) => {
    let v = value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);

    if (v.length <= 10) {
      return v.replace(/(\d{2})(\d{4,5})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
    }

    return v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  return { formatTelefone };
}