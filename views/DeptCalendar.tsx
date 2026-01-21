
import React, { useState } from 'react';
import { useStore } from '../store';
import { Department, Branch, LeaveStatus, LeaveRequest, UserRole } from '../types';

const DeptCalendar: React.FC = () => {
  const { state } = useStore();
  const currentUser = state.currentUser!;
  const [selectedBranch, setSelectedBranch] = useState<Branch | 'ALL'>(currentUser.branch);
  const [selectedDept, setSelectedDept] = useState<Department | 'ALL'>(currentUser.department);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState<LeaveRequest[] | null>(null);

  const isManager = currentUser.role !== UserRole.STAFF;

  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const monthName = viewDate.toLocaleString('default', { month: 'long' });

  const requests = state.requests.filter(r => {
    if (r.status !== LeaveStatus.APPROVED) return false;
    const bMatch = selectedBranch === 'ALL' || r.branch === selectedBranch;
    const dMatch = selectedDept === 'ALL' || r.department === selectedDept;
    return bMatch && dMatch;
  });

  const getLeavesForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return requests.filter(r => r.dates.includes(dateStr));
  };

  return (
    <div className="space-y-10 fade-in pb-20">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Availability Grid</h1>
          <p className="text-gray-500 font-bold text-[10px] mt-2 uppercase tracking-widest">Real-time Node Attendance Tracking</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <select className="px-6 py-3.5 rounded-2xl bg-white shadow-sm border-2 border-gray-100 text-[10px] font-black uppercase tracking-widest" value={selectedBranch} onChange={e => setSelectedBranch(e.target.value as any)}>
             {isManager && <option value="ALL">All Satellite Nodes</option>}
             {Object.values(Branch).map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select className="px-6 py-3.5 rounded-2xl bg-white shadow-sm border-2 border-gray-100 text-[10px] font-black uppercase tracking-widest" value={selectedDept} onChange={e => setSelectedDept(e.target.value as any)}>
             <option value="ALL">Global Divisions</option>
             {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-50">
             <button onClick={() => setViewDate(new Date(currentYear, currentMonth - 1, 1))} className="w-10 h-10 flex items-center justify-center bg-gray-50 text-black font-black rounded-xl active:scale-90 transition-all">◀</button>
             <button onClick={() => setViewDate(new Date(currentYear, currentMonth + 1, 1))} className="w-10 h-10 flex items-center justify-center bg-gray-50 text-black font-black rounded-xl active:scale-90 transition-all">▶</button>
          </div>
        </div>
      </header>

      <div className="bg-white rounded-[3rem] border-2 border-gray-50 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-gray-50 text-center bg-gray-50/20">
           <h2 className="text-2xl font-black uppercase tracking-widest text-emerald-900">{monthName} {currentYear}</h2>
        </div>
        <div className="p-6 grid grid-cols-7 gap-3">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-[10px] font-black text-gray-400 uppercase py-4 tracking-widest">{d}</div>
          ))}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} className="bg-gray-50/30 h-32 rounded-[2rem] border border-dashed border-gray-100" />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const leaves = getLeavesForDay(day);
            const isToday = day === new Date().getDate() && currentMonth === new Date().getMonth();
            return (
              <div key={day} onClick={() => leaves.length > 0 && setSelectedDayEvents(leaves)} className={`h-32 bg-white border-2 border-gray-50 rounded-[2rem] p-4 transition-all cursor-pointer relative group ${isToday ? 'border-[#187444] bg-emerald-50/20' : 'hover:border-[#187444]/30'}`}>
                <span className={`text-[12px] font-black ${isToday ? 'text-[#187444]' : 'text-gray-300'} group-hover:text-black transition-colors`}>{day}</span>
                <div className="mt-3 space-y-2 max-h-[70px] overflow-y-auto no-scrollbar">
                  {leaves.map(l => (
                    <div key={l.id} className="bg-[#187444] text-white text-[8px] font-black px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-2 transform transition-transform group-hover:scale-105">
                      <span className="w-1 h-1 bg-[#F9C912] rounded-full animate-pulse" />
                      <span className="truncate uppercase">{l.userName.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedDayEvents && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-8 border-2 border-emerald-50">
            <h3 className="text-xl font-black uppercase tracking-tight text-center">Node Attendance Roster</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {selectedDayEvents.map(e => (
                <div key={e.id} className="p-5 bg-gray-50 rounded-[2rem] flex justify-between items-center border border-gray-100">
                  <div>
                    <p className="font-black uppercase text-sm">{e.userName}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{e.branch} • {e.department}</p>
                  </div>
                  <span className="text-[8px] font-black text-[#187444] bg-[#187444]/10 px-3 py-1.5 rounded-xl uppercase tracking-widest">{e.type.replace(' Leave', '')}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setSelectedDayEvents(null)} className="w-full py-5 bg-black text-white font-black rounded-2xl uppercase tracking-widest text-[11px] shadow-2xl">Return to Grid</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeptCalendar;
