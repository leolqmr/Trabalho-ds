export default function Loading({ texto = "Carregando..." }: { texto?: string }) {
  return (
    <div className="loading-wrap" role="status" aria-live="polite">
      <div className="spinner" />
      <p>{texto}</p>
    </div>
  );
}
