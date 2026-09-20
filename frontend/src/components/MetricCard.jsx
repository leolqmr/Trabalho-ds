import { Icon } from './Icons';

export default function MetricCard({ label, value, detail, icon, tone = 'blue' }) {
  return (
    <article className="metric-card">
      <div className={`metric-icon metric-icon--${tone}`}><Icon name={icon} /></div>
      <div className="metric-body">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  );
}
