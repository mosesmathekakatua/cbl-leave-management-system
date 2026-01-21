
import React, { useState } from 'react';
import { useStore } from '../store';
import { User, UserRole, Department, Branch, LeaveType } from '../types';
import { LEAVE_LIMITS } from '../constants';

interface UserModalProps {
  user?: User;
  onClose: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ user, onClose }) => {
  const { dispatch } = useStore();
  const [formData, setFormData] = useState<Partial<User>>(user || {
    name: '',
    role: UserRole.STAFF,
    department: Department.IT,
    branch: Branch.GODOWN_HQ,
    isActive: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userData: User = {
      id: user?.id || `u${Date.now()}`,
      name: formData.name!,
      role: formData.role as UserRole,
      department: formData.department as Department,
      branch: formData.branch as Branch,
      isActive: formData.isActive ?? true,
      isApproved: user?.isApproved ?? true,
      isBlocked: user?.isBlocked ?? false,
      pin: user?.pin || '1234',
      failedAttempts: user?.failedAttempts || 0,
      balances: user?.balances || { ...LEAVE_LIMITS }
    };

    if (user) {
      dispatch({ type: 'UPDATE_USER', user: userData });
    } else {
      dispatch({ type: 'REGISTER', user: userData });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-black text-gray-900">{user ? 'Edit Employee' : 'New Employee'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase mb-2">Full Name</label>
              <input
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-2">Role</label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                >
                  {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-2">Branch</label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                  value={formData.branch}
                  onChange={e => setFormData({ ...formData, branch: e.target.value as Branch })}
                >
                  {Object.values(Branch).map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-2">Department</label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value as Department })}
                >
                  {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2 py-2">
              <input
                type="checkbox"
                id="isActive"
                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                checked={formData.isActive}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <label htmlFor="isActive" className="text-sm font-bold text-gray-700">Account Active</label>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 rounded-xl font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all"
            >
              {user ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
