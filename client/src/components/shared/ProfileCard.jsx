import { Link } from 'react-router-dom';
import { User } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function ProfileCard({ user }) {
  if (!user) return null;

  return (
    <Link to="/settings">
      <div className="rounded-xl overflow-hidden transition-all hover:scale-105 cursor-pointer" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
        {/* Profile Avatar */}
        <div className="aspect-square relative" style={{background:'rgba(255,255,255,0.06)',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
          <div className="w-full h-full flex items-center justify-center overflow-hidden">
            {user.profilePhotoUrl ? (
              <img
                src={`${BASE_URL}${user.profilePhotoUrl}`}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
            ) : null}
            <div className="w-full h-full flex items-center justify-center" style={{display: user.profilePhotoUrl ? 'none' : 'flex'}}>
              <User size={48} className="text-white/40" />
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="p-4">
          <div className="syne font-bold text-sm text-white/90">{user.firstName} {user.lastName}</div>
          <div className="text-xs text-white/40 mt-1">{user.county}</div>
          <div className="mt-3 flex gap-2">
            <div className="flex-1 text-center">
              <div className="text-sm font-bold">{user.totalReports || 0}</div>
              <div className="text-xs text-white/30">Reports</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-sm font-bold" style={{color:'#34D399'}}>KSh {user.totalDonated || 0}</div>
              <div className="text-xs text-white/30">Donated</div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
