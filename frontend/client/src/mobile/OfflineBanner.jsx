import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CloudOff, Wifi } from 'lucide-react';

/**
 * Subtle, non-intrusive status toast pinned above the header.
 * It stays quiet while online and flips to the amber/yellow offline state
 * with the cached-maps message as soon as the connection drops.
 */
export default function OfflineBanner() {
  const [online, setOnline] = useState(() => navigator.onLine !== false);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-2 z-50 flex justify-center px-4">
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={online ? 'online' : 'offline'}
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          className={`flex max-w-full items-center gap-2 rounded-full border px-4 py-2 text-center text-xs shadow-lg backdrop-blur transition-all duration-300 ${
            online
              ? 'border-[#ddd8cb] bg-white/85 text-[#5b6472] dark:border-[#252d3a] dark:bg-[#111722]/85 dark:text-[#9299a8]'
              : 'border-[#a8851f] bg-[#dcb63f] font-semibold text-[#14120c] dark:border-[#756231] dark:bg-[#e5c158]'
          }`}
        >
          {online ? (
            <Wifi className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          ) : (
            <CloudOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          )}
          <span>
            {online
              ? 'Connected · live depôts and regulated fares'
              : 'You are currently offline. Viewing cached maps and dépôts.'}
          </span>
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
