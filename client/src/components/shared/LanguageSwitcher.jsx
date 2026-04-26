import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)'}}>
      <Globe size={16} className="text-white/60" />
      <select
        value={i18n.language}
        onChange={changeLanguage}
        className="bg-transparent text-sm font-semibold text-white/80 outline-none cursor-pointer appearance-none pr-4"
        style={{
          background: 'transparent',
          border: 'none',
        }}
      >
        <option value="en" style={{background: '#111', color: 'white'}}>English</option>
        <option value="sw" style={{background: '#111', color: 'white'}}>Kiswahili</option>
      </select>
    </div>
  );
}
