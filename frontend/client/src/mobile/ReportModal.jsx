import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, MapPin, MessageSquare, Route, X } from 'lucide-react';

/** Categories match the community report kinds the backend accepts. */
const CATEGORIES = [
  { value: 'route-update', label: 'Route Update', hint: 'A trace no longer matches the road', Icon: Route },
  { value: 'station-correction', label: 'Incorrect Dépôt Data', hint: 'Wrong name, position or destinations', Icon: MapPin },
  { value: 'missing-station', label: 'Missing Dépôt', hint: 'A dépôt we do not list yet', Icon: AlertCircle },
  { value: 'other', label: 'Something Else', hint: 'Anything else worth fixing', Icon: MessageSquare },
];

/**
 * Crowdsourced report modal: radio cards for the category, a details textarea
 * and an optional email. Fully accessible — aria-modal dialog, labelled by its
 * heading, Escape/backdrop dismissal, focus moved into the form on open and
 * returned to the trigger on close.
 */
export default function ReportModal({ open, onClose }) {
  const [kind, setKind] = useState('route-update');
  const [details, setDetails] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null); // 'sending' | 'sent' | 'failed'
  const panelRef = useRef(null);
  const returnFocusRef = useRef(null);

  // Focus the first field on open, restore focus to the trigger on close.
  useEffect(() => {
    if (!open) return undefined;
    returnFocusRef.current = document.activeElement;
    const timer = setTimeout(() => {
      panelRef.current?.querySelector('input[name="kind"]')?.focus();
    }, 50);
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      returnFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    setStatus('sending');
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          kind,
          subject: '',
          details: details.trim(),
          email: email.trim(),
          context: { path: location.pathname, userAgent: navigator.userAgent.slice(0, 300) },
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setStatus('sent');
      setDetails('');
      setEmail('');
      setTimeout(() => {
        setStatus(null);
        onClose();
      }, 900);
    } catch {
      setStatus('failed');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* backdrop */}
          <button
            type="button"
            aria-label="Close report form"
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-title"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-[#ddd8cb] bg-white p-5 shadow-2xl transition-all duration-300 sm:max-w-lg sm:rounded-2xl dark:border-[#252d3a] dark:bg-[#111722]"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-medium tracking-[0.14em] text-[#8a6a12] uppercase dark:text-[#e5c158]">
                  Community check
                </p>
                <h2
                  id="report-title"
                  className="mt-1 text-lg font-semibold text-[#161a21] dark:text-[#f3f1e9]"
                >
                  Report a route or dépôt update
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close report form"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-[#ddd8cb] text-[#5b6472] transition-all duration-300 hover:border-[#a8851f] hover:text-[#8a6a12] dark:border-[#252d3a] dark:text-[#9299a8] dark:hover:border-[#756231] dark:hover:text-[#e5c158]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate={false}>
              <fieldset className="border-0 p-0">
                <legend className="mb-2 text-xs font-medium text-[#5b6472] dark:text-[#9299a8]">
                  What needs fixing?
                </legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {CATEGORIES.map(({ value, label, hint, Icon }) => (
                    <label
                      key={value}
                      className="group relative flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-[#ddd8cb] bg-[#f6f4ee] p-3 transition-all duration-300 has-[:checked]:border-[#a8851f] has-[:checked]:bg-[#dcb63f]/15 hover:border-[#c9c3b4] dark:border-[#252d3a] dark:bg-[#0d121c] dark:has-[:checked]:border-[#756231] dark:has-[:checked]:bg-[#e5c158]/10 dark:hover:border-[#333d4e]"
                    >
                      <input
                        type="radio"
                        name="kind"
                        value={value}
                        checked={kind === value}
                        onChange={() => setKind(value)}
                        className="peer sr-only"
                      />
                      <Icon
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#5b6472] transition-colors duration-300 peer-checked:text-[#8a6a12] dark:text-[#9299a8] dark:peer-checked:text-[#e5c158]"
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-[#161a21] dark:text-[#f3f1e9]">
                          {label}
                        </span>
                        <span className="mt-0.5 block text-xs text-[#5b6472] dark:text-[#9299a8]">
                          {hint}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="mt-4 block text-xs font-medium text-[#5b6472] dark:text-[#9299a8]">
                Details <span className="text-[#b23a30] dark:text-[#ef918a]">required</span>
                <textarea
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={4}
                  value={details}
                  onChange={(event) => setDetails(event.target.value)}
                  placeholder="Describe what changed on the ground…"
                  className="mt-1.5 min-h-24 w-full resize-y rounded-xl border border-[#ddd8cb] bg-white px-3 py-2.5 text-sm text-[#161a21] transition-all duration-300 placeholder:text-[#9299a8] focus:border-[#a8851f] dark:border-[#252d3a] dark:bg-[#0d121c] dark:text-[#f3f1e9] dark:focus:border-[#756231]"
                />
              </label>

              <label className="mt-3 block text-xs font-medium text-[#5b6472] dark:text-[#9299a8]">
                Email <span className="font-normal opacity-70">optional</span>
                <input
                  type="email"
                  maxLength={200}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="mt-1.5 h-11 w-full rounded-xl border border-[#ddd8cb] bg-white px-3 text-sm text-[#161a21] transition-all duration-300 placeholder:text-[#9299a8] focus:border-[#a8851f] dark:border-[#252d3a] dark:bg-[#0d121c] dark:text-[#f3f1e9] dark:focus:border-[#756231]"
                />
              </label>

              <p
                role="status"
                aria-live="polite"
                className="mt-3 min-h-5 text-xs text-[#2c7a44] dark:text-[#86c8a0]"
              >
                {status === 'sending' && 'Sending your report…'}
                {status === 'sent' && 'Thanks — your report was sent for review.'}
                {status === 'failed' && 'Could not send right now. Please try again in a moment.'}
              </p>

              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-11 rounded-xl border border-[#ddd8cb] px-5 text-sm font-medium text-[#333a45] transition-all duration-300 hover:border-[#c9c3b4] dark:border-[#252d3a] dark:text-[#d3d0c5] dark:hover:border-[#333d4e]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="h-11 rounded-xl bg-[#dcb63f] px-5 text-sm font-semibold text-[#14120c] transition-all duration-300 hover:brightness-105 active:scale-[0.98] disabled:opacity-60 dark:bg-[#e5c158]"
                >
                  {status === 'sending' ? 'Sending…' : 'Send report'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
