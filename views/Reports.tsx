
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { LeaveStatus, Department, Branch, LeaveType, UserRole } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const Reports: React.FC = () => {
  const { state } = useStore();
  const currentUser = state.currentUser!;
  
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filterDept, setFilterDept] = useState<string>('ALL');
  // Initialize with their own branch but allow switching
  const [filterBranch, setFilterBranch] = useState<string>(currentUser.branch);

  const filteredRequests = useMemo(() => {
    return state.requests.filter(r => {
      if (r.status !== LeaveStatus.APPROVED) return false;
      const matchesDept = filterDept === 'ALL' || r.department === filterDept;
      const matchesBranch = filterBranch === 'ALL' || r.branch === filterBranch;
      let matchesDate = true;
      if (dateRange.start || dateRange.end) {
        const reqStart = new Date(r.startDate).getTime();
        const reqEnd = new Date(r.endDate).getTime();
        const filterStart = dateRange.start ? new Date(dateRange.start).getTime() : -Infinity;
        const filterEnd = dateRange.end ? new Date(dateRange.end).getTime() : Infinity;
        matchesDate = reqStart <= filterEnd && reqEnd >= filterStart;
      }
      return matchesDept && matchesBranch && matchesDate;
    });
  }, [state.requests, dateRange, filterDept, filterBranch]);

  const handleExportCSV = () => {
    const headers = ["Employee", "Branch", "Type", "Start", "End", "Days"];
    const rows = filteredRequests.map(r => [r.userName, r.branch, r.type, r.startDate, r.endDate, r.dates.length]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.body.appendChild(document.createElement("a"));
    link.href = URL.createObjectURL(blob);
    link.download = `CBL_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    document.body.removeChild(link);
  };

  const deptData = useMemo(() => Object.values(Department).map(d => ({ name: d, count: filteredRequests.filter(r => r.department === d).length })), [filteredRequests]);
  const COLORS = ['#187444', '#F9C912', '#D5C744', '#000000', '#64748b'];

  return (
    <div className="space-y-10 fade-in pb-20">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-black tracking-tight leading-tight">Reports Hub</h1>
          <p className="text-gray-500 font-bold text-sm mt-1.5 uppercase tracking-wide">Division Intelligence Analytics</p>
        </div>
        <button onClick={handleExportCSV} className="px-8 py-4 bg-[#187444] text-white font-black rounded-3xl text-[11px] uppercase tracking-widest shadow-xl shadow-[#187444]/20 active:scale-95 transition-all">Export Current Dataset</button>
      </header>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm flex flex-wrap gap-8 items-end border border-gray-50">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Node Selection</label>
          <select className="w-full text-xs font-bold uppercase" value={filterBranch} onChange={e => setFilterBranch(e.target.value)}>
            <option value="ALL">All Network Nodes</option>
            {Object.values(Branch).map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Division Filter</label>
          <select className="w-full text-xs font-bold uppercase" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
            <option value="ALL">All Divisions</option>
            {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px] grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Period Start</label>
            <input type="date" className="w-full text-xs font-bold" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Period End</label>
            <input type="date" className="w-full text-xs font-bold" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[2.5rem] border border-gray-50 shadow-sm h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
              <Bar dataKey="count" fill="#187444" radius={[6,6,0,0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-10 rounded-[2.5rem] border border-gray-50 shadow-sm flex flex-col justify-center">
          <div className="grid grid-cols-2 gap-6">
            {deptData.filter(d => d.count > 0).map((d, i) => (
              <div key={d.name} className={`p-6 rounded-3xl border ${filterBranch !== 'ALL' && filterBranch === currentUser.branch ? 'bg-[#187444]/5 border-[#187444]/10' : 'bg-gray-50 border-gray-100'}`}>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{d.name}</p>
                <p className="text-3xl font-black text-black">{d.count}</p>
                <p className={`text-[9px] font-bold uppercase tracking-wide mt-2 ${filterBranch === currentUser.branch ? 'text-[#187444]' : 'text-gray-400'}`}>Node Claims</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
