// src/components/SettingsModal.jsx
import React, { useState } from 'react';
import { useMathGamePick } from '../store/mathGameBridgeStore.js';

const SettingsModal = () => {
    const { handleQuit, setShowSettings } = useMathGamePick((ctx) => ({
        handleQuit: ctx.handleQuit || (() => {}),
        setShowSettings: ctx.setShowSettings || (() => {}),
    }));
    const [isClosingSettings, setIsClosingSettings] = useState(false);

    const handleCloseSettings = () => {
        setIsClosingSettings(true);
        setTimeout(() => {
            setShowSettings(false);
            setIsClosingSettings(false);
        }, 400);
    };

    return (
        <div className="fixed inset-0 z-50 p-4 animate-fade-in">
            <div
                className="absolute inset-0 bg-black"
                style={{
                    backgroundImage: "url('/night_sky_landscape.jpg')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                }}
            />
            <div className="absolute inset-0 bg-black/30" />
            <div className="relative flex h-full items-center justify-center">
            <div className={`relative w-full max-w-[420px] ${isClosingSettings ? 'animate-pop-out' : 'animate-pop-in'}`}>
                <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-blue-400/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-sky-400/20 blur-3xl" />

                <div className="rounded-[28px] bg-[linear-gradient(145deg,rgba(116,211,255,0.45),rgba(44,108,255,0.24),rgba(8,18,58,0.72))] p-[1.5px] shadow-[0_18px_48px_rgba(4,12,20,0.6),0_0_26px_rgba(44,108,255,0.18)]">
                    <div className="relative overflow-hidden rounded-[26px] border border-[#bfe2ff]/15 bg-[radial-gradient(circle_at_top_left,_rgba(88,148,255,0.18),_rgba(16,36,101,0.94)_36%,_rgba(8,18,58,0.98)_100%)] backdrop-blur-md">
                        <div className="pointer-events-none absolute -top-16 -right-12 h-32 w-32 rounded-full bg-blue-300/15 blur-3xl" />
                        <div className="pointer-events-none absolute -bottom-16 -left-12 h-32 w-32 rounded-full bg-sky-300/12 blur-3xl" />
                        <div className="pointer-events-none absolute inset-y-6 right-4 w-24 rounded-full bg-[radial-gradient(circle,_rgba(99,179,255,0.16),_transparent_72%)] blur-2xl" />

                        <div className="relative p-5 sm:p-6">
                            <div className="mx-auto mb-5 w-full rounded-2xl border border-[#bfe2ff]/12 bg-[linear-gradient(180deg,rgba(41,82,180,0.36),rgba(15,34,92,0.28))] px-4 py-4 text-center shadow-[inset_0_1px_0_rgba(194,225,255,0.16),inset_0_0_24px_rgba(44,108,255,0.14)]">
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-white" style={{ fontFamily: 'Baloo 2, Comic Neue, cursive' }}>
                                    Settings
                                </h2>
                            </div>

                            <div className="flex flex-col items-center gap-3 sm:gap-4">
                                <button
                                    className="h-12 w-[78%] rounded-xl border border-[#bfe2ff]/20 bg-[linear-gradient(135deg,#2d74ff_0%,#1747c8_55%,#0f2a75_100%)] text-sm font-black tracking-wide text-white shadow-[0_12px_24px_rgba(7,20,71,0.34),0_0_14px_rgba(44,108,255,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 sm:h-13 sm:text-base"
                                    onClick={() => {
                                        handleQuit();
                                        handleCloseSettings();
                                    }}
                                >
                                    QUIT
                                </button>

                                <button
                                    className="h-12 w-[78%] rounded-xl border border-[#bfe2ff]/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(214,235,255,0.92))] text-sm font-black tracking-wide text-[#243c66] shadow-[0_12px_24px_rgba(7,20,71,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 sm:h-13 sm:text-base"
                                    onClick={handleCloseSettings}
                                >
                                    BACK TO GAME
                                </button>
                            </div>
                        </div>
                        <div className="h-[2px] w-full bg-gradient-to-r from-[#74d3ff]/75 via-[#2d74ff]/70 to-[#74d3ff]/75" />
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
};

export default SettingsModal;
