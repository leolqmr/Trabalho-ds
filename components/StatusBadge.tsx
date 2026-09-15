export default function StatusBadge({
  texto,
  classe,
}: {
  texto: string;
  classe: "success" | "warning" | "danger" | "neutral";
}) {
  return <span className={`badge badge-${classe}`}>{texto}</span>;
}
