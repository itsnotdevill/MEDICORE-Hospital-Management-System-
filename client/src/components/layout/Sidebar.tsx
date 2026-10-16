import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCog,
  Building2,
  Stethoscope,
  CalendarDays,
  FileText,
  Receipt,
  ClipboardList,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Bed,
  Pill,
  Activity,
  HeartPulse,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api';
import { getRoleLabel } from '../../lib/utils';
import type { UserRole } from '../../types';

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  roles: UserRole[];
  group: 'Operations' | 'Clinical' | 'Services' | 'Admin';
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['ADMIN'], group: 'Operations' },
  { to: '/appointments', icon: CalendarDays, label: 'Appointments', roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR'], group: 'Operations' },
  { to: '/patients', icon: Users, label: 'Patients', roles: ['ADMIN', 'RECEPTIONIST'], group: 'Operations' },

  { to: '/consultations', icon: FileText, label: 'Consultations', roles: ['DOCTOR'], group: 'Clinical' },
  { to: '/doctors', icon: Stethoscope, label: 'Doctors', roles: ['ADMIN', 'RECEPTIONIST', 'BILLING_STAFF'], group: 'Clinical' },
  { to: '/wards', icon: Bed, label: 'Ward & Beds', roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR'], group: 'Clinical' },

  { to: '/services', icon: Activity, label: 'Services & Lab', roles: ['ADMIN', 'DOCTOR', 'BILLING_STAFF'], group: 'Services' },
  { to: '/pharmacy', icon: Pill, label: 'Pharmacy', roles: ['ADMIN', 'DOCTOR', 'BILLING_STAFF'], group: 'Services' },
  { to: '/invoices', icon: Receipt, label: 'Invoices & Billing', roles: ['ADMIN', 'BILLING_STAFF'], group: 'Services' },

  { to: '/users', icon: UserCog, label: 'Staff Directory', roles: ['ADMIN'], group: 'Admin' },
  { to: '/departments', icon: Building2, label: 'Departments', roles: ['ADMIN'], group: 'Admin' },
  { to: '/audit-logs', icon: ClipboardList, label: 'Security Logs', roles: ['ADMIN'], group: 'Admin' },
];

interface SidebarInnerProps {
  collapsed: boolean;
  onItemClick?: () => void;
  onLogout: () => void;
  user: any;
}

const SidebarInner: React.FC<SidebarInnerProps> = ({
  collapsed,
  onItemClick,
  onLogout,
  user,
}) => {
  const filteredNav = navItems.filter(
    (item) => user && item.roles.includes(user.role as UserRole)
  );

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const groups: { key: NavItem['group']; label: string }[] = [
    { key: 'Operations', label: 'Operations' },
    { key: 'Clinical', label: 'Clinical EMR' },
    { key: 'Services', label: 'Healthcare Services' },
    { key: 'Admin', label: 'Governance' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#101B2D] border-r border-[#17263D] select-none">
      {/* Brand Header */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-[#17263D]/80 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#19B8C9] to-[#0F9D91] p-0.5 shadow-cyan-glow flex-shrink-0">
          <div className="w-full h-full bg-[#101B2D] rounded-[10px] flex items-center justify-center">
            <HeartPulse className="w-5 h-5 text-[#19B8C9]" />
          </div>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight leading-tight">MediCore</h1>
              <span className="text-[9px] font-bold uppercase tracking-wider bg-cyan-950 text-[#19B8C9] px-1.5 py-0.5 rounded border border-[#19B8C9]/30">
                HMS
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-0.5">
              Clinical Platform
            </p>
          </div>
        )}
      </div>

      {/* Navigation Links grouped */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto scrollbar-none">
        {groups.map((grp) => {
          const itemsInGroup = filteredNav.filter((item) => item.group === grp.key);
          if (itemsInGroup.length === 0) return null;

          return (
            <div key={grp.key} className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  {grp.label}
                </p>
              )}
              {itemsInGroup.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onItemClick}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'} ${
                      collapsed ? 'justify-center px-2' : ''
                    }`
                  }
                >
                  <item.icon className="w-4.5 h-4.5 flex-shrink-0 text-slate-300" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* User Card & Logout */}
      <div className="p-3 border-t border-[#17263D] bg-[#0B1320]/50">
        {user && (
          <div className={`flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5 mb-2 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#19B8C9] to-[#0F9D91] flex items-center justify-center text-white text-xs font-bold shadow-xs flex-shrink-0">
              {getInitials(user.name)}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <p className="text-[10px] text-[#19B8C9] font-medium truncate">
                  {getRoleLabel(user.role as UserRole)}
                </p>
              </div>
            )}
          </div>
        )}
        <button
          onClick={onLogout}
          title={collapsed ? 'Sign Out' : undefined}
          className={`w-full nav-item text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors ${
            collapsed ? 'justify-center px-2' : ''
          }`}
        >
          <LogOut className="w-4.5 h-4.5 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout: storeLogout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      storeLogout();
      navigate('/login');
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col fixed left-0 top-0 h-screen z-30 shadow-sidebar
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-16' : 'w-60'}`}
      >
        <SidebarInner
          collapsed={collapsed}
          onLogout={handleLogout}
          user={user}
        />
        {/* Collapse toggle button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white shadow-card border border-[#E3E9F0] flex items-center justify-center text-slate-600 hover:text-[#19B8C9] hover:border-[#19B8C9] transition-all z-10"
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </aside>

      {/* Mobile top navigation header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-[#101B2D] border-b border-[#17263D] px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#19B8C9] to-[#0F9D91] flex items-center justify-center p-0.5">
            <HeartPulse className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-base tracking-tight">MediCore HMS</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation drawer"
          className="text-slate-300 hover:text-white p-1 rounded-lg focus:outline-none"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-[#0B1320]/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="md:hidden fixed left-0 top-0 h-screen w-64 z-50 shadow-2xl animate-slide-up">
            <SidebarInner
              collapsed={false}
              onItemClick={() => setMobileOpen(false)}
              onLogout={handleLogout}
              user={user}
            />
          </aside>
        </>
      )}
    </>
  );
};

