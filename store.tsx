
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, User, LeaveRequest, LeaveStatus, AuditLog, Notification, UserRole, LeaveType, ResetRequest, Department, Branch } from './types';
import { INITIAL_USERS, INITIAL_REQUESTS } from './constants';

type Action =
  | { type: 'LOGIN'; user: User }
  | { type: 'LOGOUT' }
  | { type: 'REGISTER'; user: User }
  | { type: 'APPROVE_USER'; userId: string }
  | { type: 'BLOCK_USER'; userId: string }
  | { type: 'DELETE_USER'; userId: string }
  | { type: 'UPDATE_USER'; user: User }
  | { type: 'SET_USER_BALANCES'; userId: string; balances: Record<LeaveType, number>; reason: string }
  | { type: 'RECORD_FAILED_ATTEMPT'; name: string }
  | { type: 'ADD_REQUEST'; request: LeaveRequest }
  | { type: 'UPDATE_REQUEST_STATUS'; requestId: string; status: LeaveStatus; comment?: string }
  | { type: 'UPDATE_REQUEST_DATES'; requestId: string; dates: string[] }
  | { type: 'BULK_APPROVE_REQUESTS'; requestIds: string[] }
  | { type: 'CLEAR_NOTIFICATION'; notificationId: string }
  | { type: 'UPDATE_SELF'; name: string; pin: string }
  | { type: 'SUBMIT_RESET_REQUEST'; name: string; department: Department }
  | { type: 'ADMIN_RESET_PIN'; userId: string; tempPin: string }
  | { type: 'DISMISS_RESET_REQUEST'; requestId: string }
  | { type: 'RESET_DATABASE'; preservedAdminId: string; metadata: string };

const STORAGE_KEY = 'CBL_LEAVE_DB_v2.8';

const StoreContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | undefined>(undefined);

const reducer = (state: AppState, action: Action): AppState => {
  const ts = new Date().toISOString();
  const performer = state.currentUser?.name || 'System';

  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        currentUser: action.user,
        users: state.users.map(u => u.id === action.user.id ? { ...u, failedAttempts: 0, lastLogin: ts } : u),
        auditLogs: [{ id: `a-${Date.now()}`, action: 'SECURITY_LOGIN', performedBy: action.user.name, timestamp: ts, details: `Authentication successful` }, ...state.auditLogs]
      };
    case 'LOGOUT':
      return { ...state, currentUser: null };
    case 'REGISTER': {
      if (action.user.role === UserRole.OPERATIONS_MANAGER) {
        const existingOM = state.users.find(u => u.role === UserRole.OPERATIONS_MANAGER && u.isActive);
        if (existingOM) {
          alert("Organizational Constraint: Only one Operational Manager is allowed at Godown HQ.");
          return state;
        }
      }
      if (action.user.role === UserRole.BRANCH_MANAGER) {
        const existingBM = state.users.find(u => u.role === UserRole.BRANCH_MANAGER && u.branch === action.user.branch && u.isActive);
        if (existingBM) {
          alert(`Organizational Constraint: Branch ${action.user.branch} already has an assigned Manager.`);
          return state;
        }
      }

      const managers = state.users.filter(u => 
        u.role === UserRole.SUPER_ADMIN || 
        u.role === UserRole.OPERATIONS_MANAGER || 
        u.role === UserRole.BRANCH_MANAGER
      );

      const regNotifications: Notification[] = managers.map(m => ({
        id: `n-reg-${Date.now()}-${m.id}-${Math.random().toString(36).substr(2, 5)}`,
        userId: m.id,
        message: `Personnel Alert: ${action.user.name} has registered for the ${action.user.branch} (${action.user.department}). Approval required.`,
        isRead: false,
        timestamp: ts
      }));

      return {
        ...state,
        users: [...state.users, action.user],
        notifications: [...regNotifications, ...state.notifications],
        auditLogs: [{ id: `a-${Date.now()}`, action: 'PERSONNEL_REGISTRATION', performedBy: performer, details: `Registered ${action.user.name} for ${action.user.branch}`, timestamp: ts }, ...state.auditLogs]
      };
    }
    case 'ADD_REQUEST': {
      const managers = state.users.filter(u => 
        u.role === UserRole.SUPER_ADMIN || 
        u.role === UserRole.OPERATIONS_MANAGER || 
        u.role === UserRole.BRANCH_MANAGER
      );

      const newNotifications: Notification[] = managers.map(m => ({
        id: `n-leave-${Date.now()}-${m.id}-${Math.random().toString(36).substr(2, 5)}`,
        userId: m.id,
        message: `New Leave Application: ${action.request.userName} (${action.request.branch}) has applied for ${action.request.type}.`,
        isRead: false,
        timestamp: ts
      }));

      return {
        ...state,
        requests: [action.request, ...state.requests],
        notifications: [...newNotifications, ...state.notifications],
        auditLogs: [{ id: `a-${Date.now()}`, action: 'LEAVE_SUBMITTED', performedBy: action.request.userName, details: `Branch: ${action.request.branch}, Type: ${action.request.type}`, timestamp: ts }, ...state.auditLogs]
      };
    }
    case 'SUBMIT_RESET_REQUEST': {
      const globalAdmins = state.users.filter(u => 
        u.role === UserRole.SUPER_ADMIN || 
        u.role === UserRole.OPERATIONS_MANAGER
      );

      const resetNotifications: Notification[] = globalAdmins.map(admin => ({
        id: `n-reset-${Date.now()}-${admin.id}-${Math.random().toString(36).substr(2, 5)}`,
        userId: admin.id,
        message: `Security Alert: ${action.name} from ${action.department} has requested a PIN reset.`,
        isRead: false,
        timestamp: ts
      }));

      return {
        ...state,
        resetRequests: [{ id: `reset-${Date.now()}`, userName: action.name, department: action.department, status: 'PENDING', createdAt: ts }, ...state.resetRequests],
        notifications: [...resetNotifications, ...state.notifications],
        auditLogs: [{ id: `a-${Date.now()}`, action: 'RESET_REQUESTED', performedBy: action.name, timestamp: ts }, ...state.auditLogs]
      };
    }
    case 'UPDATE_REQUEST_STATUS': {
      const request = state.requests.find(r => r.id === action.requestId);
      if (!request) return state;

      let nextUsers = [...state.users];
      
      if (action.status === LeaveStatus.APPROVED && request.status !== LeaveStatus.APPROVED) {
        nextUsers = state.users.map(u => {
          if (u.id === request.userId) {
            const newBal = (u.balances[request.type] || 0) - request.dates.length;
            return { ...u, balances: { ...u.balances, [request.type]: newBal } };
          }
          return u;
        });
      }
      
      if (action.status === LeaveStatus.REJECTED && request.status === LeaveStatus.APPROVED) {
        nextUsers = state.users.map(u => {
          if (u.id === request.userId) {
            const refundBal = (u.balances[request.type] || 0) + request.dates.length;
            return { ...u, balances: { ...u.balances, [request.type]: refundBal } };
          }
          return u;
        });
      }

      const newNotification: Notification = {
        id: `n-status-${Date.now()}`,
        userId: request.userId,
        message: `Status Update: Your ${request.type} request has been ${action.status.toUpperCase()}.`,
        isRead: false,
        timestamp: ts
      };

      return {
        ...state,
        users: nextUsers,
        requests: state.requests.map(r => r.id === action.requestId ? { ...r, status: action.status, managerComment: action.comment } : r),
        notifications: [newNotification, ...state.notifications],
        auditLogs: [{ id: `a-${Date.now()}`, action: `LEAVE_${action.status.toUpperCase()}`, performedBy: performer, details: `Request ID: ${action.requestId}`, timestamp: ts }, ...state.auditLogs]
      };
    }
    case 'UPDATE_REQUEST_DATES':
      return {
        ...state,
        requests: state.requests.map(r => r.id === action.requestId ? { 
          ...r, 
          dates: action.dates, 
          startDate: action.dates[0], 
          endDate: action.dates[action.dates.length - 1] 
        } : r),
        auditLogs: [{ id: `a-${Date.now()}`, action: 'LEAVE_DATES_MODIFIED', performedBy: performer, details: `Request ID: ${action.requestId}`, timestamp: ts }, ...state.auditLogs]
      };
    case 'APPROVE_USER':
      return {
        ...state,
        users: state.users.map(u => u.id === action.userId ? { ...u, isApproved: true, isActive: true } : u),
        auditLogs: [{ id: `a-${Date.now()}`, action: 'PROFILE_AUTHORIZED', performedBy: performer, timestamp: ts }, ...state.auditLogs]
      };
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(u => u.id === action.user.id ? action.user : u),
        auditLogs: [{ id: `a-${Date.now()}`, action: 'PERSONNEL_UPDATE', performedBy: performer, timestamp: ts }, ...state.auditLogs]
      };
    case 'DELETE_USER': {
      const target = state.users.find(u => u.id === action.userId);
      return {
        ...state,
        users: state.users.map(u => u.id === action.userId ? { ...u, isActive: false, isBlocked: true } : u),
        auditLogs: [{ id: `a-${Date.now()}`, action: 'PERSONNEL_TERMINATED', performedBy: performer, details: `Terminated ${target?.name}`, timestamp: ts }, ...state.auditLogs]
      };
    }
    case 'CLEAR_NOTIFICATION':
      return { ...state, notifications: state.notifications.filter(n => n.id !== action.notificationId) };
    case 'UPDATE_SELF':
      return {
        ...state,
        currentUser: state.currentUser ? { ...state.currentUser, name: action.name, pin: action.pin, mustChangePin: false } : null,
        users: state.users.map(u => u.id === state.currentUser?.id ? { ...u, name: action.name, pin: action.pin, mustChangePin: false } : u),
        auditLogs: [{ id: `a-${Date.now()}`, action: 'PROFILE_SELF_UPDATE', performedBy: performer, timestamp: ts }, ...state.auditLogs]
      };
    case 'SET_USER_BALANCES':
      return {
        ...state,
        users: state.users.map(u => u.id === action.userId ? { ...u, balances: action.balances } : u),
        auditLogs: [{ id: `a-${Date.now()}`, action: 'QUOTA_ADJUSTMENT', performedBy: performer, details: action.reason, timestamp: ts }, ...state.auditLogs]
      };
    case 'ADMIN_RESET_PIN':
      return {
        ...state,
        users: state.users.map(u => u.id === action.userId ? { ...u, pin: action.tempPin, mustChangePin: true, failedAttempts: 0, isBlocked: false } : u),
        auditLogs: [{ id: `a-${Date.now()}`, action: 'ADMIN_PIN_RESET', performedBy: performer, timestamp: ts }, ...state.auditLogs]
      };
    case 'DISMISS_RESET_REQUEST':
      return {
        ...state,
        resetRequests: state.resetRequests.map(r => r.id === action.requestId ? { ...r, status: 'RESOLVED' } : r)
      };
    case 'RESET_DATABASE': {
      const preservedAdmin = state.users.find(u => u.id === action.preservedAdminId);
      const remainingUsers = preservedAdmin ? [preservedAdmin] : INITIAL_USERS;
      
      const newAuditLog: AuditLog = { 
        id: `a-${Date.now()}`, 
        action: 'CRITICAL_SYSTEM_RESET', 
        performedBy: performer, 
        timestamp: ts, 
        details: action.metadata 
      };

      const securityAlert: Notification = {
        id: `n-reset-${Date.now()}`,
        userId: action.preservedAdminId,
        message: 'SYSTEM ALERT: Full database reset was executed by this account.',
        isRead: false,
        timestamp: ts
      };

      return { 
        currentUser: state.currentUser, 
        users: remainingUsers, 
        requests: [], 
        auditLogs: [newAuditLog], 
        notifications: [securityAlert], 
        resetRequests: [], 
        theme: 'light' 
      };
    }
    default:
      return state;
  }
};

const getInitialState = (): AppState => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return { ...parsed, currentUser: null };
    } catch (e) { console.error("Database Restoration Failure", e); }
  }
  return { currentUser: null, users: INITIAL_USERS, requests: INITIAL_REQUESTS, auditLogs: [], notifications: [], resetRequests: [], theme: 'light' };
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, getInitialState());
  useEffect(() => {
    const { currentUser, ...persistentData } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistentData));
  }, [state]);
  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
