import { useEffect } from 'react';

export const useQuizTimerEffect = ({
  isTimerPaused,
  quizStartTime,
  setElapsedTime,
}) => {
  useEffect(() => {
    let timer;
    if (!isTimerPaused && quizStartTime) {
      timer = setInterval(() => {
        const sessionElapsedMs = Date.now() - quizStartTime;
        setElapsedTime(sessionElapsedMs / 1000);
      }, 100);
    }
    return () => {
      clearInterval(timer);
    };
  }, [isTimerPaused, quizStartTime, setElapsedTime]);
};
