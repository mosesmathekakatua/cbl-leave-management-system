import React, { useState } from 'react';
import { StoreProvider, useStore } from './store';
import { UserRole, User, Department, Branch, LeaveStatus, LeaveType } from './types';
import { LEAVE_LIMITS } from './constants';
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

const LoginView: React.FC<{ onRegister: () => void, onForgot: () => void }> = ({ onRegister, onForgot }) => {
  const { state, dispatch } = useStore();
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError(null);

    // Helper to attempt a local login if cloud fails
    const attemptLocalFallback = () => {
      const localUser = state.users.find(u => 
        u.name.toLowerCase().trim() === name.toLowerCase().trim() && 
        u.pin === pin
      );
      
      if (localUser) {
        console.info("Authenticated via local fallback.");
        dispatch({ type: 'LOGIN', user: localUser });
      } else {
        setError("Invalid Credentials. Please check your registry name and PIN.");
      }
    };

    try {
      const res = await fetch('/.netlify/functions/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, pin })
      });

      if (res.ok) {
        const user = await res.json();
        const mappedUser = {
          ...user,
          isApproved: user.is_approved,
          isActive: user.is_active,
          isBlocked: user.is_blocked,
          failedAttempts: user.failed_attempts,
          lastLogin: user.last_login,
          mustChangePin: user.must_change_pin
        };
        dispatch({ type: 'LOGIN', user: mappedUser });
      } else if (res.status === 404) {
        // Function not found (common in local preview) - fallback to local users
        console.warn("Auth API returned 404. Using local fallback.");
        attemptLocalFallback();
      } else {
        setError("Unauthorized Access. Registry records mismatch.");
      }
    } catch (err) {
      console.warn("Network error during auth. Using local fallback.");
      attemptLocalFallback();
    } finally {
      setIsLoggingIn(false);
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
            <p className="text-[10px] font-bold text-[#F9C912] uppercase tracking-[0.2em]">Enterprise Leave Portal</p>
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
            <button 
              type="submit" 
              disabled={isLoggingIn}
              className="w-full py-4 bg-[#187444] text-white font-black rounded-2xl uppercase shadow-xl transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            >
              {isLoggingIn ? 'Verifying Integrity...' : 'Verify & Enter'}
            </button>
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

const RegistrationView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { dispatch } = useStore();
  const [formData, setFormData] = useState({ name: '', pin: '', branch: Branch.GODOWN_HQ, dept: Department.IT });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.pin.length !== 4) return alert("PIN must be 4 digits");
    
    setLoading(true);
    const newUser: User = {
      id: `u${Date.now()}`,
      name: formData.name,
      pin: formData.pin,
      branch: formData.branch,
      department: formData.dept,
      role: UserRole.STAFF,
      isActive: false,
      isApproved: false,
      isBlocked: false,
      failedAttempts: 0,
      balances: { ...LEAVE_LIMITS }
    };
    
    setTimeout(() => {
      dispatch({ type: 'REGISTER', user: newUser });
      alert("Registration submitted. Awaiting manager approval.");
      onBack();
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EAE8DA] p-6">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-12 border border-gray-100">
        <h2 className="text-2xl font-black uppercase text-center mb-8">Staff Enrollment</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
            <input required placeholder="Official Identity" className="w-full" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Security PIN</label>
            <input required placeholder="4-Digit PIN" maxLength={4} className="w-full text-center tracking-[1em]" value={formData.pin} onChange={e => setFormData({...formData, pin: e.target.value.replace(/\D/g,'')})} />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Assigned Branch</label>
            <select className="w-full" value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value as Branch})}>
              {Object.values(Branch).map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Division</label>
            <select className="w-full" value={formData.dept} onChange={e => setFormData({...formData, dept: e.target.value as Department})}>
              {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <button type="submit" disabled={loading} className="w-full py-4 bg-[#187444] text-white font-black rounded-2xl uppercase shadow-xl transition-all active:scale-[0.98]">
            {loading ? 'Processing...' : 'Request Access'}
          </button>
          <button type="button" onClick={onBack} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-black transition-colors">Back to Login</button>
        </form>
      </div>
    </div>
  );
};

const MainApp: React.FC = () => {
  const { state, loading } = useStore();
  const [view, setView] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>('LOGIN');
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EAE8DA] flex flex-col items-center justify-center p-10">
         <Logo size="w-20 h-20 animate-bounce mb-8" />
         <div className="text-center space-y-2">
           <h2 className="text-sm font-black uppercase tracking-[0.3em] text-[#187444]">Establishing Enterprise Connection</h2>
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Synchronizing Roster with Cloud Infrastructure...</p>
         </div>
      </div>
    );
  }

  if (!state.currentUser) {
    if (view === 'REGISTER') return <RegistrationView onBack={() => setView('LOGIN')} />;
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