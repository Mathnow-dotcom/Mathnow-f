import React from 'react';
import { useMathGameSelector } from '../store/mathGameBridgeStore.js';
import '../styles/StartScreen.css';

const NOOP_NAVIGATE = () => {};


const APP_VERSION = '12.0';
const APP_RELEASE_DATE_BY_VERSION = {
    '6.2': '2026-04-02',
    '6.3': '2026-04-03',
    '6.5': '2026-04-05',
    '6.6': '2026-04-06',
    '6.7': '2026-04-07',
    '6.8': '2026-04-09',
    '6.9': '2026-04-10',
    '7.0': '2026-04-13',
    '7.1': '2026-04-14',
    '7.2': '2026-04-21',
    '7.3': '2026-04-22',
    '7.4': '2026-04-23',
    '7.5': '2026-04-27',
    '7.6': '2026-04-30',
    '7.7': '2026-05-01',
    '7.8': '2026-05-04',
    '7.9': '2026-05-05',
    '8.0': '2026-05-06',
    '8.1': '2026-05-11',
    '8.2': '2026-05-12',
    '8.3': '2026-05-14',
    '8.4': '2026-05-15',
    '8.5': '2026-05-19',
    '8.6': '2026-05-20',
    '8.7': '2026-05-21',
    '8.8': '2026-06-01',
    '8.9': '2026-06-02',
    '9.0': '2026-06-26',
    '9.1': '2026-06-29',
    '9.2': '2026-07-01',
    '9.3': '2026-07-08',
    '9.4': '2026-07-15',
    '9.5': '2026-07-16',
    '9.6': '2026-07-22',
    '9.7': '2026-07-27',
    '9.8': '2026-07-28',
    '9.9': '2026-07-30',
    '10.0': '2026-08-04',
    '10.1': '2026-08-05',
    '10.2': '2026-09-09',
    '10.3': '2026-09-11',
    '10.4': '2026-09-14',
    '10.5': '2026-09-18',
    '10.6': '2026-09-23',
    '10.7': '2026-10-07',
    '10.8': '2026-10-08',
    '10.9': '2026-10-12',
    '11.0': '2026-10-13',
    '11.1': '2026-10-15',
    '11.2': '2026-10-20',
    '11.3': '2026-10-26',
    '11.4': '2026-10-27',
    '11.5': '2026-11-02',
    '11.6': '2026-11-03',
    '11.7': '2026-11-06',
    '11.8': '2026-11-11',
    '11.9': '2026-11-11',
    '12.0': '2026-11-12',
};

const StartScreen = () => {
    const navigate = useMathGameSelector((ctx) => ctx.navigate || NOOP_NAVIGATE);
    const releaseDateIso = APP_RELEASE_DATE_BY_VERSION[APP_VERSION] || '2026-04-01';
    const releaseDateDisplay = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(`${releaseDateIso}T12:00:00Z`));
  
    const handleStartClick = () => {
        navigate('/name');
    };

    return (
        <div
            className="start-screen landscape-optimized portrait-optimized ios-notch"
            style={{
                paddingTop: 'max(env(safe-area-inset-top), 1rem)',
                paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)',
                paddingLeft: 'max(env(safe-area-inset-left), 0.5rem)',
                paddingRight: 'max(env(safe-area-inset-right), 0.5rem)',
            }}
        >
            <div className="start-screen__backdrop" aria-hidden="true" />

            <div className="start-screen__animation" aria-hidden="true">
                <iframe
                    src="/clock-logo.html"
                    title="Clock Logo Animation"
                    width="100%"
                    height="100%"
                    style={{
                        border: 'none',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        maxWidth: '100%',
                        maxHeight: '100%',
                        pointerEvents: 'none',
                    }}
                />
            </div>

            <div className="start-screen__controls" style={{ userSelect: 'none' }}>
                <div className="start-screen__release">
                    <p className="start-screen__version">Version {APP_VERSION}</p>
                    <p className="start-screen__date">{releaseDateDisplay}</p>
                </div>

                <button
                    onClick={handleStartClick}
                    className="start-screen__start-button"
                    inputMode="none"
                >
                    <span className="start-screen__play-icon" aria-hidden="true">&#9654;</span>
                    <span>Start</span>
                </button>
            </div>
        </div>
    );
};

export default StartScreen;
