
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  OPERATIONS_MANAGER = 'OPERATIONS_MANAGER',
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  STAFF = 'STAFF'
}

export enum Branch {
  GODOWN_HQ = 'GODOWN HQ',
  NAIVASHA = 'NAIVASHA BRANCH',
  OLKALOU = 'OLKALOU BRANCH',
  GILGIL = 'GILGIL BRANCH',
  ENGINEER = 'ENGINEER BRANCH'
}

export enum Department {
  SALES = 'Sales',
  IT = 'IT',
  PROCUREMENT = 'Procurement',
  STORES = 'Stores',
  DRIVERS = 'Drivers',
  MANAGEMENT = 'Management'
}

export enum LeaveType {
  ANNUAL = 'Annual Leave',
  SICK = 'Sick Leave',
  MATERNITY = 'Maternity Leave',
  PATERNITY = 'Paternity Leave'
}

export enum LeaveStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected'
}

export interface User {
  id: string;
  name: string; 
  role: UserRole;
  department: Department;
  branch: Branch;
  isActive: boolean;
  isApproved: boolean;
  isBlocked: boolean; 
  pin: string; 
  failedAttempts: number;
  lastLogin?: string;
  balances: Record<LeaveType, number>;
  mustChangePin?: boolean;
}

export interface ResetRequest {
  id: string;
  userName: string;
  department: Department;
  status: 'PENDING' | 'RESOLVED';
  createdAt: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  department: Department;
  branch: Branch;
  type: LeaveType;
  dates: string[]; 
  startDate: string; 
  endDate: string;   
  reason: string;
  status: LeaveStatus;
  managerComment?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  timestamp: string;
  details?: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  timestamp: string;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  requests: LeaveRequest[];
  resetRequests: ResetRequest[];
  auditLogs: AuditLog[];
  notifications: Notification[];
  theme: 'light' | 'dark';
}
