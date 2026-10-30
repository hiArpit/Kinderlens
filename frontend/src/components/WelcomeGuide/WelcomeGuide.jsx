import React, { useEffect, useRef } from 'react';
import './WelcomeGuide.css';

const steps = [
  {
    icon: '🔍',
    title: 'Ready to explore?',
    message: 'Find something interesting. We’ll help you discover what makes it special.',
  },
  {
    icon: '📸',
    title: 'Choose how to begin',
    message: 'Turn on your camera when you’re ready, or pick a Wonder to explore together.',
  },
  {
    icon: '🧭',
    title: 'Follow a new idea',
    message: 'Try a related topic, then come back to review what you learned.',
  },
];

export default function WelcomeGuide({ step, onNext, onBack, onDismiss }) {
  const currentStep = steps[step];
  const dialogRef = useRef(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector('button')?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onDismiss();
        return;
      }
      if (event.key !== 'Tab') return;
      const buttons = [...dialogRef.current.querySelectorAll('button:not([disabled])')];
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [onDismiss]);

  return (
    <div className="welcome-backdrop">
      <section
        className="welcome-dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        aria-describedby="welcome-message"
      >
        <div className="welcome-mascot" aria-hidden="true">{currentStep.icon}</div>
        <p className="welcome-step-label">A little KinderLens tour</p>
        <h2 id="welcome-title">{currentStep.title}</h2>
        <p id="welcome-message" className="welcome-message">{currentStep.message}</p>
        <div className="welcome-dots" aria-label={`Step ${step + 1} of ${steps.length}`}>
          {steps.map((item, index) => (
            <span className={index === step ? 'is-current' : ''} key={item.title} />
          ))}
        </div>
        <div className="welcome-actions">
          {step > 0 && (
            <button type="button" className="welcome-back-button" onClick={onBack}>
              Back
            </button>
          )}
          <button type="button" className="welcome-next-button" onClick={onNext}>
            {step === steps.length - 1 ? 'Let’s explore!' : 'Next'}
          </button>
        </div>
        <button type="button" className="welcome-skip-button" onClick={onDismiss}>
          Skip tour
        </button>
      </section>
    </div>
  );
}
