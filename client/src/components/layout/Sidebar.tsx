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
  Heart,
  Menu,
  X,
  Bed,
  Pill,
  Activity,
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
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['ADMIN'] },
  { to: '/users', icon: UserCog, label: 'Users', roles: ['ADMIN'] },
  { to: '/departments', icon: Building2, label: 'Departments', roles: ['ADMIN'] },
  { to: '/doctors', icon: Stethoscope, label: 'Doctors', roles: ['ADMIN', 'RECEPTIONIST', 'BILLING_STAFF'] },
  { to: '/patients', icon: Users, label: 'Patients', roles: ['ADMIN', 'RECEPTIONIST'] },
  { to: '/appointments', icon: CalendarDays, label: 'Appointments', roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR'] },
  { to: '/consultations', icon: FileText, label: 'Consultations', roles: ['DOCTOR'] },
  { to: '/wards', icon: Bed, label: 'Ward & Beds', roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR'] },
  { to: '/services', icon: Activity, label: 'Services & Lab', roles: ['ADMIN', 'DOCTOR', 'BILLING_STAFF'] },
  { to: '/pharmacy', icon: Pill, label: 'Pharmacy', roles: ['ADMIN', 'DOCTOR', 'BILLING_STAFF'] },
  { to: '/invoices', icon: Receipt, label: 'Invoices', roles: ['ADMIN', 'BILLING_STAFF'] },
  { to: '/audit-logs', icon: ClipboardList, label: 'Audit Logs', roles: ['ADMIN'] },
];

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout: storeLogout } = useAuthStore();
  const navigate = useNavigate();

  const filteredNav = navItems.filter(
    (item) => user && item.roles.includes(user.role as UserRole)
  );

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      storeLogout();
      navigate('/login');
    }
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 ${collapsed ? 'justify-center' : ''}`}>
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
          <Heart className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-lg font-bold text-white leading-none">MediCore</h1>
            <p className="text-[10px] text-white/60 uppercase tracking-widest mt-0.5">HMS</p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-white/10 mb-2" />

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-none">
        {filteredNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`
            }
          >
            <item.icon className="w-4.5 h-4.5 flex-shrink-0 w-5 h-5" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-white/10">
        {user && (
          <div className={`flex items-center gap-3 mb-2 px-2 py-2 ${collapsed ? 'justify-center' : ''}`}>
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-semibold">
              {getInitials(user.name)}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-white/60">{getRoleLabel(user.role as UserRole)}</p>
              </div>
            )}
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`w-full nav-item nav-item-inactive ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col fixed left-0 top-0 h-screen z-30
          bg-gradient-to-b from-[#1e3a5f] to-[#162d4a] shadow-sidebar
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-16' : 'w-60'}`}
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors z-10"
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </aside>

      {/* Mobile header bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-[#1e3a5f] px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-white" />
          <span className="text-white font-bold text-lg">MediCore</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-white p-1"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="md:hidden fixed left-0 top-0 h-screen w-64 z-50 bg-gradient-to-b from-[#1e3a5f] to-[#162d4a] shadow-xl">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
};
