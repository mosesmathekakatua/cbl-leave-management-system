
import React, { useState } from 'react';
import { StoreProvider, useStore } from './store';
import { UserRole, User, Department, Branch, LeaveStatus } from './types';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import AdminPanel from './views/AdminPanel';
import LeaveForm from './components/LeaveForm';
import Reports from './views/Reports';
import AuditTrail from './views/AuditTrail';
import DeptCalendar from './views/DeptCalendar';
import SessionTimeoutManager from './components/SessionTimeoutManager';
import Logo from './components/Logo';
import ProfileSettings from './views/ProfileSettings';
import { LEAVE_LIMITS } from './constants';

const PasswordRecoveryView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { state, dispatch } = useStore();
  const [name, setName] = useState('');
  const [dept, setDept] = useState(Department.IT);
  const [submitted, setSubmitted] = useState(false);
  const [recoveryType, setRecoveryType] = useState<'ADMIN' | 'EMAIL' | null>(null);

  const SUPER_ADMIN_NAME = 'CBL Chief Admin';
  const SUPER_ADMIN_EMAIL = 'mosesmathekakatua@gmail.com';

  const handleIdentityCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().toLowerCase() === SUPER_ADMIN_NAME.toLowerCase()) {
      setRecoveryType('EMAIL');
    } else {
      setRecoveryType('ADMIN');
    }
  };

  const handleFinalSubmit = () => {
    if (recoveryType === 'EMAIL') {
      // Simulate secure email dispatch to Super Admin
      console.log(`Sending reset link to ${SUPER_ADMIN_EMAIL}`);
    } else {
      dispatch({ type: 'SUBMIT_RESET_REQUEST', name, department: dept });
    }
    setSubmitted(true);
    setTimeout(onBack, 6000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EAE8DA] p-6">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-10 text-center border border-gray-100 animate-in fade-in duration-500">
        {submitted ? (
          <div className="space-y-6 py-4">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto shadow-sm animate-bounce">
              {recoveryType === 'EMAIL' ? '📧' : '📩'}
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight">Recovery Protocol Active</h2>
            <p className="text-[11px] font-bold text-gray-400 uppercase leading-relaxed tracking-widest px-4">
              {recoveryType === 'EMAIL' 
                ? `A security bypass link has been transmitted to ${SUPER_ADMIN_EMAIL}. Access your inbox to verify identity.`
                : `Your recovery request has been logged. Contact your direct supervisor at CBL HQ for your temporary 4-digit PIN.`}
            </p>
            <div className="pt-4">
              <button onClick={onBack} className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline">Return to Login</button>
            </div>
          </div>
        ) : !recoveryType ? (
          <form onSubmit={handleIdentityCheck} className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-xl font-black uppercase tracking-tight">Identify Profile</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Enter registry name to determine recovery route</p>
            </div>
            <div className="text-left">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Official Registry Name</label>
              <input required className="w-full font-bold" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Doe" />
            </div>
            <button type="submit" className="w-full py-5 bg-black text-white font-black rounded-2xl uppercase tracking-widest shadow-xl transition-all active:scale-[0.98]">Analyze Profile</button>
            <button type="button" onClick={onBack} className="text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-gray-500">Cancel</button>
          </form>
        ) : (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h2 className="text-xl font-black uppercase tracking-tight">Verification Required</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {recoveryType === 'EMAIL' ? 'Administrative Access Detected' : 'Standard Personnel Path'}
              </p>
            </div>
            
            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 text-left space-y-4">
              {recoveryType === 'EMAIL' ? (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Super Admin Recovery</p>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-emerald-100">
                    <span className="text-lg">🔐</span>
                    <span className="text-[11px] font-bold text-gray-600 truncate">{SUPER_ADMIN_EMAIL}</span>
                  </div>
                  <p className="text-[9px] font-medium text-gray-400 italic">"The system will dispatch a unique reset token to this encrypted address."</p>
                </div>
              ) : (
                <div className="space-y-3">
                   <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Division Authentication</p>
                   <select className="w-full font-bold uppercase text-xs" value={dept} onChange={e => setDept(e.target.value as Department)}>
                      {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
                   </select>
                   <p className="text-[9px] font-medium text-gray-400 italic">"Request will be routed to the Command Hub for manual authorization."</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={handleFinalSubmit} 
                className={`w-full py-5 text-white font-black rounded-2xl uppercase tracking-widest shadow-xl transition-all active:scale-[0.98] ${recoveryType === 'EMAIL' ? 'bg-emerald-600 shadow-emerald-100' : 'bg-[#187444] shadow-green-100'}`}
              >
                {recoveryType === 'EMAIL' ? 'Send Recovery Email' : 'Submit Reset Request'}
              </button>
              <button type="button" onClick={() => setRecoveryType(null)} className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Back</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const LoginView: React.FC<{ onRegister: () => void, onForgot: () => void }> = ({ onRegister, onForgot }) => {
  const { state, dispatch } = useStore();
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = state.users.find(u => u.name.toLowerCase() === name.trim().toLowerCase());
    
    if (!user) {
      setError("Identity Error: Profile not found.");
      return;
    }
    if (user.isBlocked) {
      setError("Security Lock: Account blocked.");
      return;
    }
    if (!user.isApproved) {
      setError("Pending Authorization.");
      return;
    }

    if (user.pin === pin) {
      dispatch({ type: 'LOGIN', user });
    } else {
      setError("Authentication Failure.");
      dispatch({ type: 'RECORD_FAILED_ATTEMPT', name });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EAE8DA] p-6">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 fade-in">
        <div className="p-12 text-center">
          <Logo size="w-24 h-24" className="mx-auto mb-6" />
          <div className="mb-10">
            <h1 className="text-2xl font-black uppercase tracking-tighter text-black leading-none mb-2">Commercial Builders Ltd</h1>
            <p className="text-[11px] font-black text-[#187444] uppercase tracking-[0.3em] mb-1">Construction Simplified</p>
            <p className="text-[10px] font-bold text-[#F9C912] uppercase tracking-[0.2em]">Leave Management System</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6 text-left">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Registry Name</label>
              <input required className="w-full font-bold" placeholder="Official Identity" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Security PIN</label>
              <input type="password" required className="w-full font-black tracking-[1em] text-center" placeholder="••••" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g,''))} />
            </div>
            <button type="submit" className="w-full py-4 bg-[#187444] text-white font-black rounded-2xl uppercase shadow-xl transition-all hover:opacity-90 active:scale-[0.98]">Verify & Enter</button>
            {error && <p className="text-[10px] font-black text-rose-600 uppercase text-center mt-4">{error}</p>}
          </form>

          <div className="mt-8 flex flex-col gap-4">
            <button onClick={onForgot} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-[#187444] transition-colors">Forgot Security PIN?</button>
            <div className="h-px bg-gray-50 w-full" />
            <button onClick={onRegister} className="text-[10px] font-black text-[#713f12] uppercase tracking-widest hover:text-black transition-colors">Enroll New Staff Account</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ForceChangePinView: React.FC = () => {
  const { state, dispatch } = useStore();
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleUpdate = () => {
    if (pin.length !== 4 || pin !== confirm) return alert("Validation Error: PINs must match and be exactly 4 digits.");
    dispatch({ type: 'UPDATE_SELF', name: state.currentUser!.name, pin });
  };

  return (
    <div className="fixed inset-0 z-[300] bg-emerald-950/90 backdrop-blur-xl flex items-center justify-center p-6">
      <div className="bg-white w-full max-sm rounded-[3rem] p-10 text-center shadow-2xl animate-in zoom-in-95 duration-500">
        <span className="text-4xl block mb-6">🛡️</span>
        <h2 className="text-xl font-black uppercase mb-4 tracking-tight">Security Protocol Override</h2>
        <p className="text-[10px] font-bold text-gray-400 uppercase mb-8 leading-relaxed">System detected a temporary credential. Define a new unique 4-digit PIN to continue.</p>
        <div className="space-y-4 mb-10">
          <input type="password" placeholder="NEW PIN" maxLength={4} className="w-full text-center tracking-[1em] font-black bg-gray-50" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g,''))} />
          <input type="password" placeholder="CONFIRM PIN" maxLength={4} className="w-full text-center tracking-[1em] font-black bg-gray-50" value={confirm} onChange={e => setConfirm(e.target.value.replace(/\D/g,''))} />
        </div>
        <button onClick={handleUpdate} className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all">Secure Account</button>
      </div>
    </div>
  );
};

const RegistrationView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { state, dispatch } = useStore();
  const [formData, setFormData] = useState({ name: '', branch: Branch.GODOWN_HQ, dept: Department.STORES, pin: '', confirm: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.pin.length !== 4 || formData.pin !== formData.confirm) {
      setError("Validation Error: PIN mismatch.");
      return;
    }

    const newUser: User = {
      id: `staff-${Date.now()}`,
      name: formData.name.trim(),
      role: UserRole.STAFF, 
      department: formData.dept,
      branch: formData.branch,
      isActive: false,
      isApproved: false,
      isBlocked: false,
      pin: formData.pin,
      failedAttempts: 0,
      balances: { ...LEAVE_LIMITS }
    };

    dispatch({ type: 'REGISTER', user: newUser });
    setSuccess(true);
    setTimeout(onBack, 3500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EAE8DA] p-6">
      <div className="w-full max-w-2xl bg-white rounded-[3.5rem] shadow-2xl p-12 border border-gray-100 fade-in duration-500">
        {success ? (
          <div className="py-12 text-center animate-in zoom-in-95">
            <span className="text-6xl block mb-6">🤝</span>
            <p className="text-xl font-black text-[#187444] uppercase mb-2">Enrollment Transmitted</p>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Profile submitted for administrative authorization.</p>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2 text-center mb-6">
              <Logo size="w-16 h-16" className="mx-auto mb-4" />
              <h2 className="text-xl font-black uppercase tracking-tight text-black mb-1">Commercial Builders Ltd</h2>
              <p className="text-[10px] font-black text-[#187444] uppercase tracking-[0.3em] mb-1">Construction Simplified</p>
              <p className="text-[9px] font-bold text-[#F9C912] uppercase tracking-[0.2em]">Leave Management System</p>
            </div>
            <div className="md:col-span-2 text-left">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Official Full Name</label>
              <input required className="w-full font-bold" placeholder="Legal Identity" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="text-left">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Branch Node</label>
              <select className="w-full font-bold uppercase text-[12px]" value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value as Branch})}>
                 {Object.values(Branch).map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="text-left">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Department</label>
              <select className="w-full font-bold uppercase text-[12px]" value={formData.dept} onChange={e => setFormData({...formData, dept: e.target.value as Department})}>
                 {Object.values(Department).filter(d => d !== Department.MANAGEMENT).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="text-left">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Secure PIN</label>
              <input type="password" required placeholder="••••" className="w-full text-center tracking-[1em] font-black" maxLength={4} value={formData.pin} onChange={e => setFormData({...formData, pin: e.target.value.replace(/\D/g,'')})} />
            </div>
            <div className="text-left">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Verify PIN</label>
              <input type="password" required placeholder="••••" className="w-full text-center tracking-[1em] font-black" maxLength={4} value={formData.confirm} onChange={e => setFormData({...formData, confirm: e.target.value.replace(/\D/g,'')})} />
            </div>
            <div className="md:col-span-2 flex flex-col gap-6 mt-6">
              <button type="submit" className="w-full py-5 bg-[#187444] text-white font-black rounded-2xl uppercase shadow-xl transition-all hover:opacity-95 active:scale-[0.98]">Request Infrastructure Access</button>
              {error && <p className="text-[11px] font-black text-rose-600 text-center uppercase tracking-widest">{error}</p>}
              <button type="button" onClick={onBack} className="text-[11px] font-black text-gray-300 uppercase tracking-widest hover:text-gray-500 transition-colors">Abort Enrollment</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const MainApp: React.FC = () => {
  const { state } = useStore();
  const [view, setView] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>('LOGIN');
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!state.currentUser) {
    if (view === 'REGISTER') return <RegistrationView onBack={() => setView('LOGIN')} />;
    if (view === 'FORGOT') return <PasswordRecoveryView onBack={() => setView('LOGIN')} />;
    return <LoginView onRegister={() => setView('REGISTER')} onForgot={() => setView('FORGOT')} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return state.currentUser!.role === UserRole.STAFF ? <Dashboard /> : <AdminPanel />;
      case 'calendar': return <DeptCalendar />;
      case 'apply': return <div className="bg-white p-12 rounded-[3.5rem] shadow-sm"><LeaveForm onSuccess={() => setActiveTab('dashboard')} /></div>;
      case 'reports': return <Reports />;
      case 'audit': return <AuditTrail />;
      case 'profile': return <ProfileSettings />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <SessionTimeoutManager />
      {state.currentUser.mustChangePin && <ForceChangePinView />}
      {renderContent()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <MainApp />
    </StoreProvider>
  );
};

export default App;
