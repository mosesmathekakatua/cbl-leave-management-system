
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { UserRole } from '../types';

interface ResetModalProps {
  onClose: () => void;
}

const ResetDatabaseModal: React.FC<ResetModalProps> = ({ onClose }) => {
  const { state, dispatch } = useStore();
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState('');
  const [phrase, setPhrase] = useState('');
  const [otp, setOtp] = useState('');
  const [systemToken] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PHRASE_REQ = "RESET DATABASE CONFIRMED";

  const exportData = (format: 'json' | 'csv') => {
    setIsExporting(true);
    try {
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CBL_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
      } else {
        // Simple CSV generation for critical tables
        const headers = ["Employee", "Branch", "Type", "Start", "End", "Status"];
        const rows = state.requests.map(r => [r.userName, r.branch, r.type, r.startDate, r.endDate, r.status]);
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CBL_REQUESTS_BACKUP_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
      }
      setError(null);
    } catch (e) {
      setError("Backup generation failed.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleNext = () => {
    setError(null);
    if (step === 1) setStep(2);
    else if (step === 2) {
      if (pin === state.currentUser?.pin) setStep(3);
      else setError("Incorrect Security PIN.");
    } else if (step === 3) {
      if (otp === systemToken) setStep(4);
      else setError("One-Time Token mismatch.");
    }
  };

  const handleExecute = () => {
    if (phrase !== PHRASE_REQ) return;
    
    // Automatic JSON Backup before execution
    exportData('json');

    const metadata = `Reset executed via ${navigator.userAgent} on ${new Date().toLocaleString()}`;
    dispatch({ 
      type: 'RESET_DATABASE', 
      preservedAdminId: state.currentUser!.id,
      metadata: metadata 
    });
    
    alert("System integrity reset successfully. Automated backup has been downloaded.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-rose-950/80 backdrop-blur-xl p-6 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border-4 border-rose-500 flex flex-col animate-in zoom-in-95">
        <div className="bg-rose-500 p-8 text-white text-center">
           <span className="text-4xl mb-4 block animate-pulse">⚠️</span>
           <h2 className="text-2xl font-black uppercase tracking-tighter">Critical System Reset</h2>
           <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-80">Step {step} of 4 • Authorization Required</p>
        </div>

        <div className="p-10 space-y-8 flex-1">
          {error && (
            <div className="p-4 bg-rose-50 border-2 border-rose-100 rounded-2xl text-center text-[10px] font-black text-rose-600 uppercase animate-in shake">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6 text-center">
              <p className="text-sm font-bold text-gray-600 leading-relaxed">
                This operation will <span className="text-rose-600 font-black">DESTROY</span> all leave records, logs, and staff accounts. Only your profile will be preserved.
              </p>
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => exportData('json')} className="py-4 bg-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200">Export JSON</button>
                 <button onClick={() => exportData('csv')} className="py-4 bg-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200">Export CSV</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Re-Enter Security PIN</label>
              <input type="password" maxLength={4} className="w-full text-center tracking-[1em] text-2xl font-black" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g,''))} />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 text-center">
               <div className="bg-gray-50 p-6 rounded-3xl border-2 border-dashed border-rose-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Manual OTP Token</p>
                  <p className="text-3xl font-black text-rose-600 tracking-[0.2em]">{systemToken}</p>
               </div>
               <input placeholder="Enter Token" className="w-full text-center font-black uppercase" value={otp} onChange={e => setOtp(e.target.value)} />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest text-center">Final Declaration Required</p>
              <p className="text-[9px] font-bold text-gray-400 text-center italic">"Type: {PHRASE_REQ}"</p>
              <input className="w-full text-center font-black uppercase border-2 border-rose-200" value={phrase} onChange={e => setPhrase(e.target.value.toUpperCase())} placeholder="Type validation phrase..." />
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button onClick={onClose} className="flex-1 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Abort</button>
            {step < 4 ? (
              <button onClick={handleNext} className="flex-1 py-5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Continue</button>
            ) : (
              <button 
                onClick={handleExecute} 
                disabled={phrase !== PHRASE_REQ} 
                className={`flex-1 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all ${phrase === PHRASE_REQ ? 'bg-rose-600 text-white shadow-rose-200' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                Execute Wipe
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AuditTrail: React.FC = () => {
  const { state } = useStore();
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetAttempts, setResetAttempts] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState(0);

  const isAdmin = state.currentUser?.role === UserRole.SUPER_ADMIN;

  const handleResetTrigger = () => {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    // Limit to 2 attempts per hour
    if (now - lastAttemptTime < oneHour && resetAttempts >= 2) {
      alert("SECURITY POLICY: Reset attempt frequency exceeded (Max 2/hr). Please wait.");
      return;
    }

    // Re-auth check (Session age check: 10 mins)
    const loginTime = state.currentUser?.lastLogin ? new Date(state.currentUser.lastLogin).getTime() : 0;
    if (now - loginTime > 10 * 60 * 1000) {
      alert("SECURITY POLICY: Session age exceeds safety threshold. Please re-login before attempting a system wipe.");
      return;
    }

    setResetAttempts(prev => prev + 1);
    setLastAttemptTime(now);
    setShowResetModal(true);
  };

  const dbSize = new Blob([JSON.stringify(state)]).size;
  const dbFormattedSize = (dbSize / 1024).toFixed(2) + ' KB';

  return (
    <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-end">
        <div>
          <p className="text-emerald-600 font-black text-[10px] tracking-widest uppercase">Security & Infrastructure</p>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 mt-1 uppercase tracking-tighter">System Intelligence Hub</h1>
        </div>
        {isAdmin && (
          <button 
            onClick={handleResetTrigger}
            className="px-6 py-3 bg-rose-50 text-rose-600 font-black text-[10px] uppercase rounded-xl border-2 border-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-100"
          >
            Factory Reset DB
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border-2 border-emerald-50 shadow-sm">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Database Occupancy</p>
           <p className="text-2xl font-black text-emerald-900">{dbFormattedSize}</p>
           <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3">
              <div className="h-full bg-emerald-500 w-[15%]" />
           </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border-2 border-emerald-50 shadow-sm">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Personnel Records</p>
           <p className="text-2xl font-black text-emerald-900">{state.users.length}</p>
        </div>
        <div className="bg-white p-6 rounded-[32px] border-2 border-emerald-50 shadow-sm">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Leave Logs</p>
           <p className="text-2xl font-black text-emerald-900">{state.requests.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-sm border-2 border-emerald-50 overflow-hidden">
        <div className="p-5 md:p-6 border-b-2 border-emerald-50 bg-gray-50/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h3 className="text-base md:text-lg font-black text-emerald-900 uppercase">Security Activity Ledger</h3>
          <span className="w-fit text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest bg-white px-3 py-1.5 rounded-full border-2 border-emerald-50 shadow-sm">
            Records in DB: {state.auditLogs.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="border-b border-emerald-50 bg-gray-50/20">
                <th className="px-6 py-4 text-[9px] md:text-[10px] font-black text-emerald-800/50 uppercase tracking-widest">Time (UTC)</th>
                <th className="px-6 py-4 text-[9px] md:text-[10px] font-black text-emerald-800/50 uppercase tracking-widest">Operation</th>
                <th className="px-6 py-4 text-[9px] md:text-[10px] font-black text-emerald-800/50 uppercase tracking-widest">Actor</th>
                <th className="px-6 py-4 text-[9px] md:text-[10px] font-black text-emerald-800/50 uppercase tracking-widest">Data Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {state.auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <p className="text-xs md:text-sm font-black text-gray-300 italic uppercase tracking-widest">No infrastructure logs found.</p>
                  </td>
                </tr>
              ) : (
                state.auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-6 py-4 text-[10px] md:text-xs font-bold text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border-2 border-emerald-100 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-tight shadow-sm">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs md:text-sm font-black text-emerald-900">
                      {log.performedBy}
                    </td>
                    <td className="px-6 py-4 text-[10px] md:text-xs text-gray-500 font-medium italic max-w-xs truncate md:max-w-md">
                      {log.details || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {showResetModal && <ResetDatabaseModal onClose={() => setShowResetModal(false)} />}
    </div>
  );
};

export default AuditTrail;
