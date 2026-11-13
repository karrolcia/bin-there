import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { trackBinReported } from '@/utils/activityTracker';

// Reports go straight to OpenStreetMap as an anonymous map note, where local
// mappers fix the data for everyone. binthere stores nothing. Only map
// problems are offered: OSM can't empty a full bin, so that isn't a note.
const PROBLEMS = [
  { id: 'gone', label: 'The bin is gone', text: 'This waste basket no longer exists.' },
  { id: 'moved', label: "It's in a different spot", text: 'This waste basket is not at the mapped location.' },
  { id: 'private', label: "Can't use it (private or locked)", text: 'This waste basket is not publicly accessible.' },
  { id: 'other', label: 'Something else', text: 'Something about this waste basket is wrong.' },
] as const;

interface ReportBinDialogProps {
  open: boolean;
  onClose: () => void;
  bin: { id: number | string; name: string; coordinates: [number, number] } | null;
}

export const ReportBinDialog = ({ open, onClose, bin }: ReportBinDialogProps) => {
  const [problem, setProblem] = useState<(typeof PROBLEMS)[number]['id'] | null>(null);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  const close = () => {
    setProblem(null);
    setComment('');
    onClose();
  };

  const submit = async () => {
    if (!bin || !problem) return;
    const chosen = PROBLEMS.find((p) => p.id === problem)!;
    const osmLink = typeof bin.id === 'number' ? ` https://www.openstreetmap.org/node/${bin.id}` : '';
    const text = [
      `${chosen.text}${osmLink}`,
      comment.trim() ? `Visitor's note: ${comment.trim().slice(0, 500)}` : '',
      '(Reported via binthere.online)',
    ]
      .filter(Boolean)
      .join('\n');

    setSending(true);
    try {
      const body = new URLSearchParams({
        lat: String(bin.coordinates[1]),
        lon: String(bin.coordinates[0]),
        text,
      });
      const res = await fetch('https://api.openstreetmap.org/api/0.6/notes', { method: 'POST', body });
      if (!res.ok) throw new Error(`OSM ${res.status}`);
      trackBinReported(problem);
      toast.success('Thanks! Your note is on OpenStreetMap for local mappers to check.');
      close();
    } catch {
      toast.error("Couldn't send the report. Please try again later.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="bg-card border-border">
        <DialogTitle className="text-xl font-medium text-foreground">Something wrong with this bin?</DialogTitle>
        <DialogDescription className="text-muted-foreground">
          Your report becomes a public note on OpenStreetMap, where the bin data comes from. It's anonymous and
          we don't store anything.
        </DialogDescription>

        <div className="grid gap-2 py-2" role="radiogroup" aria-label="What's wrong?">
          {PROBLEMS.map((p) => (
            <Button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={problem === p.id}
              variant={problem === p.id ? 'default' : 'outline'}
              className="justify-start"
              onClick={() => setProblem(p.id)}
            >
              {p.label}
            </Button>
          ))}
        </div>

        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          placeholder="Optional: anything that helps a mapper (no personal details, please)"
          aria-label="Optional comment"
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={!problem || sending}>
            {sending ? 'Sending…' : 'Send report'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
