
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { LeaveType, LeaveStatus, LeaveRequest } from '../types';
import { getLeaveAdvisory } from '../services/geminiService';

const LeaveForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { state, dispatch } = useStore();
  const [formData, setFormData] = useState({ 
    type: LeaveType.ANNUAL, 
    dates: [] as string[], 
    reason: '',
    startDate: '',
    endDate: ''
  });
  const [manualDate, setManualDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [conflicts, setConflicts] = useState<LeaveRequest[]>([]);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0,0,0,0);
  const minDateString = tomorrow.toISOString().split('T')[0];

  // Logic: Only conflict if same branch, same department, SAME category, and overlapping dates.
  useEffect(() => {
    if (formData.dates.length > 0) {
      const localConflicts = state.requests.filter(r => {
        if (
          r.department !== state.currentUser?.department || 
          r.branch !== state.currentUser?.branch || 
          r.status === LeaveStatus.REJECTED ||
          r.type !== formData.type // Allow different categories from same dept
        ) return false;
        
        return r.dates.some(existingDate => formData.dates.includes(existingDate));
      });
      
      setConflicts(localConflicts);
      
      if (localConflicts.length === 0) {
        const sorted = [...formData.dates].sort();
        setAiAdvice("CBL Intelligence analyzing operational impact...");
        getLeaveAdvisory(state.currentUser!, sorted[0], sorted[sorted.length-1], state.requests).then(res => setAiAdvice(res));
      } else {
        setAiAdvice(null);
      }
    } else {
      setConflicts([]);
      setAiAdvice(null);
    }
  }, [formData.dates, formData.type, state.requests, state.currentUser]);

  const generateDateArray = (start: string, end: string) => {
    if (!start || !end) return [];
    const dates = [];
    let current = new Date(start);
    const last = new Date(end);
    
    // Safety break for long ranges
    let count = 0;
    while (current <= last && count < 365) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
      count++;
    }
    return dates;
  };

  const handleRangeChange = (start: string, end: string) => {
    const rangeDates = generateDateArray(start, end);
    // Merge with existing unique dates
    const combined = Array.from(new Set([...formData.dates, ...rangeDates])).sort();
    setFormData({ ...formData, startDate: start, endDate: end, dates: combined });
  };

  const handleAddManualDate = () => {
    if (!manualDate) return;
    if (formData.dates.includes(manualDate)) {
      setManualDate('');
      return;
    }
    const newDates = [...formData.dates, manualDate].sort();
    setFormData({ ...formData, dates: newDates });
    setManualDate('');
  };

  const balance = state.currentUser?.balances[formData.type] || 0;
  const requestedDays = formData.dates.length;
  const isOverBalance = requestedDays > balance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.dates.length === 0 || conflicts.length > 0 || isOverBalance) return;

    setLoading(true);
    const sorted = [...formData.dates].sort();
    const newRequest: LeaveRequest = {
      id: `r${Date.now()}`,
      userId: state.currentUser!.id,
      userName: state.currentUser!.name,
      userRole: state.currentUser!.role,
      department: state.currentUser!.department,
      branch: state.currentUser!.branch,
      type: formData.type,
      dates: sorted,
      startDate: sorted[0],
      endDate: sorted[sorted.length - 1],
      reason: formData.reason,
      status: LeaveStatus.PENDING,
      createdAt: new Date().toISOString(),
    };

    setTimeout(() => {
      dispatch({ type: 'ADD_REQUEST', request: newRequest });
      setLoading(false);
      onSuccess();
    }, 1200);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10 fade-in max-w-2xl mx-auto py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-5">
          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Leave Category</label>
          <select className="w-full font-bold text-[14px]" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as LeaveType })} required>
            {Object.values(LeaveType).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="flex items-center justify-between p-6 bg-[#EAE8DA]/50 rounded-3xl border border-gray-100">
             <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Available Balance</span>
             <span className={`text-[15px] font-black ${balance < 5 ? 'text-rose-500' : 'text-[#187444]'}`}>{balance} Days</span>
          </div>
        </div>

        <div className="space-y-5">
          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Duration Window</label>
          
          <div className="p-4 bg-gray-50/50 rounded-3xl border border-gray-100 space-y-4">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Option 1: Date Range</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[8px] font-black text-gray-400 uppercase mb-1 ml-1">Start</p>
                <input type="date" min={minDateString} className="w-full text-xs font-bold" value={formData.startDate} onChange={e => handleRangeChange(e.target.value, formData.endDate)} />
              </div>
              <div>
                <p className="text-[8px] font-black text-gray-400 uppercase mb-1 ml-1">End</p>
                <input type="date" min={formData.startDate || minDateString} className="w-full text-xs font-bold" value={formData.endDate} onChange={e => handleRangeChange(formData.startDate, e.target.value)} />
              </div>
            </div>

            <div className="h-px bg-gray-200 w-full" />

            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Option 2: Individual Dates</p>
            <div className="flex gap-2">
              <input type="date" min={minDateString} className="flex-1 text-xs font-bold" value={manualDate} onChange={e => setManualDate(e.target.value)} />
              <button 
                type="button" 
                onClick={handleAddManualDate}
                className="px-4 bg-[#187444] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#15633a] active:scale-95 transition-all shadow-md shadow-[#187444]/10"
              >
                Add Date
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 max-h-40 overflow-y-auto p-5 bg-gray-50 rounded-3xl border border-gray-100">
             {formData.dates.length === 0 ? (
               <div className="flex flex-col items-center justify-center w-full py-6">
                 <p className="text-[10px] text-gray-300 font-black uppercase italic tracking-widest">No Dates Selected</p>
               </div>
             ) : (
               <div className="w-full space-y-2">
                 <div className="flex justify-between items-center px-1">
                   <p className="text-[9px] font-black text-[#187444] uppercase tracking-widest">{formData.dates.length} Days Computed</p>
                   <button type="button" onClick={() => setFormData({...formData, dates: [], startDate: '', endDate: ''})} className="text-[8px] font-black text-rose-400 uppercase hover:text-rose-600">Clear All</button>
                 </div>
                 <div className="flex flex-wrap gap-2">
                   {formData.dates.map(d => (
                     <div key={d} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm animate-in zoom-in-95">
                       <span className="text-[9px] font-bold">{new Date(d).toLocaleDateString()}</span>
                       <button type="button" onClick={() => setFormData({...formData, dates: formData.dates.filter(item => item !== d)})} className="text-rose-500 text-[10px] font-bold hover:scale-110 transition-transform">✕</button>
                     </div>
                   ))}
                 </div>
               </div>
             )}
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Operational Justification</label>
        <textarea className="w-full text-[14px] font-medium min-h-[100px]" placeholder="State your reason for absence..." value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} required />
      </div>

      {conflicts.length > 0 && (
        <div className="p-6 bg-rose-50 border-2 border-rose-100 rounded-[2rem] animate-in shake">
          <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-3">⚠️ Critical Category Conflict</p>
          <div className="space-y-2">
            {conflicts.map(c => (
              <p key={c.id} className="text-[11px] font-bold text-gray-600">Overlap with {c.userName}'s {c.type} at {c.branch}.</p>
            ))}
          </div>
        </div>
      )}

      {isOverBalance && (
        <div className="p-6 bg-rose-50 border-2 border-rose-100 rounded-[2rem] animate-in shake">
          <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">⚠️ Quota Violation</p>
          <p className="text-[11px] font-bold text-gray-600">Requesting {requestedDays} days, but only {balance} days remaining.</p>
        </div>
      )}

      {aiAdvice && !conflicts.length && !isOverBalance && (
        <div className="p-6 bg-[#187444]/5 border-2 border-[#187444]/20 rounded-[2rem] animate-in fade-in">
           <p className="text-[11px] font-bold text-[#187444] uppercase tracking-wide leading-relaxed">
             <span className="mr-3">🛡️</span> {aiAdvice}
           </p>
        </div>
      )}

      <button 
        type="submit" 
        disabled={loading || conflicts.length > 0 || isOverBalance || requestedDays === 0} 
        className="w-full py-6 bg-[#187444] text-white font-black rounded-[2rem] shadow-2xl uppercase tracking-[0.2em] text-[13px] disabled:opacity-30 transition-all active:scale-[0.98] border-b-4 border-[#15633a]"
      >
        {loading ? 'Processing Application...' : 'Submit Application'}
      </button>
    </form>
  );
};

export default LeaveForm;
