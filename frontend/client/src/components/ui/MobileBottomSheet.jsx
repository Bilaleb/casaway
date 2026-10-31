import { motion, AnimatePresence } from 'framer-motion';

/**
 * Mobile bottom sheet for the Casaway sidebar content on small screens.
 *
 * Uses Framer Motion to animate `y` + opacity instead of layout-triggering
 * properties, so the sheet can slide up without jank on tight mobile
 * viewports.
 */
const SHEET_VERSIONS = {
  collapsed: { y: '100%', opacity: 0 },
  dragging: { y: '100%', opacity: 0 },
  expanded: { y: 0, opacity: 1 },
};

export default function MobileBottomSheet({
  open = false,
  initiallyCollapsed = false,
  onClose,
  children,
  handle,
  heading,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="bottom-sheet-wrap"
          initial={initiallyCollapsed ? SHEET_VERSIONS.collapsed : { y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0, transition: { duration: 0.18 } }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          {handle && (
            <div className="sheet-handle" onClick={onClose} aria-hidden="true">
              <span className="sheet-handle-bar" />
            </div>
          )}

          <div className="bottom-sheet">
            {heading && (
              <div className="sheet-heading">
                <h3 className="sheet-title">{heading}</h3>
              </div>
            )}

            <div className="sheet-body">
              {children}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Collapsed state for the sheet handle when the sheet is closed. */
export function SheetHandle({ open, onClose }) {
  return (
    <motion.button
      className="sheet-handle-target"
      onClick={onClose}
      aria-label={open ? 'Close panel' : 'Open panel'}
      initial={!open ? { scale: 0.85, opacity: 0 } : { scale: 1, opacity: 1 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.85, opacity: 0, transition: { duration: 0.15 } }}
    >
      <span className="sheet-handle-bar" />
    </motion.button>
  );
}
