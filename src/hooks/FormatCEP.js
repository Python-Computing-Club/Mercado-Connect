export default function FormatCEP(valor) {
  const apenasNumeros = valor.replace(/\D/g, "").slice(0, 8);
  if (apenasNumeros.length > 5) {
    return `${apenasNumeros.slice(0, 5)}-${apenasNumeros.slice(5)}`;
  }
  return apenasNumeros;
}