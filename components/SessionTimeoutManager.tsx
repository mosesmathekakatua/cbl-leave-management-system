
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '../store';

const TIMEOUT_DURATION = 10 * 60 * 1000; // 10 minutes total session time
const WARNING_DURATION = 2 * 60 * 1000;  // Show warning 2 minutes before logout

const SessionTimeoutManager: React.FC = () => {
  const { state, dispatch } = useStore();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(WARNING_DURATION / 1000);
  
  const timeoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const logout = useCallback(() => {
    // Clear everything
    if (timeoutTimer.current) clearTimeout(timeoutTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    
    dispatch({ type: 'LOGOUT' });
    setShowWarning(false);
  }, [dispatch]);

  const resetTimers = useCallback(() => {
    if (timeoutTimer.current) clearTimeout(timeoutTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    
    setShowWarning(false);
    setTimeLeft(WARNING_DURATION / 1000);

    if (state.currentUser) {
      // 1. Set timer for the warning appearance
      warningTimer.current = setTimeout(() => {
        setShowWarning(true);
        // 2. Start the visible countdown
        countdownTimer.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              logout();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, TIMEOUT_DURATION - WARNING_DURATION);

      // 3. Set the hard timeout for auto-logout
      timeoutTimer.current = setTimeout(logout, TIMEOUT_DURATION);
    }
  }, [state.currentUser, logout]);

  useEffect(() => {
    // Track these events as "activity"
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      // Only reset if we aren't already showing the warning
      // Once the warning is up, user must interact with the modal specifically
      if (!showWarning) {
        resetTimers();
      }
    };

    if (state.currentUser) {
      resetTimers();
      events.forEach(event => window.addEventListener(event, handleActivity));
    }

    return () => {
      if (timeoutTimer.current) clearTimeout(timeoutTimer.current);
      if (warningTimer.current) clearTimeout(warningTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
      events.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [state.currentUser, showWarning, resetTimers]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden border-2 border-amber-400 p-8 text-center animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6 border-2 border-amber-200 shadow-sm animate-pulse">
          ⏳
        </div>
        
        <h2 className="text-xl font-black text-emerald-900 uppercase tracking-tighter mb-2">Session Expiring</h2>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6 leading-relaxed">
          Inactivity detected. For your security, this session will terminate in:
        </p>

        <div className="bg-gray-50 rounded-2xl py-6 mb-8 border-2 border-emerald-50">
          <div className="text-5xl font-black text-rose-600 tabular-nums tracking-tighter">
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
          <p className="text-[9px] font-black text-rose-300 uppercase tracking-[0.2em] mt-2">Minutes Remaining</p>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={resetTimers}
            className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl uppercase tracking-widest text-xs border-b-4 border-emerald-800 shadow-lg hover:bg-emerald-700 active:translate-y-1 transition-all"
          >
            Extend Access
          </button>
          <button 
            onClick={logout}
            className="w-full py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-rose-600 transition-colors"
          >
            End Session Now
          </button>
        </div>
        
        <p className="mt-6 text-[8px] font-black text-gray-300 uppercase tracking-widest italic">
          Security Policy v3.2 — Commercial Builders Ltd
        </p>
      </div>
    </div>
  );
};

export default SessionTimeoutManager;
