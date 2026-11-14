import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LOCALES } from '../../data/depots.js';

/**
 * Top bar chrome for Casaway.
 *
 * Keeps the existing topbar layout from App.css and adds a locale switcher
 * with a small animated dropdown. All icons are inline SVG so this refactor
 * does not require extra icon dependencies.
 */
export default function Navbar({
  brandMark = 'CW',
  brandLogo = '/casaway.JPEG',
  brandName = 'Casaway',
  tagline,
  live = true,
  depotCount,
  locale,
  onLocaleChange,
  labels = {},
  menuOpen = true,
  onMenuToggle,
  onSearchOpen,
}) {
  const [localeOpen, setLocaleOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!localeOpen) return;
    const onPointer = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setLocaleOpen(false);
      }
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setLocaleOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [localeOpen]);

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          {brandLogo ? (
            <img src={brandLogo} alt="" loading="eager" />
          ) : (
            brandMark
          )}
        </div>
        <div className="brand-copy">
          <h1>{brandName}</h1>
          <span>{tagline ?? 'Your Casa, your way'}</span>
        </div>
      </div>

      <div className="top-actions">
        {live && (
          <div className="top-meta">
            <span className="live-dot" aria-hidden="true" />
            <span>
              {depotCount != null && labels.depotCount
                ? labels.depotCount(depotCount)
                : 'Live'}
            </span>
          </div>
        )}

        <button
          type="button"
          className="header-icon-btn"
          onClick={onSearchOpen}
          aria-label={labels.searchToggle ?? 'Search stations'}
          title={labels.searchToggle ?? 'Search stations'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m16.5 16.5 4 4" strokeLinecap="round" />
          </svg>
        </button>

        <button
          type="button"
          className={`header-icon-btn menu-btn ${menuOpen ? 'is-on' : ''}`}
          onClick={onMenuToggle}
          aria-label={labels.menuLabel ?? 'Show or hide the station panel'}
          aria-expanded={menuOpen}
          title={labels.menuLabel ?? 'Show or hide the station panel'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        <div className="locale-wrap" ref={menuRef}>
          <button
            type="button"
            className="locale-btn"
            onClick={() => setLocaleOpen((open) => !open)}
            aria-haspopup="listbox"
            aria-expanded={localeOpen}
            aria-label={labels.localeLabel ?? 'Language'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20" />
            </svg>
            {locale?.toUpperCase()}
            <motion.span
              animate={{ rotate: localeOpen ? 180 : 0 }}
              transition={{ duration: 0.18 }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </motion.span>
          </button>

          <AnimatePresence>
            {localeOpen && (
              <motion.ul
                className="locale-menu"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16 }}
                role="listbox"
                aria-label="Language"
              >
                {LOCALES.map((option) => (
                  <li key={option.code}>
                    <button
                      type="button"
                      className={`locale-opt ${locale === option.code ? 'is-on' : ''}`}
                      onClick={() => {
                        onLocaleChange?.(option.code);
                        setLocaleOpen(false);
                      }}
                      role="option"
                      aria-selected={locale === option.code}
                    >
                      <span>{option.label}</span>
                      {locale === option.code && (
                        <span className="locale-check" aria-hidden="true">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M5 12l5 5L20 7" />
                          </svg>
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
