import React from 'react';
import { Sidebar } from './Sidebar';
import { Outlet, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SystemObservabilityBadge } from './SystemObservabilityModal';
import { useAuthStore } from '../../store/authStore';
import { getRoleLabel } from '../../lib/utils';
import type { UserRole } from '../../types';
import { ShieldCheck } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="flex h-screen bg-[#F6F8FB] overflow-hidden">
      <Sidebar />
      {/* Main content area with top header */}
      <div className="flex-1 md:ml-60 flex flex-col h-screen overflow-hidden transition-all duration-300">
        {/* Sleek Clinical Top Navigation Bar */}
        <header className="bg-white border-b border-[#E3E9F0] px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-xs z-20">
          <div className="flex items-center gap-3">
            {/* Mobile spacer for menu icon */}
            <div className="md:hidden w-8" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-tight text-[#172337] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#19B8C9] animate-pulse" />
                  MediCore HMS Platform
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Clinical Grade
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-[#65748B]">
                Hospital Operational Workflow & Real-Time Clinical Data Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* System Observability & Database Connection Badge */}
            <SystemObservabilityBadge />

            {/* User profile link chip */}
            {user && (
              <Link
                to="/profile"
                className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-[#E3E9F0] hover:opacity-85 transition-opacity"
                title="View & Edit Profile"
              >
                <div className="w-8 h-8 rounded-lg bg-[#101B2D] border border-[#17263D] flex items-center justify-center text-white text-xs font-bold shadow-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-bold text-[#172337] leading-tight truncate max-w-[120px]">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-[#0F9D91] font-semibold">
                    {getRoleLabel(user.role as UserRole)}
                  </p>
                </div>
              </Link>
            )}
          </div>
        </header>

        {/* Scrollable page canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F6F8FB]">
          <Outlet />
        </main>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#FFFFFF',
            color: '#172337',
            border: '1px solid #E3E9F0',
            boxShadow: '0 10px 25px -5px rgba(16, 27, 45, 0.1), 0 8px 10px -6px rgba(16, 27, 45, 0.05)',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 500,
            padding: '12px 16px',
          },
          success: {
            iconTheme: { primary: '#0F9D91', secondary: '#FFFFFF' },
          },
          error: {
            iconTheme: { primary: '#E11D48', secondary: '#FFFFFF' },
          },
        }}
      />
    </div>
  );
};

