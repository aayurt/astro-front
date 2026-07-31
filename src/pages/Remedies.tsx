import React from 'react';
import { Sparkles, Zap, Mic, Heart, Plus, Trash2, CheckCircle2, Circle, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Page } from '../components/ui/page';
import { Navbar } from '../components/ui/navbar';
import { Card } from '../components/modern-ui/card';
import { Button } from '../components/modern-ui/button';
import { Dialog, DialogContent } from '../components/modern-ui/dialog';
import { Input } from '../components/modern-ui/input';
import { useRemedyStore, Remedy } from '../store/remedyStore';

const typeMeta: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  mantra:    { label: 'Mantra',    icon: <Mic size={14} />,     color: 'text-purple-600 bg-purple-50 border-purple-200' },
  gemstone:  { label: 'Gemstone',  icon: <Sparkles size={14} />, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  ritual:    { label: 'Ritual',    icon: <Zap size={14} />,     color: 'text-primary-600 bg-primary-50 border-primary-200' },
  charity:   { label: 'Charity',   icon: <Heart size={14} />,   color: 'text-rose-600 bg-rose-50 border-rose-200' },
  lifestyle: { label: 'Lifestyle', icon: <Heart size={14} />,   color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
};

const typeList = Object.keys(typeMeta);

const formatDate = (d: string) => {
  const date = new Date(d);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
};

function RemedyCard({ remedy, onToggle, onDelete }: { remedy: Remedy; onToggle: () => void; onDelete: () => void }) {
  const meta = typeMeta[remedy.type] || typeMeta.mantra;
  return (
    <Card className={`p-3 ${remedy.completed ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <button onClick={onToggle} className="mt-0.5 shrink-0">
          {remedy.completed
            ? <CheckCircle2 size={20} className="text-green-500" />
            : <Circle size={20} className="text-gray-300 hover:text-gray-400" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${meta.color}`}>
              {meta.icon}
              {meta.label}
            </span>
            {remedy.source !== 'manual' && (
              <span className="text-[10px] text-gray-400">
                {remedy.source === 'ai_chat' ? 'AI Chat' : 'Transit Prediction'}
              </span>
            )}
          </div>
          <p className={`text-sm font-semibold ${remedy.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
            {remedy.title}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{remedy.description}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-gray-400">{formatDate(remedy.createdAt)}</span>
            <button onClick={onDelete} className="text-gray-300 hover:text-red-500 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function RemediesPage() {
  const { remedies, loading, fetchRemedies, addRemedy, scanRemedies, toggleRemedy, deleteRemedy } = useRemedyStore();
  const [activeType, setActiveType] = React.useState<string | null>(null);
  const [showAdd, setShowAdd] = React.useState(false);
  const [scanning, setScanning] = React.useState(false);
  const [formType, setFormType] = React.useState('mantra');
  const [formTitle, setFormTitle] = React.useState('');
  const [formDesc, setFormDesc] = React.useState('');

  React.useEffect(() => {
    fetchRemedies();
  }, [fetchRemedies]);

  const filtered = activeType
    ? remedies.filter((r) => r.type === activeType)
    : remedies;

  const pending = filtered.filter((r) => !r.completed);
  const done = filtered.filter((r) => r.completed);

  const handleAdd = async () => {
    if (!formTitle.trim() || !formDesc.trim()) return;
    await addRemedy({
      type: formType,
      title: formTitle.trim(),
      description: formDesc.trim(),
    });
    setFormTitle('');
    setFormDesc('');
    setShowAdd(false);
  };

  if (loading && remedies.length === 0) {
    return (
      <Page>
        <Navbar title="Remedies" />
        <div className="p-4 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <Navbar
        title="Remedies"
        right={
          <div className="flex items-center gap-1">
            <button
              onClick={async () => {
                setScanning(true);
                const count = await scanRemedies();
                setScanning(false);
                if (count > 0) toast.success(`Found ${count} new remed${count > 1 ? 'ies' : 'y'} from your AI history`);
                else toast('No new remedies found in your AI history');
              }}
              disabled={scanning}
              className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
            >
              <Search size={18} className={scanning ? 'animate-spin' : ''} />
            </button>
            <button onClick={() => setShowAdd(true)} className="p-1 text-primary-600 hover:text-primary-800 transition-colors">
              <Plus size={22} />
            </button>
          </div>
        }
      />

      <div className="p-4 space-y-4">
        {remedies.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-1">No remedies yet</p>
            <p className="text-xs text-gray-400 mb-4">Scan your AI chat history to find remedies, or add one manually</p>
            <div className="flex items-center justify-center gap-2">
              <Button size="sm" onClick={async () => {
                setScanning(true);
                const count = await scanRemedies();
                setScanning(false);
                if (count > 0) toast.success(`Found ${count} new remed${count > 1 ? 'ies' : 'y'}!`);
                else toast('No remedies found in your AI history');
              }} disabled={scanning}>
                <Search size={14} className="mr-1" />
                {scanning ? 'Scanning...' : 'Scan AI History'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>Add Manually</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveType(null)}
                className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  activeType === null
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                All
              </button>
              {typeList.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveType(t)}
                  className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                    activeType === t
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {typeMeta[t].label}
                </button>
              ))}
            </div>

            {pending.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Active ({pending.length})
                </p>
                {pending.map((r) => (
                  <RemedyCard
                    key={r.id}
                    remedy={r}
                    onToggle={() => toggleRemedy(r.id)}
                    onDelete={() => deleteRemedy(r.id)}
                  />
                ))}
              </div>
            )}

            {done.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Completed ({done.length})
                </p>
                {done.map((r) => (
                  <RemedyCard
                    key={r.id}
                    remedy={r}
                    onToggle={() => toggleRemedy(r.id)}
                    onDelete={() => deleteRemedy(r.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent title="Add Remedy">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Type</label>
              <div className="flex gap-2 flex-wrap">
                {typeList.map((t) => (
                  <button
                    key={t}
                    onClick={() => setFormType(t)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                      formType === t
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    {typeMeta[t].label}
                  </button>
                ))}
              </div>
            </div>
            <Input
              label="Title"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Chant Mahamrityunjaya Mantra"
            />
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Description</label>
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Describe the remedy and how to practice it..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
            <Button className="w-full" onClick={handleAdd} disabled={!formTitle.trim() || !formDesc.trim()}>
              Add Remedy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Page>
  );
}
