// src/components/NameForm.jsx

import React, { useEffect, useRef, useState } from 'react';
import { getAdminStats } from '../api/mathApi.js';
import {
  FaGamepad,
  FaGraduationCap,
  FaLock,
  FaPlay,
  FaSchool,
  FaTimes,
  FaUser,
  FaUserShield,
} from 'react-icons/fa';
import { useMathGamePick } from '../store/mathGameBridgeStore.js';
import AdminBrand from './admin/AdminBrand.jsx';
import '../styles/NameForm.css';

const formInputClass =
  "!w-full !max-w-[320px] sm:!max-w-[340px] mx-auto mb-2 sm:mb-3 h-10 sm:h-12 " +
  "px-3 sm:px-4 !rounded-2xl !text-gray-800 font-bold text-center " +
  "text-2xl sm:text-3xl tracking-widest !bg-white !border-4 !border-green-300 " +
  "shadow-lg focus:outline-none focus:ring-0";
const formSelectClass =
  "w-full max-w-[320px] sm:max-w-[340px] mx-auto mb-2 sm:mb-3 h-10 sm:h-12 " +
  "px-3 sm:px-4 rounded-2xl font-semibold text-base sm:text-lg " +
  "bg-white border-4 border-green-300 shadow-lg focus:outline-none focus:ring-0";
const labelClass =
  "text-base sm:text-lg md:text-xl text-center font-sans text-green-600 font-semibold tracking-wide mb-1";
const panelClass =
  "bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 rounded-2xl sm:rounded-3xl " +
  "p-3 sm:p-4 shadow-2xl flex flex-col items-center relative z-10 mx-2 sm:mx-4 " +
  "w-full max-w-sm border border-blue-200/30 backdrop-blur-md";

const NOOP = () => {};
const NOOP_NAVIGATE = () => {};
const LOGIN_UNAVAILABLE = async () => {
  throw new Error('Login unavailable');
};
const SCHOOL_OPTIONS = ['School A', 'School B', 'School C'];
const GRADE_OPTIONS = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const AdminPinModal = ({
    adminPin,
    setAdminPin,
    isAdminLoading,
    error,
    onSubmit,
    onCancel,
}) => {
    const handleAdminKeypadInput = (key) => {
        if (isAdminLoading) return;
        if (key === 'C') return setAdminPin('');
        if (key.length === 1 && !isNaN(key) && adminPin.length < 4) {
            setAdminPin(adminPin + key);
        }
    };

    const AdminKeypadButton = ({ value, label, className }) => (
        <button
            type="button"
            onClick={() => handleAdminKeypadInput(value)}
            className={`h-10 sm:h-12 w-full bg-gray-100 text-gray-900 text-center font-bold text-sm rounded-xl shadow-md hover:bg-gray-200 active:scale-95 transition select-none border border-gray-200 flex items-center justify-center ${className || ''}`}
            tabIndex="-1"
            disabled={isAdminLoading}
        >
            {label || value}
        </button>
    );

    return (
        <div className="admin-classroom-page admin-login-page fixed inset-0 flex items-center justify-center z-[100] animate-fade-in"
             style={{
                 backgroundImage: "url('/Mathnow_bg.png')",
                 backgroundSize: 'cover',
                 backgroundPosition: 'center',
                 backgroundRepeat: 'no-repeat',
                 backdropFilter: 'blur(4px)',
             }}
        >
            <AdminBrand className="admin-brand--floating" />
            <div
                className={`${panelClass} admin-login-card animate-pop-in`}
            >
                <h2 className="text-base sm:text-lg md:text-xl text-center font-sans text-green-600 font-semibold tracking-wide mb-2">
                    Enter Admin PIN
                </h2>
                <input
                    className={formInputClass + " text-center"}
                    value={adminPin}
                    readOnly
                    type="password"
                    maxLength={4}
                    inputMode="none"
                    name="admin-passcode"
                />
                <div className="grid grid-cols-3 gap-2 mb-3 mx-auto justify-items-center w-full max-w-[320px] sm:max-w-[340px]">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <AdminKeypadButton key={num} value={String(num)} />
                    ))}
                    <AdminKeypadButton value="0" />
                    <AdminKeypadButton
                        value="C"
                        className="col-span-2 bg-gray-200 text-gray-800 font-semibold border-gray-300"
                        label={<span className="text-lg w-full text-center">CLEAR</span>}
                    />
                </div>
                <div className="flex justify-center space-x-2 w-full">
                    <button
                        type="button"
                        onClick={onSubmit}
                        className="bg-green-800 hover:bg-green-900 text-white font-bold py-1 px-3 sm:px-4 rounded-2xl duration-300 transform hover:scale-105 active:scale-95 shadow-lg flex-1 text-sm max-w-[140px]"
                        disabled={adminPin.length !== 4 || isAdminLoading}
                    >
                        Enter
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="bg-gray-400 hover:bg-gray-500 text-gray-800 font-bold py-1 px-3 sm:px-4 rounded-2xl duration-300 transform hover:scale-105 active:scale-95 shadow-lg flex-1 text-sm max-w-[140px]"
                        disabled={isAdminLoading}
                    >
                        Cancel
                    </button>
                </div>
                {error && <div className="text-red-300 text-sm mt-2 text-center">{error}</div>}
            </div>
        </div>
    );
};
// End AdminPinModal


const NameForm = () => {
  const {
    childPin,
    childName, 
    setChildName,
    setChildPin,
    handleNameChange,
    handlePinChange,
    handlePinSubmit,
    isLoginLoading,
    handleDemoLogin,
    navigate,
  } = useMathGamePick((ctx) => ({
    childPin: ctx.childPin || '',
    childName: ctx.childName || '',
    setChildName: ctx.setChildName || NOOP,
    setChildPin: ctx.setChildPin || NOOP,
    handleNameChange: ctx.handleNameChange || NOOP,
    handlePinChange: ctx.handlePinChange || NOOP,
    handlePinSubmit: ctx.handlePinSubmit || LOGIN_UNAVAILABLE,
    isLoginLoading: Boolean(ctx.isLoginLoading),
    handleDemoLogin: ctx.handleDemoLogin || NOOP,
    navigate: ctx.navigate || NOOP_NAVIGATE,
  }));

  const [error, setError] = useState('');
  const [school, setSchool] = useState('');
  const [grade, setGrade] = useState('');
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [adminError, setAdminError] = useState('');
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [adminLoadingDots, setAdminLoadingDots] = useState('.');
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const wasAdminPinModalOpenRef = useRef(false);
  const loadingMessages = [
    'Checking your passcode...',
    'Loading your progress...',
    'Setting up your math adventure...',
  ];

  useEffect(() => {
    setChildName('');
    setChildPin('');
    setSchool('');
    setGrade('');
  }, [setChildName, setChildPin]);

  useEffect(() => {
    const wasOpen = wasAdminPinModalOpenRef.current;
    if (wasOpen && !showAdminPinModal && childPin) {
      handlePinChange({ target: { value: '' } });
    }
    wasAdminPinModalOpenRef.current = showAdminPinModal;
  }, [childPin, handlePinChange, showAdminPinModal]);

  useEffect(() => {
    if (!isLoginLoading) {
      setLoadingMessageIndex(0);
      return;
    }

    const timer = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 1000);

    return () => clearInterval(timer);
  }, [isLoginLoading, loadingMessages.length]);

  useEffect(() => {
    if (!error) return undefined;

    const dismissTimer = window.setTimeout(() => setError(''), 6000);
    return () => window.clearTimeout(dismissTimer);
  }, [error]);

  useEffect(() => {
    if (!isAdminLoading) {
      setAdminLoadingDots('.');
      return;
    }

    const dotCycle = ['.', '..', '...'];
    let dotIndex = 0;
    const timer = setInterval(() => {
      dotIndex = (dotIndex + 1) % dotCycle.length;
      setAdminLoadingDots(dotCycle[dotIndex]);
    }, 450);

    return () => clearInterval(timer);
  }, [isAdminLoading]);

  const handleOpenAdminPinModal = () => {
    if (isAdminLoading) return;
    setError('');
    setAdminError('');
    setAdminPin('');
    setShowAdminPinModal(true);
  };

  const handleCloseAdminPinModal = () => {
    if (isAdminLoading) return;
    setShowAdminPinModal(false);
    setAdminError('');
    setAdminPin('');
  };

  const handleAdminPinSubmit = async () => {
    if (isAdminLoading) return;
    if (!adminPin || adminPin.length !== 4) {
      setAdminError('Enter a valid 4-digit admin PIN.');
      return;
    }

    setAdminError('');
    setIsAdminLoading(true);
    setShowAdminPinModal(false);

    try {
      await getAdminStats(adminPin);
      localStorage.setItem('math-admin-pin', adminPin);
      navigate('/admin-dashboard');
      return;
    } catch (e) {
      setAdminError('Admin access failed: ' + (e.message || 'Server error.'));
      setShowAdminPinModal(true);
      setAdminPin('');
    }

    setIsAdminLoading(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const nameToSubmit = childName.trim(); 
    const pinToSubmit = childPin.trim(); 
    if (!nameToSubmit || nameToSubmit.length < 2) { 
        setError('Please enter a valid name (at least 2 characters).');
        return;
    }
    if (!pinToSubmit || pinToSubmit.length < 2) {
      setError('Please enter a valid Passcode (at least 2 characters).');
      return;
    }
    if (!school) {
      setError('Please select your school.');
      return;
    }
    if (!grade) {
      setError('Please select your grade level.');
      return;
    }
    if (isLoginLoading) return;
    setError('');
    
    try {
        await handlePinSubmit(pinToSubmit, nameToSubmit, school, grade);
    } catch (err) {
        setError(err.message || 'Login failed. Please check your name, school, grade, and passcode.');
    }
  };

  const handleUserKeypadInput = (key) => { 
    let newPin = childPin;
    
    if (key === 'C') {
        newPin = '';
    } else if (key === '<') {
        newPin = childPin.slice(0, -1);
    } else if (childPin.length < 4) {
        newPin = childPin + key;
    }

    handlePinChange({ target: { value: newPin } });
  };
  
  const UserKeypadButton = ({ value, label, className }) => (
    <button
      type="button"
      onClick={() => handleUserKeypadInput(value)}
      className={`student-login-key h-10 sm:h-12 w-full bg-gray-100 text-gray-900 text-center font-bold text-sm sm:text-base rounded-xl shadow-md hover:bg-gray-200 active:scale-95 transition select-none border border-gray-200 flex items-center justify-center ${className || ''}`}
      tabIndex="-1"
    >
      {label || value}
    </button>
  );


const handleDemoClick = () => {
      if (isLoginLoading) return;
      setError('');
      handleDemoLogin();
  };

  if (isAdminLoading) {
    return (
      <div
        className="admin-classroom-page fixed inset-0 z-[102] flex items-center justify-center"
        style={{
          backgroundImage: "url('/Mathnow_bg.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <AdminBrand className="admin-brand--floating" />
        <div className="rounded-3xl border border-sky-200/70 bg-white/90 px-7 py-5 text-center text-[#18345b] shadow-2xl backdrop-blur-md">
          <p className="m-0 text-xl sm:text-2xl font-extrabold tracking-wide">
            Loading Admin Dashboard
            <span className="inline-block w-[2.2ch] text-left">{adminLoadingDots}</span>
          </p>
        </div>
      </div>
    );
  }

  if (showAdminPinModal) {
    return (
      <AdminPinModal
        adminPin={adminPin}
        setAdminPin={setAdminPin}
        isAdminLoading={isAdminLoading}
        error={adminError}
        onSubmit={handleAdminPinSubmit}
        onCancel={handleCloseAdminPinModal}
      />
    );
  }


  return (
    <div
      className="student-login-page min-h-screen w-full flex items-center justify-center px-4"
    >
      <button
        type="button"
        onClick={handleOpenAdminPinModal}
        className="student-login-admin fixed z-50 bg-white/80 hover:bg-gray-200 text-gray-700 rounded-full p-2 shadow-lg border-2 border-gray-400 focus:outline-none transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-1"
        style={{
          top: 'max(env(safe-area-inset-top), 0.5rem)',
          right: 'max(env(safe-area-inset-right), 0.75rem)',
        }}
        aria-label="Admin Login"
      >
        <FaUserShield size={20} />
        <span className="text-sm font-semibold">Admin</span>
      </button>

      <main className="student-login-shell">
        <AdminBrand className="student-login-brand" />

        <div className={`student-login-panel ${panelClass}`}>

        <form onSubmit={onSubmit} className="student-login-form w-full flex flex-col items-center" autoComplete="off">
          <label className={`${labelClass} student-login-label`} htmlFor="child-name">
             <FaUser aria-hidden="true" />
             <span>Enter your name</span>
          </label>
          <input
            id="child-name"
            className={`${formInputClass} student-login-input`}
            value={childName}
            onChange={handleNameChange}
            type="text"
            maxLength={15}
            autoComplete="off"
            name="child-name"
            style={{ backgroundColor: '#ffffff', color: '#1f2937' }}
          />
          <label className={`${labelClass} student-login-label`} htmlFor="student-school">
             <FaSchool aria-hidden="true" />
             <span>School Name</span>
          </label>
          <select
            id="student-school"
            name="student-school"
            className={`${formSelectClass} student-login-select ${school ? 'student-login-select--selected' : 'student-login-select--empty'}`}
            value={school}
            onChange={(event) => setSchool(event.target.value)}
            autoComplete="organization"
          >
            <option value="" className="student-login-select-placeholder">Select your school</option>
            {SCHOOL_OPTIONS.map((option) => (
              <option key={option} value={option} className="student-login-select-option">{option}</option>
            ))}
          </select>

          <label className={`${labelClass} student-login-label`} htmlFor="student-grade">
             <FaGraduationCap aria-hidden="true" />
             <span>Grade</span>
          </label>
          <select
            id="student-grade"
            name="student-grade"
            className={`${formSelectClass} student-login-select ${grade ? 'student-login-select--selected' : 'student-login-select--empty'}`}
            value={grade}
            onChange={(event) => setGrade(event.target.value)}
          >
            <option value="" className="student-login-select-placeholder">Select your grade level</option>
            {GRADE_OPTIONS.map((option) => (
              <option key={option} value={option} className="student-login-select-option">{option}</option>
            ))}
          </select>

          <label className={`${labelClass} student-login-label`} htmlFor="student-passcode">
             <FaLock aria-hidden="true" />
             <span>Enter your passcode</span>
          </label>

          <input
            id="student-passcode"
            className={`${formInputClass} student-login-input student-login-passcode`}
            value={childPin || ''}
            readOnly
            type="password"
            maxLength={4}
            inputMode="none"
            autoComplete="new-password"
            name="passcode"
          />

          <div className="student-login-keypad grid grid-cols-3 gap-2 mb-1 mx-auto justify-items-center w-full max-w-[320px] sm:max-w-[340px]">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
              <UserKeypadButton key={num} value={String(num)} />
            ))}
            <UserKeypadButton value="9" />
            <UserKeypadButton
              value="<"
              className="student-login-key--backspace"
              label={
                <svg viewBox="0 0 24 24" role="img" aria-label="Backspace" focusable="false">
                  <path d="M9 5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-7-7 7-7Z" fill="#1764a5" />
                  <path d="m12 9 6 6m0-6-6 6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                </svg>
              }
            />
            <UserKeypadButton value="0" />
            <UserKeypadButton 
              value="C" 
              className="student-login-key--clear bg-gray-200 text-gray-800 font-semibold border-gray-300"
              label={<span className="text-sm sm:text-base w-full text-center">Clear</span>} 
            />
          </div>

          <div className="student-login-actions flex justify-center space-x-2 mt-1">
            <button
              type="submit"
              className="student-login-action student-login-action--start bg-green-800 hover:bg-green-900 text-white font-bold py-1 px-3 sm:px-4 rounded-2xl duration-300 transform hover:scale-105 active:scale-95 shadow-lg flex-1 text-sm"
              disabled={isLoginLoading}
            >
              <FaPlay aria-hidden="true" />
              <span>Start</span>
            </button>
            
            <button
              type="button"
              onClick={handleDemoClick}
              className="student-login-action student-login-action--demo bg-green-800 hover:bg-green-900 text-white font-bold py-1 px-3 sm:px-4 rounded-2xl duration-300 transform hover:scale-105 active:scale-95 shadow-lg flex-1 text-sm"
              disabled={isLoginLoading}
            >
              <FaGamepad aria-hidden="true" />
              <span>Demo</span>
            </button>
          </div>
        </form>
        </div>
      </main>

      {error && (
        <div
          className="fixed inset-x-0 top-3 z-[120] flex justify-center px-3 sm:top-5 sm:px-5"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="relative flex w-full max-w-sm animate-pop-in items-center rounded-2xl border border-green-300/70 bg-green-700 px-12 py-3 text-white shadow-2xl sm:py-3.5">
            <p className="m-0 w-full text-center font-sans text-base font-extrabold tracking-wide sm:text-lg">
              {error}
            </p>
            <button
              type="button"
              onClick={() => setError('')}
              className="absolute right-3 flex h-8 w-8 items-center justify-center rounded-full text-green-100 transition hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/70"
              aria-label="Dismiss login error"
            >
              <FaTimes aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {isLoginLoading && (  
        <div 
            className="fixed inset-0 z-[101] flex items-center justify-center animate-fade-in" 
            style={{ 
                backgroundImage: "url('/Mathnow_bg.png')",
                backgroundSize: 'cover', 
                backgroundPosition: 'center', 
                backgroundRepeat: 'no-repeat', 
                backgroundColor: 'rgba(0, 0, 0, 0.9)', // Fallback and slight darkening 
            }} 
        > 
            <div className="student-login-loading-card relative w-[92vw] max-w-[26rem] sm:max-w-[30rem] lg:max-w-[36rem] rounded-3xl border border-white/25 p-5 sm:p-7 lg:p-8 text-white shadow-2xl backdrop-blur-md">
                <span className="pointer-events-none absolute top-3 left-4 text-lg sm:top-4 sm:left-5 sm:text-xl lg:text-2xl text-cyan-100/80 animate-pulse">+</span>
                <span className="pointer-events-none absolute top-3 right-4 text-lg sm:top-4 sm:right-5 sm:text-xl lg:text-2xl text-emerald-100/80 animate-pulse">-</span>

                <div className="mx-auto mb-3 sm:mb-4 flex h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28 items-center justify-center rounded-full bg-gradient-to-br from-emerald-300 to-cyan-300 text-5xl sm:text-6xl lg:text-7xl shadow-lg animate-bounce">
                  <span role="img" aria-label="octopus mascot">{'\u{1F419}'}</span>
                </div>

                <div className="text-center text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-200 drop-shadow-sm">
                  Almost There
                </div>

                <div className="mt-2 sm:mt-3 text-center text-base sm:text-lg lg:text-xl font-semibold text-cyan-100 min-h-[28px] sm:min-h-[32px]">
                  {loadingMessages[loadingMessageIndex]}
                </div>

                <div className="mt-5 sm:mt-6 h-2.5 sm:h-3 w-full overflow-hidden rounded-full bg-white/15">
                  <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300 animate-pulse" />
                </div>
            </div> 
        </div>
      )} 

    </div>
  );
};

export default NameForm;
