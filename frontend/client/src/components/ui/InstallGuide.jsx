import { motion } from 'framer-motion';

/**
 * "Add to Home screen" sheet, shown once per session on phones.
 *
 * iOS never fires `beforeinstallprompt`, so it needs a Safari walkthrough
 * (Share → Add to Home Screen → Add). Android reaches the same result from
 * the Chrome menu. Copy comes from the active locale (en / fr / ar) and the
 * styling uses the site's own ocean palette tokens.
 */

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 15V3" />
      <path d="m8 6 4-3 4 3" />
      <path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="1.9" />
      <circle cx="12" cy="12" r="1.9" />
      <circle cx="12" cy="19" r="1.9" />
    </svg>
  );
}

function AddToHomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9.5 12 3l8 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" />
      <path d="M12 11v6M9 14h6" />
    </svg>
  );
}

function DoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.2 2.4 2.4 4.6-4.9" />
    </svg>
  );
}

const ICONS = {
  ios: [ShareIcon, AddToHomeIcon, DoneIcon],
  android: [MenuIcon, AddToHomeIcon, DoneIcon],
};

export default function InstallGuide({
  labels = {},
  platform = 'ios',
  onClose,
  logo = '/casaway.JPEG',
}) {
  const steps =
    (platform === 'android' ? labels.installGuideStepsAndroid : labels.installGuideStepsIos) ?? [];
  const stepIcons = ICONS[platform] ?? ICONS.ios;

  return (
    <motion.div
      className="install-guide-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div
        className="install-guide"
        role="dialog"
        aria-modal="true"
        aria-label={labels.installGuideAria}
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        transition={{ duration: 0.22 }}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="install-guide-head">
          <div className="install-guide-logo">
            <img src={logo} alt="" loading="eager" />
          </div>
          <div className="install-guide-copy">
            <p className="install-guide-kicker">{labels.installGuideTitle}</p>
            <h2>{labels.installGuideName ?? 'Casaway'}</h2>
            <p className="install-guide-device">
              {platform === 'android'
                ? labels.installGuideDeviceAndroid
                : labels.installGuideDeviceIos}
            </p>
          </div>
          <button
            type="button"
            className="install-guide-close"
            onClick={onClose}
            aria-label={labels.installGuideClose}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <ol className="install-guide-steps">
          {steps.map((step, index) => {
            const Icon = stepIcons[index] ?? DoneIcon;
            return (
              <li className="install-guide-step" key={step.em ?? index}>
                <span className="install-guide-icon" aria-hidden="true">
                  <Icon />
                </span>
                <div className="install-guide-step-copy">
                  <strong>{labels.installGuideStep?.(index + 1)}</strong>
                  <p>
                    {step.lead}{' '}
                    <b>{step.em}</b>
                    {step.key ? (
                      <>
                        {' '}
                        ({step.keyLabel} <span className="install-guide-key">{step.key}</span>).
                      </>
                    ) : null}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        <p className="install-guide-tip">
          {platform === 'android' ? labels.installGuideTipAndroid : labels.installGuideTipIos}
        </p>

        <div className="install-guide-actions">
          <button type="button" className="install-guide-confirm" onClick={onClose}>
            {labels.installGuideConfirm}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
