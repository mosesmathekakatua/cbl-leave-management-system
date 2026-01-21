import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { AppState, User, LeaveRequest, LeaveStatus, AuditLog, Notification, UserRole, LeaveType, ResetRequest, Department, Branch } from './types';
import { INITIAL_USERS, INITIAL_REQUESTS } from './constants';
import { supabase } from './supabaseClient';

type Action =
  | { type: 'SET_CLOUD_DATA'; users: User[]; requests: LeaveRequest[] }
  | { type: 'LOGIN'; user: User }
  | { type: 'LOGOUT' }
  | { type: 'REGISTER'; user: User }
  | { type: 'ADD_REQUEST'; request: LeaveRequest }
  | { type: 'UPDATE_REQUEST_STATUS'; requestId: string; status: LeaveStatus; comment?: string }
  | { type: 'UPDATE_USER'; user: User }
  | { type: 'DELETE_USER'; userId: string }
  | { type: 'APPROVE_USER'; userId: string }
  | { type: 'CLEAR_NOTIFICATION'; notificationId: string }
  | { type: 'UPDATE_SELF'; name: string; pin: string };

const StoreContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action>; loading: boolean } | undefined>(undefined);

const reducer = (state: AppState, action: Action): AppState => {
  const ts = new Date().toISOString();
  
  switch (action.type) {
    case 'SET_CLOUD_DATA':
      return { ...state, users: action.users.length ? action.users : state.users, requests: action.requests };
    
    case 'LOGIN':
      return { ...state, currentUser: action.user };
    
    case 'LOGOUT':
      return { ...state, currentUser: null };

    case 'REGISTER':
      if (supabase) {
        supabase.from('users').insert([{
          id: action.user.id,
          name: action.user.name,
          role: action.user.role,
          department: action.user.department,
          branch: action.user.branch,
          pin: action.user.pin,
          balances: action.user.balances,
          is_approved: action.user.isApproved
        }]).then();
      }
      return { ...state, users: [action.user, ...state.users] };

    case 'ADD_REQUEST':
      if (supabase) {
        supabase.from('leave_requests').insert([{
          id: action.request.id,
          user_id: action.request.userId,
          user_name: action.request.userName,
          type: action.request.type,
          dates: action.request.dates,
          start_date: action.request.startDate,
          end_date: action.request.endDate,
          reason: action.request.reason,
          status: action.request.status
        }]).then();
      }
      return { ...state, requests: [action.request, ...state.requests] };

    case 'UPDATE_REQUEST_STATUS':
      if (supabase) {
        supabase.from('leave_requests')
          .update({ status: action.status, manager_comment: action.comment })
          .eq('id', action.requestId).then();
      }
      return {
        ...state,
        requests: state.requests.map(r => r.id === action.requestId ? { ...r, status: action.status, managerComment: action.comment } : r)
      };

    case 'APPROVE_USER':
      if (supabase) {
        supabase.from('users').update({ is_approved: true, is_active: true }).eq('id', action.userId).then();
      }
      return { ...state, users: state.users.map(u => u.id === action.userId ? { ...u, isApproved: true, isActive: true } : u) };

    case 'UPDATE_SELF':
      if (supabase && state.currentUser) {
        supabase.from('users').update({ name: action.name, pin: action.pin }).eq('id', state.currentUser.id).then();
      }
      return {
        ...state,
        currentUser: state.currentUser ? { ...state.currentUser, name: action.name, pin: action.pin } : null,
        users: state.users.map(u => u.id === state.currentUser?.id ? { ...u, name: action.name, pin: action.pin } : u)
      };

    default:
      return state;
  }
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, { 
    currentUser: null, users: INITIAL_USERS, requests: INITIAL_REQUESTS, auditLogs: [], notifications: [], resetRequests: [], theme: 'light' 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const { data: usersData } = await supabase.from('users').select('*');
        const { data: requestsData } = await supabase.from('leave_requests').select('*');

        const mappedUsers: User[] = (usersData || []).map(u => ({
          id: u.id,
          name: u.name,
          role: u.role as UserRole,
          department: u.department as Department,
          branch: u.branch as Branch,
          pin: u.pin,
          isActive: u.is_active,
          isApproved: u.is_approved,
          isBlocked: u.is_blocked,
          failedAttempts: 0,
          balances: u.balances
        }));

        const mappedRequests: LeaveRequest[] = (requestsData || []).map(r => ({
          id: r.id,
          userId: r.user_id,
          userName: r.user_name,
          userRole: UserRole.STAFF, // simplified
          department: Department.IT, // simplified
          branch: Branch.GODOWN_HQ, // simplified
          type: r.type as LeaveType,
          dates: r.dates,
          startDate: r.start_date,
          endDate: r.end_date,
          reason: r.reason,
          status: r.status as LeaveStatus,
          managerComment: r.manager_comment,
          createdAt: r.created_at
        }));

        dispatch({ type: 'SET_CLOUD_DATA', users: mappedUsers, requests: mappedRequests });
      } catch (e) {
        console.warn("Cloud sync failed, using initial roster.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return <StoreContext.Provider value={{ state, dispatch, loading }}>{children}</StoreContext.Provider>;
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};