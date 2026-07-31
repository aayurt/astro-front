const AVATARS = [
  { id: 'cat', emoji: '🐱', label: 'Cat' },
  { id: 'dog', emoji: '🐶', label: 'Dog' },
  { id: 'rabbit', emoji: '🐰', label: 'Rabbit' },
  { id: 'bear', emoji: '🐻', label: 'Bear' },
  { id: 'fox', emoji: '🦊', label: 'Fox' },
  { id: 'owl', emoji: '🦉', label: 'Owl' },
  { id: 'panda', emoji: '🐼', label: 'Panda' },
  { id: 'lion', emoji: '🦁', label: 'Lion' },
  { id: 'tiger', emoji: '🐯', label: 'Tiger' },
  { id: 'penguin', emoji: '🐧', label: 'Penguin' },
];

export const AVATAR_MAP = Object.fromEntries(AVATARS.map(a => [a.id, a]));

const COLORS = [
  { id: 'indigo', bg: 'bg-indigo-500', ring: 'ring-indigo-500' },
  { id: 'blue', bg: 'bg-blue-500', ring: 'ring-blue-500' },
  { id: 'emerald', bg: 'bg-emerald-500', ring: 'ring-emerald-500' },
  { id: 'amber', bg: 'bg-amber-500', ring: 'ring-amber-500' },
  { id: 'rose', bg: 'bg-rose-500', ring: 'ring-rose-500' },
  { id: 'purple', bg: 'bg-purple-500', ring: 'ring-purple-500' },
  { id: 'cyan', bg: 'bg-cyan-500', ring: 'ring-cyan-500' },
  { id: 'orange', bg: 'bg-orange-500', ring: 'ring-orange-500' },
];

function avatarBgClass(colorId: string): string {
  const map: Record<string, string> = {
    indigo: 'bg-indigo-100',
    blue: 'bg-blue-100',
    emerald: 'bg-emerald-100',
    amber: 'bg-amber-100',
    rose: 'bg-rose-100',
    purple: 'bg-purple-100',
    cyan: 'bg-cyan-100',
    orange: 'bg-orange-100',
  };
  return map[colorId] || 'bg-indigo-100';
}

function avatarFallbackBgClass(colorId: string): string {
  const map: Record<string, string> = {
    indigo: 'bg-indigo-200',
    blue: 'bg-blue-200',
    emerald: 'bg-emerald-200',
    amber: 'bg-amber-200',
    rose: 'bg-rose-200',
    purple: 'bg-purple-200',
    cyan: 'bg-cyan-200',
    orange: 'bg-orange-200',
  };
  return map[colorId] || 'bg-indigo-200';
}

interface AvatarPickerProps {
  avatar: string;
  color: string;
  onAvatarChange: (id: string) => void;
  onColorChange: (id: string) => void;
}

export function AvatarPicker({ avatar, color, onAvatarChange, onColorChange }: AvatarPickerProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-5 gap-2">
        {AVATARS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onAvatarChange(a.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
              avatar === a.id
                ? 'border-indigo-500 bg-indigo-50 scale-105'
                : 'border-gray-100 hover:border-gray-200'
            }`}
          >
            <span className="text-2xl">{a.emoji}</span>
            <span className="text-[10px] text-gray-500">{a.label}</span>
          </button>
        ))}
      </div>
      <div className="flex gap-2 justify-center pt-1">
        {COLORS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onColorChange(c.id)}
            className={`w-7 h-7 rounded-full ${c.bg} transition-all ${
              color === c.id ? 'ring-2 ring-offset-2 scale-110' : 'ring-0'
            } ${color === c.id ? c.ring : ''}`}
          />
        ))}
      </div>
    </div>
  );
}

const SIZE_CLASSES = {
  sm: 'text-lg w-8 h-8',
  md: 'text-2xl w-10 h-10',
  lg: 'text-4xl w-16 h-16',
} as const;

export function AvatarDisplay({ id, color, size = 'md' }: { id?: string | null; color?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const avatar = id ? AVATAR_MAP[id] : null;
  const cid = color || 'indigo';
  const sz = SIZE_CLASSES[size];

  if (!avatar) {
    return (
      <div className={`rounded-full ${avatarFallbackBgClass(cid)} text-indigo-600 flex items-center justify-center font-bold ${sz}`}>
        {id?.charAt(0).toUpperCase() || '?'}
      </div>
    );
  }

  return (
    <div className={`rounded-full ${avatarBgClass(cid)} flex items-center justify-center ${sz}`}>
      {avatar.emoji}
    </div>
  );
}
