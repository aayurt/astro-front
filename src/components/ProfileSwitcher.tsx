import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Pencil } from 'lucide-react';
import { useAstroStore } from '../store/astroStore';
import { AvatarDisplay } from './AvatarPicker';

export function ProfileSwitcher() {
  const {
    profiles,
    activeProfileId,
    setActiveProfile,
  } = useAstroStore();

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!profiles || profiles.length === 0) return null;

  const active = profiles.find(p => p.id === activeProfileId);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full px-2 py-1 transition-colors"
      >
        <AvatarDisplay id={active?.avatar} color={active?.color} size="sm" />
        <span className="font-medium text-gray-700 truncate max-w-[80px]">
          {active?.name || 'Select Profile'}
        </span>
        <ChevronDown size={12} className="text-gray-500" />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50 max-h-64 overflow-y-auto">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActiveProfile(p.id);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
            >
              <AvatarDisplay id={p.avatar} color={p.color} size="sm" />
              <div className="flex-1 text-left">
                <div className="font-medium text-gray-800 text-xs leading-tight">
                  {p.name}
                </div>
                <div className="text-[10px] text-gray-400 capitalize">
                  {p.relation}
                </div>
              </div>
              {p.id === activeProfileId && (
                <Check size={14} className="text-primary-600 shrink-0" />
              )}
            </button>
          ))}

          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              onClick={() => {
                setOpen(false);
                window.location.href = '/profile';
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Pencil size={14} />
              <span className="text-xs">Manage Profiles</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
