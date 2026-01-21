
import { User, UserRole, Department, Branch, LeaveType } from './types';

export const LEAVE_LIMITS = {
  [LeaveType.ANNUAL]: 21,
  [LeaveType.SICK]: 15,
  [LeaveType.MATERNITY]: 90,
  [LeaveType.PATERNITY]: 14,
};

export const INITIAL_USERS: User[] = [
  {
    id: 'boss-1',
    name: 'CBL Chief Admin',
    role: UserRole.SUPER_ADMIN,
    department: Department.MANAGEMENT,
    branch: Branch.GODOWN_HQ,
    isActive: true,
    isApproved: true,
    isBlocked: false,
    pin: '1234',
    failedAttempts: 0,
    balances: { ...LEAVE_LIMITS }
  },
  {
    id: 'ops-1',
    name: 'Operational Director',
    role: UserRole.OPERATIONS_MANAGER,
    department: Department.MANAGEMENT,
    branch: Branch.GODOWN_HQ,
    isActive: true,
    isApproved: true,
    isBlocked: false,
    pin: '1111',
    failedAttempts: 0,
    balances: { ...LEAVE_LIMITS }
  },
  {
    id: 'bm-naivasha',
    name: 'Naivasha Manager',
    role: UserRole.BRANCH_MANAGER,
    department: Department.MANAGEMENT,
    branch: Branch.NAIVASHA,
    isActive: true,
    isApproved: true,
    isBlocked: false,
    pin: '3333',
    failedAttempts: 0,
    balances: { ...LEAVE_LIMITS }
  },
  {
    id: 'bm-olkalou',
    name: 'Olkalou Manager',
    role: UserRole.BRANCH_MANAGER,
    department: Department.MANAGEMENT,
    branch: Branch.OLKALOU,
    isActive: true,
    isApproved: true,
    isBlocked: false,
    pin: '4444',
    failedAttempts: 0,
    balances: { ...LEAVE_LIMITS }
  },
  {
    id: 'bm-gilgil',
    name: 'Gilgil Manager',
    role: UserRole.BRANCH_MANAGER,
    department: Department.MANAGEMENT,
    branch: Branch.GILGIL,
    isActive: true,
    isApproved: true,
    isBlocked: false,
    pin: '5555',
    failedAttempts: 0,
    balances: { ...LEAVE_LIMITS }
  },
  {
    id: 'bm-engineer',
    name: 'Engineer Manager',
    role: UserRole.BRANCH_MANAGER,
    department: Department.MANAGEMENT,
    branch: Branch.ENGINEER,
    isActive: true,
    isApproved: true,
    isBlocked: false,
    pin: '6666',
    failedAttempts: 0,
    balances: { ...LEAVE_LIMITS }
  }
];

export const INITIAL_REQUESTS = [];
