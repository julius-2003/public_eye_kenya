export default function SeverityBadge({ severity }) {
  const styles = {
    critical: { bg: 'rgba(220,38,38,0.15)', border: 'rgba(220,38,38,0.3)', color: '#fca5a5', label: '🔴 CRITICAL' },
    high:     { bg: 'rgba(234,88,12,0.15)',  border: 'rgba(234,88,12,0.3)',  color: '#fdba74', label: '🟠 HIGH' },
    medium:   { bg: 'rgba(217,119,6,0.15)',  border: 'rgba(217,119,6,0.3)',  color: '#fde68a', label: '🟡 MEDIUM' },
    low:      { bg: 'rgba(22,163,74,0.15)',  border: 'rgba(22,163,74,0.3)',  color: '#86efac', label: '🟢 LOW' },
  };
  const s = styles[severity] || styles.medium;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
      {s.label}
    </span>
  );
}
