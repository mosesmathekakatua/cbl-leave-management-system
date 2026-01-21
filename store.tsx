import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { AppState, User, LeaveRequest, LeaveStatus, AuditLog, Notification, UserRole, LeaveType, ResetRequest, Department, Branch } from './types';
import { INITIAL_USERS } from './constants';

type Action =
  | { type: 'SET_INITIAL_STATE'; state: Partial<AppState> }
  | { type: 'LOGIN'; user: User }
  | { type: 'LOGOUT' }
  | { type: 'REGISTER'; user: User }
  | { type: 'APPROVE_USER'; userId: string }
  | { type: 'BLOCK_USER'; userId: string }
  | { type: 'UPDATE_USER'; user: User }
  | { type: 'ADD_REQUEST'; request: LeaveRequest }
  | { type: 'UPDATE_REQUEST_STATUS'; requestId: string; status: LeaveStatus; comment?: string }
  | { type: 'CLEAR_NOTIFICATION'; notificationId: string }
  | { type: 'SUBMIT_RESET_REQUEST'; request: ResetRequest }
  | { type: 'DISMISS_RESET_REQUEST'; requestId: string }
  | { type: 'UPDATE_REQUEST_DATES'; requestId: string; dates: string[] }
  | { type: 'DELETE_USER'; userId: string }
  | { type: 'ADMIN_RESET_PIN'; userId: string; tempPin: string }
  | { type: 'UPDATE_SELF'; name: string; pin: string }
  | { type: 'RESET_DATABASE'; preservedAdminId: string; metadata: string };

const StoreContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action>; loading: boolean } | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'cbl_leave_manager_v1';

const saveToLocal = (state: AppState) => {
  try {
    const { currentUser, ...persistentData } = state;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(persistentData));
  } catch (e) {
    console.warn("LocalStorage save failed", e);
  }
};

const loadFromLocal = (): Partial<AppState> | null => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

// Robust path helper for API calls - ensures no double slashes and correct prefix
const getApiPath = (endpoint: string) => `/.netlify/functions/api${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

const syncToBackend = async (type: string, data: any) => {
  try {
    const res = await fetch(getApiPath('/sync'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data })
    });
    if (!res.ok) console.warn(`[Sync API Unreachable] ${type} (Status ${res.status})`);
  } catch (err) {
    console.error("[Backend Sync Network Error]:", err);
  }
};

const reducer = (state: AppState, action: Action): AppState => {
  let newState: AppState;
  
  switch (action.type) {
    case 'SET_INITIAL_STATE':
      newState = { ...state, ...action.state };
      break;
    case 'LOGIN':
      newState = { ...state, currentUser: action.user };
      break;
    case 'LOGOUT':
      newState = { ...state, currentUser: null };
      break;
    case 'REGISTER':
      syncToBackend('REGISTER', action.user);
      newState = { ...state, users: [action.user, ...state.users] };
      break;
    case 'ADD_REQUEST':
      syncToBackend('ADD_REQUEST', action.request);
      newState = { ...state, requests: [action.request, ...state.requests] };
      break;
    case 'UPDATE_REQUEST_STATUS': {
      const req = state.requests.find(r => r.id === action.requestId);
      if (!req) return state;
      const updates = { status: action.status, manager_comment: action.comment };
      syncToBackend('UPDATE_REQUEST', { id: action.requestId, updates });
      let nextUsers = [...state.users];
      if (action.status === LeaveStatus.APPROVED) {
        nextUsers = state.users.map(u => u.id === req.userId ? {
          ...u,
          balances: { ...u.balances, [req.type]: (u.balances[req.type] || 0) - req.dates.length }
        } : u);
        const updatedUser = nextUsers.find(u => u.id === req.userId);
        if (updatedUser) syncToBackend('UPDATE_USER', { id: updatedUser.id, updates: { balances: updatedUser.balances } });
      }
      newState = {
        ...state,
        users: nextUsers,
        requests: state.requests.map(r => r.id === action.requestId ? { ...r, status: action.status, managerComment: action.comment } : r)
      };
      break;
    }
    case 'APPROVE_USER':
      syncToBackend('UPDATE_USER', { id: action.userId, updates: { is_approved: true, is_active: true } });
      newState = { ...state, users: state.users.map(u => u.id === action.userId ? { ...u, isApproved: true, isActive: true } : u) };
      break;
    case 'CLEAR_NOTIFICATION':
      syncToBackend('DELETE_NOTIFICATION', { id: action.notificationId });
      newState = { ...state, notifications: state.notifications.filter(n => n.id !== action.notificationId) };
      break;
    case 'DELETE_USER':
      syncToBackend('DELETE_USER', { id: action.userId });
      newState = { ...state, users: state.users.filter(u => u.id !== action.userId) };
      break;
    case 'UPDATE_USER':
      syncToBackend('UPDATE_USER', { id: action.user.id, updates: action.user });
      newState = { ...state, users: state.users.map(u => u.id === action.user.id ? action.user : u) };
      break;
    case 'BLOCK_USER':
      syncToBackend('UPDATE_USER', { id: action.userId, updates: { is_blocked: true } });
      newState = { ...state, users: state.users.map(u => u.id === action.userId ? { ...u, isBlocked: true } : u) };
      break;
    case 'UPDATE_REQUEST_DATES': {
      const req = state.requests.find(r => r.id === action.requestId);
      if (!req) return state;
      const sorted = [...action.dates].sort();
      const updates = { dates: sorted, start_date: sorted[0], end_date: sorted[sorted.length-1] };
      syncToBackend('UPDATE_REQUEST', { id: action.requestId, updates });
      newState = {
        ...state,
        requests: state.requests.map(r => r.id === action.requestId ? { ...r, dates: sorted, startDate: sorted[0], endDate: sorted[sorted.length-1] } : r)
      };
      break;
    }
    case 'ADMIN_RESET_PIN':
      syncToBackend('UPDATE_USER', { id: action.userId, updates: { pin: action.tempPin, must_change_pin: true } });
      newState = { ...state, users: state.users.map(u => u.id === action.userId ? { ...u, pin: action.tempPin, mustChangePin: true } : u) };
      break;
    case 'SUBMIT_RESET_REQUEST':
      syncToBackend('SUBMIT_RESET', action.request);
      newState = { ...state, resetRequests: [action.request, ...state.resetRequests] };
      break;
    case 'UPDATE_SELF':
      if (!state.currentUser) return state;
      const updatedUser = { ...state.currentUser, name: action.name, pin: action.pin };
      syncToBackend('UPDATE_USER', { id: updatedUser.id, updates: { name: action.name, pin: action.pin } });
      newState = {
        ...state,
        currentUser: updatedUser,
        users: state.users.map(u => u.id === updatedUser.id ? updatedUser : u)
      };
      break;
    case 'DISMISS_RESET_REQUEST':
      syncToBackend('UPDATE_RESET', { id: action.requestId });
      newState = { ...state, resetRequests: state.resetRequests.map(r => r.id === action.requestId ? { ...r, status: 'RESOLVED' } : r) };
      break;
    case 'RESET_DATABASE': {
      const admin = state.users.find(u => u.id === action.preservedAdminId);
      newState = {
        ...state,
        users: admin ? [admin] : [],
        requests: [],
        auditLogs: [{ id: `log-${Date.now()}`, action: 'SYSTEM_RESET', performedBy: admin?.name || 'System', timestamp: new Date().toISOString(), details: action.metadata }],
        notifications: [],
        resetRequests: []
      };
      break;
    }
    default:
      return state;
  }
  
  saveToLocal(newState);
  return newState;
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, { 
    currentUser: null, users: INITIAL_USERS, requests: [], auditLogs: [], notifications: [], resetRequests: [], theme: 'light' 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const res = await fetch(getApiPath('/data'));
        
        if (!res.ok) {
           console.warn(`API responded with ${res.status}. Falling back to local data.`);
           throw new Error(`Status ${res.status}`);
        }

        const data = await res.json();
        const mappedUsers = data.users && data.users.length > 0 ? data.users.map((u: any) => ({
          ...u,
          isApproved: u.is_approved,
          isActive: u.is_active,
          isBlocked: u.is_blocked,
          failedAttempts: u.failed_attempts,
          lastLogin: u.last_login,
          mustChangePin: u.must_change_pin
        })) : INITIAL_USERS;

        dispatch({ 
          type: 'SET_INITIAL_STATE', 
          state: { 
            users: mappedUsers, 
            requests: data.requests?.map((r: any) => ({
              ...r, userName: r.user_name, userRole: r.user_role, startDate: r.start_date, endDate: r.end_date, managerComment: r.manager_comment
            })) || [],
            notifications: data.notifications || [],
            auditLogs: data.logs || [],
            resetRequests: data.resets || []
          } 
        });
      } catch (err) {
        const local = loadFromLocal();
        dispatch({ 
          type: 'SET_INITIAL_STATE', 
          state: local || { users: INITIAL_USERS } 
        });
      } finally {
        setLoading(false);
      }
    };
    hydrate();
  }, []);

  return (
    <StoreContext.Provider value={{ state, dispatch, loading }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};