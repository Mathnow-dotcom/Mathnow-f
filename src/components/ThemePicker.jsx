// src/components/ThemePicker.jsx
import AdminBrand from './admin/AdminBrand.jsx';
import '../styles/ClassroomTransitions.css';
import React, { useState, useMemo } from 'react';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { useNavigate as useRRNavigate } from 'react-router-dom';
import { themeConfigs, ageThemeMap } from '../utils/mathGameLogic.js';
import { useMathGamePick } from '../store/mathGameBridgeStore.js';

const cardTitle = (key) =>
  key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');

const ThemePicker = () => {
  const ctx = useMathGamePick((state) => ({
    navigate: state.navigate,
    setSelectedTheme: state.setSelectedTheme,
    userSavedThemeKey: state.userSavedThemeKey,
  }));
  const rrNavigate = useRRNavigate();
  const navigate = ctx?.navigate || rrNavigate; // safe fallback
  const setSelectedTheme = ctx?.setSelectedTheme || (() => {});

   // NEW: Get the saved theme key to determine if selection is locked
  const userSavedThemeKey = ctx?.userSavedThemeKey; 
  const isLocked = !!userSavedThemeKey && userSavedThemeKey.length > 0; // Check if backend theme is set
  

  // const [themePickerMode] = useState('slide');
  // const [currentThemeIdx, setCurrentThemeIdx] = useState(0);

  // 1) Age → preferred theme keys
  const age = localStorage.getItem('math-child-age') || '5';
  const preferredKeys = useMemo(() => {
    try {
      const keys = ageThemeMap(age);
      return Array.isArray(keys) ? keys : [];
    } catch {
      return [];
    }
  }, [age]);

  // 2) Build themes list from config; if preferred is empty or mismatched, fall back to all
  const themes = useMemo(() => {
    const allKeys = Object.keys(themeConfigs);
    const keys =
      preferredKeys.filter((k) => allKeys.includes(k)).length > 0
        ? preferredKeys.filter((k) => allKeys.includes(k))
        : allKeys;

    const list = keys
      .map((k) => (themeConfigs[k] ? { key: k, ...themeConfigs[k] } : null))
      .filter(Boolean);

    // Absolute last resort: single default item
    return list.length
      ? list
      : [{ key: 'space', image: '', tableEmojis: ['🚀', '🛰️', '🪐', '🌌', '☄️', '⭐'] }];
  }, [preferredKeys]);

   
  // Determine starting index: if locked, start on the saved theme
  const savedThemeIndex = themes.findIndex(t => t.key === userSavedThemeKey);

  const [themePickerMode] = useState('slide');
  const [currentThemeIdx, setCurrentThemeIdx] = useState(
      isLocked && savedThemeIndex !== -1 ? savedThemeIndex : 0 // MODIFIED: Start at saved theme if locked
  );

  const currentTheme =
    themes[Math.min(Math.max(currentThemeIdx, 0), themes.length - 1)];

  const handleBackToNameForm = () => navigate('/name');

  const gotoPrev = () => {
    if (!themes.length || isLocked) return; // ADDED: disabled if locked
    setCurrentThemeIdx((i) => (i - 1 + themes.length) % themes.length);
  };

  const gotoNext = () => {
    if (!themes.length || isLocked) return; // ADDED: disabled if locked
    setCurrentThemeIdx((i) => (i + 1) % themes.length);
  };

  const handleChooseTheme = () => {
    if (!themes.length || !currentTheme ) return;
    // Persist the whole theme object (key + config) into context
    setSelectedTheme(currentTheme);
    // try { localStorage.setItem('math-selected-theme', currentTheme.key); } catch {}
    // navigate('/levels');
  };

  return (
    <div
      className={`classroom-selection-page classroom-theme-page min-h-screen w-full px-4 flex flex-col items-center ${
        themePickerMode === 'grid'
          ? 'justify-start overflow-y-auto'
          : 'justify-center overflow-hidden'
      }`}
    >
      <AdminBrand className="classroom-screen-brand" />
      <div className="classroom-selection-back">
      <button
        className="theme-arrow theme-back fixed z-50"
        style={{
          fontSize: 'clamp(1rem, 4vw, 1.5rem)',
          top: 'max(env(safe-area-inset-top), 0.5rem)',
          left: 'max(env(safe-area-inset-left), 0.5rem)',
        }}
        onClick={handleBackToNameForm}
        aria-label="Back to Name and Avatar"
      >
        <FaArrowLeft size={24} />
      </button>
      </div>

      <h1
        className="classroom-selection-title font-baloo text-center drop-shadow-lg"
        style={{ fontSize: 'clamp(1.5rem, 6vw, 2.5rem)' }}
      >
        {isLocked ? 'Your Adventure' : 'Choose Your Adventure!'}
      </h1>

      {themePickerMode === 'slide' && (
        <>
          <div
            className="theme-carousel flex flex-row items-center justify-center w-full mb-4"
            style={{ minHeight: 'clamp(200px, 40vh, 320px)' }}
          >
            <button
              className="theme-arrow"
              onClick={gotoPrev}
              aria-label="Previous Adventure"
               disabled={!themes.length || isLocked} 
              title={!themes.length ? 'No themes available' : (isLocked ? 'Theme is locked' : 'Previous')}
            >
              <FaArrowLeft aria-hidden="true" />
            </button>

            <div
              className="flex flex-col items-center justify-center"
              style={{
                minWidth: 0,
                width: 'clamp(140px, 60vw, 640px)',
                maxWidth: '100%',
              }}
            >
              <div className="flex flex-col items-center">
                <div
                  className="relative rounded-2xl bg-black/10 flex items-center justify-center shadow-2xl w-full"
                  style={{
                    height: 'clamp(150px, 35vh, 520px)',
                  }}
                >
                  {currentTheme?.image ? (
                    <img
                      src={currentTheme.image}
                      alt={currentTheme.key}
                      className="rounded-2xl object-contain w-full h-full"
                    />
                  ) : (
                    // Fallback visual if image missing
                    <div className="text-7xl sm:text-8xl md:text-9xl select-none">
                      {(currentTheme?.tableEmojis && currentTheme.tableEmojis[0]) || '🎨'}
                    </div>
                  )}
                </div>
                <span
                  className="theme-name font-baloo text-center font-bold px-4 py-2 rounded-2xl mt-2"
                  style={{ fontSize: 'clamp(0.85rem, 3vw, 1.5rem)' }}
                >
                  {cardTitle(currentTheme?.key || 'Theme')}
                </span>
              </div>
            </div>

            <button
              className="theme-arrow"
              onClick={gotoNext}
              aria-label="Next Adventure"
              disabled={!themes.length || isLocked}
              title={!themes.length ? 'No themes available' : (isLocked ? 'Theme is locked' : 'Next')}
            >
              <FaArrowRight aria-hidden="true" />
            </button>
          </div>

          <button
            className="theme-choose font-bold rounded-2xl mt-2"
            style={{
              padding: 'clamp(0.5rem, 2vw, 1rem) clamp(1rem, 4vw, 2rem)',
              fontSize: 'clamp(0.875rem, 3vw, 1.25rem)',
            }}
            onClick={handleChooseTheme}
            disabled={!themes.length}
          >
            {themes.length ? 'Choose' : 'No Themes Available'}
          </button>
        </>
      )}
    </div>
  );
};

export default ThemePicker;
