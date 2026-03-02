export default function StatCard({ num, label, delta, color }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="font-syne text-lg font-black text-white" style={color ? { color } : {}}>{num}</div>
      <div className="text-[10px] text-white/35 font-semibold mt-0.5">{label}</div>
      {delta && <div className="text-[9px] font-bold mt-1" style={{ color: '#16A34A' }}>{delta}</div>}
    </div>
  );
}
