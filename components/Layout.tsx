
import React, { useState } from 'react';
import { useStore } from '../store';
import { UserRole } from '../types';
import Logo from './Logo';

const Layout: React.FC<{ children: React.ReactNode, activeTab: string, setActiveTab: (tab: string) => void }> = ({ children, activeTab, setActiveTab }) => {
  const { state, dispatch } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = state.currentUser!;

  const handleLogout = () => dispatch({ type: 'LOGOUT' });

  const navItems = [];
  
  if (user.role === UserRole.STAFF) {
    navItems.push(
      { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
      { id: 'calendar', label: 'Team Map', icon: '📅' },
      { id: 'apply', label: 'Apply Leave', icon: '✍️' },
      { id: 'history', label: 'My Records', icon: '📜' }
    );
  } else if (user.role === UserRole.BRANCH_MANAGER) {
    navItems.push(
      { id: 'dashboard', label: 'Control Hub', icon: '📊' },
      { id: 'calendar', label: 'Personnel Map', icon: '📅' },
      { id: 'apply', label: 'Apply Leave', icon: '✍️' },
      { id: 'my-leave', label: 'My Records', icon: '📜' },
      { id: 'reports', label: 'Reports', icon: '📈' }
    );
  } else {
    // Admin or Ops Manager - "Apply Leave" removed as requested
    navItems.push(
      { id: 'dashboard', label: 'Command Hub', icon: '📊' },
      { id: 'calendar', label: 'Personnel Map', icon: '📅' },
      { id: 'reports', label: 'Reports', icon: '📈' },
      { id: 'audit', label: 'System Logs', icon: '🛡️' },
      { id: 'profile', label: 'Profile', icon: '👤' }
    );
  }

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-[#EAE8DA] overflow-hidden flex-col md:flex-row">
      <div className="md:hidden bg-white px-6 py-4 flex justify-between items-center sticky top-0 z-[60] shadow-sm">
        <div className="flex items-center gap-3">
          <Logo size="w-10 h-10" />
          <div className="flex flex-col">
            <h1 className="text-[11px] font-extrabold text-black leading-none tracking-tight uppercase">C.B. Limited</h1>
            <h2 className="text-[8px] font-bold text-[#187444] uppercase tracking-[0.1em] mt-0.5">Construction Simplified</h2>
            <h3 className="text-[6px] font-bold text-[#F9C912] uppercase tracking-[0.1em]">Leave Management</h3>
          </div>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="w-10 h-10 flex items-center justify-center text-[#187444] bg-[#EAE8DA] rounded-xl active:scale-95 transition-all">
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[55] md:hidden animate-in fade-in" onClick={() => setMobileMenuOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-[60] w-72 bg-white transition-transform duration-300 md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl md:shadow-none`}>
        <div className="flex flex-col h-full">
          <div className="hidden md:flex flex-col items-center pt-10 pb-8 px-6 border-b border-gray-50">
            <Logo size="w-16 h-16 mb-4" />
            <h1 className="text-sm font-extrabold text-black uppercase leading-none tracking-tight text-center mb-1.5">Commercial Builders</h1>
            <p className="text-[9px] font-black text-[#187444] uppercase tracking-[0.3em] mb-1">Construction Simplified</p>
            <h2 className="text-[10px] font-bold text-[#F9C912] uppercase tracking-widest">Leave System</h2>
          </div>
          
          <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
            {navItems.map(item => (
              <button 
                key={item.id} 
                onClick={() => handleTabClick(item.id)} 
                className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[13px] font-bold transition-all duration-200 ${activeTab === item.id ? 'bg-[#187444] text-white shadow-lg shadow-[#187444]/20' : 'text-gray-500 hover:bg-[#EAE8DA]/50'}`}
              >
                <span className="text-xl opacity-90">{item.icon}</span> {item.label}
              </button>
            ))}
          </nav>
          
          <div className="p-4 border-t border-gray-50">
            <div className="bg-[#EAE8DA]/40 p-4 rounded-3xl flex items-center gap-4 mb-4">
               <div className="w-11 h-11 rounded-2xl bg-[#187444] flex-shrink-0 flex items-center justify-center text-white font-extrabold shadow-sm">{user.name[0]}</div>
               <div className="flex-1 overflow-hidden">
                 <p className="text-xs font-extrabold text-black truncate leading-tight">{user.name}</p>
                 <p className="text-[10px] font-bold text-gray-500 truncate mt-0.5">{user.branch}</p>
               </div>
            </div>
            <button onClick={handleLogout} className="w-full py-4 text-[11px] font-black text-white bg-[#000000] rounded-2xl hover:opacity-90 transition-all uppercase tracking-widest">Sign Out</button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-10 lg:p-12 scroll-smooth">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
