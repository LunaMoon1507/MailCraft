import { useEffect } from 'react';

// Short pop-up near the top of the panel ("+2 XP", "Level up!").
// Styling lives in src/assets/theme/components.css (.mc-toast*). See THEME.md.
export type ToastTone = 'xp' | 'error' | 'level';

export interface ToastMessage {
  /** Changes for every new message, so a repeat of the same text pops again. */
  id: number;
  text: string;
  tone?: ToastTone;
}

const tones: Record<ToastTone, string> = {
  xp: '',
  error: 'mc-toast--error',
  level: 'mc-toast--level',
};

interface ToastProps {
  message: ToastMessage | null;
  /** Called when the message has been on screen long enough. */
  onDone: () => void;
  durationMs?: number;
}

export default function Toast({ message, onDone, durationMs }: ToastProps) {
  const tone = message?.tone ?? 'xp';
  const duration = durationMs ?? (tone === 'level' ? 2400 : tone === 'error' ? 2000 : 1200);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDone, duration);
    return () => clearTimeout(timer);
  }, [message, onDone, duration]);

  // The live region stays mounted so screen readers announce each new message.
  return (
    <div role="status" aria-live="polite" className="contents">
      {message && (
        <div key={message.id} className={['mc-toast', tones[tone]].filter(Boolean).join(' ')}>
          {message.text}
        </div>
      )}
    </div>
  );
}
