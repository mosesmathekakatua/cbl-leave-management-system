
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { LeaveStatus, UserRole, User, LeaveRequest, Department, Branch, LeaveType } from '../types';
import { LEAVE_LIMITS } from '../constants';

const DateEditorModal: React.FC<{ request: LeaveRequest, onClose: () => void }> = ({ request, onClose }) => {
  const { dispatch } = useStore();
  const [dates, setDates] = useState<string[]>(request.dates);
  const [newDate, setNewDate] = useState('');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0,0,0,0);
  const minDateString = tomorrow.toISOString().split('T')[0];

  const handleSave = () => {
    if (dates.length === 0) return;
    dispatch({ type: 'UPDATE_REQUEST_DATES', requestId: request.id, dates });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-gray-50 bg-gray-50/50">
          <h2 className="text-xl font-black text-black uppercase tracking-tighter">Adjust Leave Roster</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Window Modification: {request.userName}</p>
        </div>
        <div className="p-8 space-y-6">
          <div className="flex gap-2">
            <input 
              type="date" 
              min={minDateString} 
              className="flex-1 text-sm font-bold" 
              value={newDate} 
              onChange={e => setNewDate(e.target.value)} 
            />
            <button 
              onClick={() => { if(newDate && !dates.includes(newDate)) { setDates([...dates, newDate].sort()); setNewDate(''); } }} 
              className="px-6 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2 p-5 bg-gray-50 rounded-3xl border border-gray-100 max-h-40 overflow-y-auto">
            {dates.map(d => (
              <div key={d} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm">
                <span className="text-[10px] font-bold">{new Date(d).toLocaleDateString()}</span>
                <button onClick={() => setDates(dates.filter(item => item !== d))} className="text-rose-500 hover:text-rose-600 font-bold">✕</button>
              </div>
            ))}
          </div>
          <div className="flex gap-4 pt-4">
            <button onClick={onClose} className="flex-1 py-4 text-[11px] font-black text-gray-400 uppercase">Cancel</button>
            <button onClick={handleSave} className="flex-1 py-4 bg-[#187444] text-white text-[11px] font-black rounded-2xl shadow-xl shadow-[#187444]/20 uppercase tracking-widest">Commit Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserManagementModal: React.FC<{ user?: User, onClose: () => void, currentUser: User }> = ({ user, onClose, currentUser }) => {
  const { state, dispatch } = useStore();
  const [name, setName] = useState(user?.name || '');
  const [pin, setPin] = useState(user?.pin || '');
  const [role, setRole] = useState<UserRole>(user?.role || UserRole.STAFF);
  const [dept, setDept] = useState<Department>(user?.department || Department.IT);
  
  const isBranchManager = currentUser.role === UserRole.BRANCH_MANAGER;
  const initialBranch = user?.branch || (isBranchManager ? currentUser.branch : Branch.GODOWN_HQ);
  const [branch, setBranch] = useState<Branch>(initialBranch);
  const [balances, setBalances] = useState<Record<LeaveType, number>>(user?.balances || { ...LEAVE_LIMITS });

  const isGlobalManager = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.OPERATIONS_MANAGER;

  const allowedRoles = useMemo(() => {
    const roles = [UserRole.STAFF];
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      roles.push(UserRole.OPERATIONS_MANAGER, UserRole.BRANCH_MANAGER);
    } else if (currentUser.role === UserRole.OPERATIONS_MANAGER) {
      roles.push(UserRole.BRANCH_MANAGER);
    }
    return roles;
  }, [currentUser]);

  const handleSave = () => {
    if (!name.trim() || pin.length !== 4) return alert("Validation: Full Name and 4-digit PIN required.");
    
    if (user?.role === UserRole.SUPER_ADMIN && currentUser.role === UserRole.OPERATIONS_MANAGER) {
      return alert("Authority Violation: Operational Manager cannot modify Administrative records.");
    }

    const data: User = { 
      id: user?.id || `u${Date.now()}`, 
      name: name.trim(), pin, role, department: dept, branch, 
      isActive: user?.isActive ?? true, 
      isApproved: user?.isApproved ?? true, 
      isBlocked: false, failedAttempts: 0, 
      balances: balances
    };

    if (user) dispatch({ type: 'UPDATE_USER', user: data });
    else dispatch({ type: 'REGISTER', user: data });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden p-12 my-10 space-y-8">
        <h2 className="text-2xl font-black uppercase text-center tracking-tighter">Personnel Registry</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Registry Name</label>
            <input className="w-full font-bold" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Security PIN</label>
            <input maxLength={4} className="w-full text-center tracking-[1em] font-black text-lg" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g,''))} />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Command Role</label>
            <select className="w-full font-bold uppercase text-[12px]" value={role} onChange={e => setRole(e.target.value as UserRole)}>
              {allowedRoles.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Assigned Branch</label>
            <select 
              disabled={isBranchManager || !isGlobalManager} 
              className={`w-full font-bold uppercase text-[12px] ${isBranchManager ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`} 
              value={branch} 
              onChange={e => setBranch(e.target.value as Branch)}
            >
              {Object.values(Branch).map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Division</label>
            <select className="w-full font-bold uppercase text-[12px]" value={dept} onChange={e => setDept(e.target.value as Department)}>
              {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div className="pt-6 border-t border-gray-100">
           <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Leave Quota (Remaining Days)</h3>
           <div className="grid grid-cols-2 gap-4">
             {Object.entries(balances).map(([type, val]) => (
               <div key={type}>
                 <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">{type}</label>
                 <input type="number" min="0" className="w-full py-2 text-sm font-black" value={val} onChange={e => setBalances({...balances, [type]: parseInt(e.target.value) || 0})} />
               </div>
             ))}
           </div>
        </div>
        <div className="flex gap-4 pt-6">
          <button onClick={onClose} className="flex-1 py-5 text-gray-400 font-black uppercase tracking-widest text-[11px]">Cancel</button>
          <button onClick={handleSave} className="flex-1 py-5 bg-[#187444] text-white font-black rounded-2xl uppercase tracking-widest text-[11px] shadow-2xl">Save Protocol</button>
        </div>
      </div>
    </div>
  );
};

const AdminPanel: React.FC = () => {
  const { state, dispatch } = useStore();
  const [activeTab, setActiveTab] = useState<'LEAVE' | 'STAFF' | 'RESETS' | 'UPCOMING'>('LEAVE');
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState<Branch | 'ALL'>('ALL');
  const [upcomingFilter, setUpcomingFilter] = useState<'WEEK' | 'MONTH'>('WEEK');
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [managingUser, setManagingUser] = useState<User | null>(null);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  
  const currentUser = state.currentUser!;
  const isGlobal = currentUser.role === UserRole.SUPER_ADMIN || currentUser.role === UserRole.OPERATIONS_MANAGER;

  const myNotifications = state.notifications.filter(n => n.userId === currentUser.id);

  const canManageRequest = (r: LeaveRequest) => {
    if (r.userId === currentUser.id) return false;
    if (currentUser.role === UserRole.SUPER_ADMIN) return true;
    if (currentUser.role === UserRole.OPERATIONS_MANAGER) return true;
    if (currentUser.role === UserRole.BRANCH_MANAGER) {
      return r.branch === currentUser.branch;
    }
    return false;
  };

  const handleApprove = (id: string) => {
    dispatch({ type: 'UPDATE_REQUEST_STATUS', requestId: id, status: LeaveStatus.APPROVED });
  };

  const handleReject = (r: LeaveRequest) => {
    const isAlreadyApproved = r.status === LeaveStatus.APPROVED;
    const promptMessage = isAlreadyApproved 
      ? "Revoke already approved leave? The allocated days will be refunded to the employee's balance." 
      : "Reject this leave application?";
    
    if (window.confirm(promptMessage)) {
      dispatch({ type: 'UPDATE_REQUEST_STATUS', requestId: r.id, status: LeaveStatus.REJECTED });
    }
  };

  const filteredRequests = useMemo(() => {
    return state.requests.filter(r => {
      const bMatch = branchFilter === 'ALL' || r.branch === branchFilter;
      return bMatch && r.userName.toLowerCase().includes(search.toLowerCase());
    });
  }, [state.requests, branchFilter, search]);

  const filteredStaff = useMemo(() => {
    return state.users.filter(u => {
      if (u.id === currentUser.id) return false;
      const bMatch = branchFilter === 'ALL' || u.branch === branchFilter;
      return bMatch && u.name.toLowerCase().includes(search.toLowerCase());
    });
  }, [state.users, branchFilter, search, currentUser.id]);

  const manageablePending = filteredRequests.filter(r => r.status === LeaveStatus.PENDING && canManageRequest(r));
  const resetRequests = state.resetRequests.filter(r => r.status === 'PENDING');

  // Fix: Explicitly type the list to include optional count property to avoid TS errors
  const tabs = useMemo(() => {
    const list: { id: string; label: string; count?: number }[] = [
      { id: 'LEAVE', label: 'Roster' },
      { id: 'STAFF', label: 'Personnel' },
      { id: 'UPCOMING', label: 'Forecast' }
    ];
    if (isGlobal) {
      list.push({ id: 'RESETS', label: 'Resets', count: resetRequests.length });
    }
    return list;
  }, [isGlobal, resetRequests.length]);

  return (
    <div className="space-y-10 fade-in pb-12">
      <header className="flex flex-col lg:flex-row justify-between items-center gap-8">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Command Hub</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">Personnel Management & Oversight</p>
        </div>
        <div className="flex bg-white p-2 rounded-3xl shadow-sm border border-gray-100 overflow-x-auto max-w-full">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`relative px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === tab.id ? 'tab-active' : 'text-gray-400'}`}>
              {tab.label} {tab.count ? <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px] animate-pulse">{tab.count}</span> : null}
            </button>
          ))}
        </div>
      </header>

      {myNotifications.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">System Alerts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myNotifications.slice(0, 4).map(n => (
              <div key={n.id} className="bg-white p-5 rounded-3xl border border-[#187444]/10 shadow-sm flex justify-between items-center animate-in slide-in-from-right-4">
                <div className="flex items-center gap-4">
                  <span className={`w-2 h-2 rounded-full animate-pulse ${n.message.includes('Security Alert') ? 'bg-rose-500' : 'bg-[#F9C912]'}`} />
                  <p className="text-[11px] font-bold text-gray-700 uppercase leading-relaxed">{n.message}</p>
                </div>
                <button onClick={() => dispatch({ type: 'CLEAR_NOTIFICATION', notificationId: n.id })} className="text-gray-300 hover:text-rose-500 transition-colors">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-5">
        <div className="flex-1 relative">
           <input className="w-full pl-14 py-5" placeholder="Search Global Records..." value={search} onChange={e => setSearch(e.target.value)} />
           <span className="absolute left-6 top-1/2 -translate-y-1/2 opacity-20 text-xl">🔍</span>
        </div>
        <select className="px-8 py-5 rounded-3xl bg-white shadow-sm font-black uppercase text-[10px] tracking-widest border-gray-50" value={branchFilter} onChange={e => setBranchFilter(e.target.value as Branch | 'ALL')}>
           <option value="ALL">Global View</option>
           {Object.values(Branch).map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <button onClick={() => setIsAddingUser(true)} className="px-10 py-5 bg-black text-white rounded-3xl uppercase font-black text-[10px] tracking-[0.2em] shadow-2xl hover:bg-gray-900 transition-all">Enroll Staff</button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-50 overflow-hidden min-h-[400px]">
        {activeTab === 'LEAVE' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="px-6 py-8 text-center w-12">
                     <input type="checkbox" className="w-5 h-5 accent-[#187444]" checked={manageablePending.length > 0 && selectedRequestIds.length === manageablePending.length} onChange={() => setSelectedRequestIds(selectedRequestIds.length > 0 ? [] : manageablePending.map(r => r.id))} />
                  </th>
                  <th className="px-10 py-8">Employee</th>
                  <th className="px-10 py-8">Application Detail</th>
                  <th className="px-10 py-8 text-center">Status</th>
                  <th className="px-10 py-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRequests.map(r => {
                  const manageable = canManageRequest(r);
                  return (
                    <tr key={r.id} className={`hover:bg-gray-50/50 transition-all ${!manageable ? 'opacity-60 bg-gray-50/10' : ''}`}>
                      <td className="px-6 py-8 text-center">
                        {r.status === LeaveStatus.PENDING && manageable && (
                           <input type="checkbox" className="w-5 h-5 accent-[#187444]" checked={selectedRequestIds.includes(r.id)} onChange={() => setSelectedRequestIds(prev => prev.includes(r.id) ? prev.filter(id => id !== r.id) : [...prev, r.id])} />
                        )}
                      </td>
                      <td className="px-10 py-8">
                        <p className="font-extrabold text-sm">{r.userName}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">{r.branch} • {r.department}</p>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold">{r.type}</p>
                          {manageable && r.status === LeaveStatus.PENDING && (
                            <button onClick={() => setEditingRequest(r)} className="text-[8px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md uppercase hover:bg-emerald-200">Reschedule</button>
                          )}
                        </div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">{r.dates.length} Days • {new Date(r.startDate).toLocaleDateString()} Start</p>
                      </td>
                      <td className="px-10 py-8 text-center">
                        <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border ${r.status === LeaveStatus.APPROVED ? 'bg-[#187444]/10 text-[#187444] border-[#187444]/20' : r.status === LeaveStatus.REJECTED ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-[#F9C912]/10 text-[#713f12] border-[#F9C912]/20'}`}>{r.status}</span>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <div className="flex justify-end gap-3">
                          {r.status === LeaveStatus.PENDING && manageable && (
                             <button onClick={() => handleApprove(r.id)} title="Approve Leave" className="w-11 h-11 bg-[#187444] text-white rounded-2xl flex items-center justify-center font-bold shadow-lg shadow-[#187444]/20 hover:scale-105 active:scale-90 transition-all">✓</button>
                          )}
                          {r.status !== LeaveStatus.REJECTED && manageable && (
                             <button 
                               onClick={() => handleReject(r)} 
                               title={r.status === LeaveStatus.APPROVED ? "Revoke Leave" : "Reject Leave"}
                               className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold hover:scale-105 active:scale-90 transition-all ${r.status === LeaveStatus.APPROVED ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-white text-rose-500 border border-rose-100'}`}
                             >
                               ✕
                             </button>
                          )}
                          {!manageable && <span className="text-[9px] font-black text-gray-300 uppercase italic">Locked</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'STAFF' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-50"><th className="px-12 py-8">Personnel</th><th className="px-12 py-8">Command Authority</th><th className="px-12 py-8 text-right">Registry Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredStaff.map(u => {
                  const isImmune = u.role === UserRole.SUPER_ADMIN;
                  const canEditStaff = isGlobal || (currentUser.role === UserRole.BRANCH_MANAGER && u.branch === currentUser.branch);

                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50 group">
                      <td className="px-12 py-8 flex items-center gap-5">
                         <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center font-black text-[#187444] group-hover:bg-[#F9C912]/20 transition-all">{u.name[0]}</div>
                         <div>
                           <p className="font-extrabold text-sm">{u.name}</p>
                           <p className="text-[9px] font-bold text-gray-400 uppercase">{u.branch} • {u.department}</p>
                         </div>
                      </td>
                      <td className="px-12 py-8 text-[10px] font-black uppercase text-gray-400">{u.role.replace('_', ' ')}</td>
                      <td className="px-12 py-8 text-right">
                         {!isImmune && canEditStaff ? (
                           <div className="flex justify-end gap-4 items-center">
                             {!u.isApproved ? (
                               <button onClick={() => dispatch({ type: 'APPROVE_USER', userId: u.id })} className="px-5 py-2.5 bg-[#187444] text-white text-[9px] font-black uppercase rounded-xl shadow-lg">Authorize</button>
                             ) : (
                               <>
                                 <button onClick={() => setManagingUser(u)} className="text-[10px] font-black text-[#187444] uppercase tracking-widest hover:underline">Modify</button>
                                 <button onClick={() => confirm(`Permanently terminate ${u.name}?`) && dispatch({ type: 'DELETE_USER', userId: u.id })} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline">Terminate</button>
                               </>
                             )}
                           </div>
                         ) : <span className="text-[9px] font-black text-gray-300 uppercase italic">Protected</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'RESETS' && isGlobal && (
          <div className="p-10 space-y-8">
             <h3 className="text-lg font-black uppercase tracking-tighter">Credential Recovery Queue</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {resetRequests.length === 0 ? (
                 <p className="py-20 text-center text-gray-300 font-black uppercase tracking-[0.2em] italic text-xs w-full col-span-2">No Pending Resets</p>
               ) : resetRequests.map(r => (
                 <div key={r.id} className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 flex justify-between items-center shadow-sm">
                    <div>
                      <p className="font-black uppercase text-sm tracking-tight">{r.userName}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{r.department}</p>
                    </div>
                    <div className="flex gap-3">
                       <button onClick={() => {
                          const user = state.users.find(u => u.name.toLowerCase() === r.userName.toLowerCase());
                          if (user) {
                             dispatch({ type: 'ADMIN_RESET_PIN', userId: user.id, tempPin: '0000' });
                             dispatch({ type: 'DISMISS_RESET_REQUEST', requestId: r.id });
                             alert(`Issued temporary PIN: 0000 to ${r.userName}. Change required on login.`);
                          } else {
                            alert("Profile search failed for this request.");
                          }
                       }} className="px-6 py-3 bg-[#187444] text-white text-[10px] font-black uppercase rounded-xl tracking-widest shadow-lg shadow-[#187444]/20 active:scale-95 transition-all">Issue Temp PIN</button>
                       <button onClick={() => dispatch({ type: 'DISMISS_RESET_REQUEST', requestId: r.id })} className="text-gray-300 hover:text-rose-500 transition-colors">✕</button>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {activeTab === 'UPCOMING' && (
          <div className="p-10 space-y-8">
            <div className="flex justify-between items-center bg-gray-50 p-6 rounded-[2rem]">
               <h3 className="text-sm font-black uppercase tracking-widest">Absence Forecast</h3>
               <select className="px-6 py-2 bg-white rounded-xl text-[10px] font-black uppercase" value={upcomingFilter} onChange={e => setUpcomingFilter(e.target.value as any)}>
                 <option value="WEEK">Next 7 Days</option>
                 <option value="MONTH">Next 30 Days</option>
               </select>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead>
                   <tr className="border-b border-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                     <th className="pb-4">Staff Member</th>
                     <th className="pb-4">Branch Node</th>
                     <th className="pb-4">Window</th>
                     <th className="pb-4 text-right">Total Days</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                   {state.requests
                    .filter(r => r.status === LeaveStatus.APPROVED)
                    .filter(r => {
                      const today = new Date();
                      today.setHours(0,0,0,0);
                      const start = new Date(r.startDate);
                      const limit = new Date(today);
                      if (upcomingFilter === 'WEEK') limit.setDate(today.getDate() + 7);
                      else limit.setMonth(today.getMonth() + 1);
                      return start >= today && start <= limit;
                    })
                    .sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                    .map(r => (
                     <tr key={r.id}>
                       <td className="py-5">
                         <p className="font-extrabold text-sm">{r.userName}</p>
                         <p className="text-[9px] font-bold text-gray-400 uppercase">{r.department}</p>
                       </td>
                       <td className="py-5 text-xs font-bold text-gray-600 uppercase tracking-tight">{r.branch}</td>
                       <td className="py-5 text-xs font-bold text-[#187444]">{new Date(r.startDate).toLocaleDateString()} — {new Date(r.endDate).toLocaleDateString()}</td>
                       <td className="py-5 text-right font-black text-black">{r.dates.length}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}
      </div>

      {(managingUser || isAddingUser) && (
        <UserManagementModal user={managingUser || undefined} onClose={() => { setManagingUser(null); setIsAddingUser(false); }} currentUser={currentUser} />
      )}
      {editingRequest && <DateEditorModal request={editingRequest} onClose={() => setEditingRequest(null)} />}
    </div>
  );
};

export default AdminPanel;
