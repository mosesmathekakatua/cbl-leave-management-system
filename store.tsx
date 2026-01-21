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
  | { type: 'RESET_DATABASE'; preservedAdminId: string; metadata: string }
  | { type: 'UPDATE_SELF'; name: string; pin: string };

const StoreContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action>; loading: boolean } | undefined>(undefined);

// Helper for Backend Sync
const syncToBackend = async (type: string, data: any) => {
  try {
    const res = await fetch('/.netlify/functions/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Unknown server error' }));
      console.warn(`[Sync Warning] ${type}:`, errData);
    }
  } catch (err) {
    console.error("[Sync Network Error]:", err);
  }
};

const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_INITIAL_STATE':
      return { ...state, ...action.state };
      
    case 'LOGIN':
      return { ...state, currentUser: action.user };
      
    case 'LOGOUT':
      return { ...state, currentUser: null };

    case 'REGISTER':
      syncToBackend('REGISTER', action.user);
      return { ...state, users: [action.user, ...state.users] };

    case 'ADD_REQUEST':
      syncToBackend('ADD_REQUEST', action.request);
      return { ...state, requests: [action.request, ...state.requests] };

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

      return {
        ...state,
        users: nextUsers,
        requests: state.requests.map(r => r.id === action.requestId ? { ...r, status: action.status, managerComment: action.comment } : r)
      };
    }

    case 'APPROVE_USER':
      syncToBackend('UPDATE_USER', { id: action.userId, updates: { is_approved: true, is_active: true } });
      return { ...state, users: state.users.map(u => u.id === action.userId ? { ...u, isApproved: true, isActive: true } : u) };

    case 'CLEAR_NOTIFICATION':
      syncToBackend('DELETE_NOTIFICATION', { id: action.notificationId });
      return { ...state, notifications: state.notifications.filter(n => n.id !== action.notificationId) };

    case 'DELETE_USER':
      syncToBackend('DELETE_USER', { id: action.userId });
      return { ...state, users: state.users.filter(u => u.id !== action.userId) };

    case 'UPDATE_SELF':
      if (!state.currentUser) return state;
      const updatedUser = { ...state.currentUser, name: action.name, pin: action.pin };
      syncToBackend('UPDATE_USER', { id: updatedUser.id, updates: { name: action.name, pin: action.pin } });
      return {
        ...state,
        currentUser: updatedUser,
        users: state.users.map(u => u.id === updatedUser.id ? updatedUser : u)
      };

    case 'DISMISS_RESET_REQUEST':
      syncToBackend('UPDATE_RESET', { id: action.requestId });
      return { ...state, resetRequests: state.resetRequests.map(r => r.id === action.requestId ? { ...r, status: 'RESOLVED' } : r) };

    default:
      return state;
  }
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, { 
    currentUser: null, users: [], requests: [], auditLogs: [], notifications: [], resetRequests: [], theme: 'light' 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hydrate = async () => {
      try {
        // Try to reach the function
        const res = await fetch('/.netlify/functions/api/data');
        
        if (!res.ok) {
          throw new Error(`API unreachable (Status ${res.status})`);
        }

        const data = await res.json();
        
        const mappedUsers = data.users?.map((u: any) => ({
          ...u,
          isApproved: u.is_approved,
          isActive: u.is_active,
          isBlocked: u.is_blocked,
          failedAttempts: u.failed_attempts,
          lastLogin: u.last_login,
          mustChangePin: u.must_change_pin
        })) || INITIAL_USERS;

        const mappedRequests = data.requests?.map((r: any) => ({
          ...r,
          userName: r.user_name,
          userRole: r.user_role,
          startDate: r.start_date,
          endDate: r.end_date,
          managerComment: r.manager_comment
        })) || [];

        dispatch({ 
          type: 'SET_INITIAL_STATE', 
          state: { 
            users: mappedUsers, 
            requests: mappedRequests,
            notifications: data.notifications || [],
            auditLogs: data.logs || [],
            resetRequests: data.resets || []
          } 
        });
      } catch (err) {
        // Log the error but don't break the app UI
        console.warn("Backend Sync Unavailable, using local cache:", err);
        dispatch({ type: 'SET_INITIAL_STATE', state: { users: INITIAL_USERS } });
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