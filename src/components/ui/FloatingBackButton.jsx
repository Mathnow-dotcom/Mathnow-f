import React from 'react';
import { FaArrowLeft } from 'react-icons/fa';

const FloatingBackButton = ({ onClick, ariaLabel = 'Back' }) => {
  return (
    <button
      className="fixed z-50 flex h-[4.0rem] w-[4.0rem] items-center justify-center rounded-full border-0 bg-[radial-gradient(circle_at_top_left,_rgba(88,148,255,0.18),_rgba(16,36,101,0.94)_36%,_rgba(8,18,58,0.98)_100%)] text-white shadow-[0_12px_26px_rgba(5,16,54,0.42),0_0_18px_rgba(44,108,255,0.16)] outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 transition-all duration-300 hover:scale-105 active:scale-95"
      style={{
        top: 'max(env(safe-area-inset-top), 0.5rem)',
        left: 'max(env(safe-area-inset-left), 0.5rem)',
        WebkitTapHighlightColor: 'transparent',
      }}
      onClick={onClick}
      aria-label={ariaLabel}
      type="button"
    >
      <FaArrowLeft className="text-[2.0rem] sm:text-[2rem]" />
    </button>
  );
};

export default FloatingBackButton;
