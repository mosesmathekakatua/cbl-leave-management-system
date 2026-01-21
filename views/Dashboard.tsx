
import React from 'react';
import { useStore } from '../store';
import { LeaveType, LeaveStatus, UserRole } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Dashboard: React.FC = () => {
  const { state, dispatch } = useStore();
  const user = state.currentUser!;

  const userRequests = state.requests.filter(r => r.userId === user.id);
  const myNotifications = state.notifications.filter(n => n.userId === user.id);
  
  const chartData = Object.entries(user.balances).map(([type, value]) => ({
    name: type.replace(' Leave', ''),
    remaining: value,
    color: (value as number) < 5 ? '#F9C912' : '#187444'
  }));

  const getStatusColor = (status: LeaveStatus) => {
    switch (status) {
      case LeaveStatus.APPROVED: return 'bg-[#187444]/10 text-[#187444] border-[#187444]/20';
      case LeaveStatus.REJECTED: return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-[#F9C912]/10 text-[#713f12] border-[#F9C912]/20';
    }
  };

  const exportSummary = () => {
    const headers = ["ID", "Category", "Status", "Start", "End", "Days", "Reason"];
    const rows = userRequests.map(r => [r.id, r.type, r.status, r.startDate, r.endDate, r.dates.length, `"${r.reason.replace(/"/g, '""')}"`]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.body.appendChild(document.createElement("a"));
    link.href = URL.createObjectURL(blob);
    link.download = `CBL_Leave_Summary_${user.name}.csv`;
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-10 fade-in pb-10">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-black tracking-tighter leading-tight uppercase">Dashboard</h1>
          <p className="text-gray-500 font-bold text-sm mt-1.5 uppercase tracking-widest">{user.name} • {user.branch}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportSummary} className="px-8 py-4 bg-white text-black font-black rounded-3xl text-[11px] border-2 border-gray-100 hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-4 uppercase tracking-[0.2em]">
            <span className="text-lg">📥</span> Download Summary
          </button>
        </div>
      </header>

      {myNotifications.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">System Alerts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myNotifications.slice(0, 4).map(n => (
              <div key={n.id} className="bg-white p-5 rounded-3xl border border-[#187444]/10 shadow-sm flex justify-between items-center animate-in slide-in-from-right-4">
                <div className="flex items-center gap-4">
                  <span className="w-2 h-2 bg-[#187444] rounded-full animate-pulse" />
                  <p className="text-[11px] font-bold text-gray-700 uppercase leading-relaxed">{n.message}</p>
                </div>
                <button onClick={() => dispatch({ type: 'CLEAR_NOTIFICATION', notificationId: n.id })} className="text-gray-300 hover:text-rose-500 transition-colors">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(user.balances).map(([type, balance]) => (
          <div key={type} className="bg-white p-8 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all group border border-gray-50">
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none">{type}</span>
              <span className="text-2xl group-hover:scale-110 transition-transform">
                {type === LeaveType.ANNUAL ? '🌴' : type === LeaveType.SICK ? '🏥' : '🍼'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-5xl font-black tracking-tighter ${(balance as number) < 5 ? 'text-[#F9C912]' : 'text-black'}`}>{balance}</span>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Days Remaining</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-sm border border-gray-50">
          <h3 className="text-sm font-black text-black mb-12 uppercase tracking-widest flex items-center gap-4">
            <span className="w-10 h-10 bg-[#187444]/5 flex items-center justify-center rounded-2xl text-[#187444]">📊</span> Allocation Mapping
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '20px', border: 'none', backgroundColor: '#187444', color: '#ffffff', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }} />
                <Bar dataKey="remaining" radius={[12, 12, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-sm flex flex-col border border-gray-50">
          <h3 className="text-sm font-black text-black mb-12 uppercase tracking-widest flex items-center gap-4">
            <span className="w-10 h-10 bg-[#F9C912]/10 flex items-center justify-center rounded-2xl text-[#713f12]">📜</span> Recent History
          </h3>
          <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {userRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-4 opacity-40">
                <span className="text-6xl">📭</span>
                <p className="text-[10px] font-black uppercase tracking-widest">Roster Empty</p>
              </div>
            ) : (
              userRequests.slice(0, 10).map(r => (
                <div key={r.id} className="group border-b border-gray-50 pb-6 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-[13px] font-black text-black group-hover:text-[#187444] transition-colors uppercase tracking-tight">{r.type}</p>
                    <span className={`text-[8px] px-2.5 py-1 rounded-lg font-black uppercase border ${getStatusColor(r.status)}`}>
                      {r.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    <span>{new Date(r.startDate).toLocaleDateString()}</span>
                    <span className="opacity-30">→</span>
                    <span>{r.dates.length} Days</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
