// src/components/DailyStreakAnimation.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMathGamePick } from '../store/mathGameBridgeStore.js';
import AdminBrand from './admin/AdminBrand.jsx';
import '../styles/ClassroomTransitions.css';

const TOTAL_DURATION_VISIBLE_MS = 2000; 
const ANIMATION_TIMINGS = {
    fadeIn: 200,
    fadeOut: 200,
};

export default function DailyStreakAnimation({ streakCount }) {
    if (streakCount <= 0) return null;

    const { handleDailyStreakNext, setPlayFactVideoAfterStreak } = useMathGamePick((ctx) => ({
        handleDailyStreakNext: ctx.handleDailyStreakNext || (() => {}),
        setPlayFactVideoAfterStreak: ctx.setPlayFactVideoAfterStreak || (() => {}),
    }));
    const [isExiting, setIsExiting] = useState(false);

    const handleNextClick = () => { 
    setIsExiting(true);

    setTimeout(() => {
        handleDailyStreakNext();           // hide streak
        setPlayFactVideoAfterStreak(true); // ▶️ trigger video
    }, ANIMATION_TIMINGS.fadeOut);
    };


    return (
        <AnimatePresence>
            <motion.div
                key={`daily-streak-overlay-${streakCount}`}
                className="classroom-transition-page daily-streak-page fixed inset-0 z-[1000] flex flex-col items-center justify-center select-none"
                // Fade in and out the backdrop
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: ANIMATION_TIMINGS.fadeIn / 1000 } }}
                exit={{ opacity: 0, transition: { duration: ANIMATION_TIMINGS.fadeOut / 1000 } }}
            >
                <AdminBrand className="classroom-screen-brand" />
                <motion.div
                    className="daily-streak-card relative z-[1002] flex flex-col items-center justify-center"
                    // Card pop-in/pop-out animation
                    initial={{ scale: 0.5, rotate: -10, opacity: 0 }}
                    animate={{ 
                        scale: 1, 
                        rotate: 0, 
                        opacity: 1,
                        transition: { 
                            type: 'spring', 
                            stiffness: 200, 
                            damping: 15,
                            duration: ANIMATION_TIMINGS.fadeIn / 1000
                        }
                    }}
                    exit={{ 
                        scale: 0.5, 
                        rotate: 10, 
                        opacity: 0,
                        transition: { 
                            duration: ANIMATION_TIMINGS.fadeOut / 1000, 
                            ease: 'easeIn'
                        }
                    }}
                >
                    {/* Fire Emoji with "live waving" pulse effect */}
                    <motion.span
                        className="daily-streak-fire drop-shadow-lg"
                        animate={{ scale: [1, 1.15, 1] }} // Subtle pulse/wave effect
                        transition={{
                            duration: 0.4,
                            repeat: Infinity,
                            ease: "easeInOut",
                            repeatType: "reverse",
                        }}
                    >
                        🔥
                    </motion.span>
                    
                    <span className="daily-streak-count">
                        {streakCount}
                    </span>

                    <span className="daily-streak-label">
                        DAYS STREAK
                    </span>

                    {/* <button
                        onClick={handleNextClick}
                        disabled={isExiting}
                       className=" bg-green-600 hover:bg-green-500 text-white font-bold text-lg px-6 py-2 rounded-full mt-4 shadow-md transition-all duration-300" 
                        style={{ pointerEvents: 'auto' }}
                    >
                        NEXT
                    </button> */}
                </motion.div>
                <button
                    onClick={handleNextClick}
                    disabled={isExiting}
                    className="daily-streak-next z-[1002]"
                >
                    NEXT
                </button>
            </motion.div>
        </AnimatePresence>
    );
}
