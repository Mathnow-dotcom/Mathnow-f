import React, { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMathGamePick } from '../store/mathGameBridgeStore.js';
import useGuardedVideoPlayback from '../hooks/useGuardedVideoPlayback.js';
import VideoPlaybackGate from './ui/VideoPlaybackGate.jsx';

const GameModeBonusVideoIntroScreen = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const finishedRef = useRef(false);
  const finishRef = useRef(() => {
    navigate('/game-mode-bonus-intro', { replace: true });
  });

  const { setIsTimerPaused, setPausedTime, isTimerPaused, pausedTime } = useMathGamePick((ctx) => ({
    setIsTimerPaused: ctx.setIsTimerPaused || (() => {}),
    setPausedTime: ctx.setPausedTime || (() => {}),
    isTimerPaused: Boolean(ctx.isTimerPaused),
    pausedTime: ctx.pausedTime || 0,
  }));

  const runFinishFallback = useCallback(() => {
    Promise.resolve(finishRef.current?.());
  }, []);

  const { showTapToPlay, handleTapToPlay } = useGuardedVideoPlayback({
    videoRef,
    onHardTimeout: runFinishFallback,
    deps: [runFinishFallback],
    hardTimeoutMs: 7000,
  });

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (!isTimerPaused) {
      setIsTimerPaused(true);
      setPausedTime(Date.now());
    } else if (!pausedTime) {
      setPausedTime(Date.now());
    }

    const finish = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      navigate('/game-mode-bonus-intro', { replace: true });
    };
    finishRef.current = finish;

    const onEnded = () => finish();
    const onError = () => {
      setTimeout(finish, 1200);
    };

    videoEl.playbackRate = 2;
    videoEl.addEventListener('ended', onEnded);
    videoEl.addEventListener('error', onError);

    return () => {
      videoEl.removeEventListener('ended', onEnded);
      videoEl.removeEventListener('error', onError);
    };
  }, [navigate, isTimerPaused, pausedTime, setIsTimerPaused, setPausedTime]);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        src="/BonusGameIntro.mp4"
        preload="auto"
        playsInline
        autoPlay
        className="w-full h-full object-contain"
      />
      <VideoPlaybackGate
        visible={showTapToPlay}
        onTapToPlay={handleTapToPlay}
        onSkip={runFinishFallback}
      />
    </div>
  );
};

export default GameModeBonusVideoIntroScreen;
