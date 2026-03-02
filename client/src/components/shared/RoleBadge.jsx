export default function RoleBadge({ role }) {
  const styles = {
    superadmin: { bg: 'rgba(124,58,237,0.2)', border: 'rgba(124,58,237,0.4)', color: '#A78BFA', label: '👑 Super Admin' },
    countyadmin: { bg: 'rgba(124,58,237,0.1)', border: 'rgba(124,58,237,0.3)', color: '#A78BFA', label: '🛡️ County Admin' },
    citizen:     { bg: 'rgba(37,99,235,0.15)', border: 'rgba(37,99,235,0.3)', color: '#93C5FD', label: '🧑 Citizen' },
  };
  const s = styles[role] || styles.citizen;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
      {s.label}
    </span>
  );
}
