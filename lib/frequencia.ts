export function calcularFrequencia(presencas: number, totalAulas: number) {
  if (totalAulas === 0) return 100;
  return Math.round((presencas / totalAulas) * 1000) / 10;
}

export function statusFrequencia(frequencia: number, limite = 75) {
  if (frequencia < limite) {
    return { texto: "Risco de reprovação", classe: "danger" as const };
  }

  if (frequencia < limite + 5) {
    return { texto: "Atenção", classe: "warning" as const };
  }

  return { texto: "Regular", classe: "success" as const };
}
