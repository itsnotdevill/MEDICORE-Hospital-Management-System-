import React from 'react';
import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { SystemObservabilityBadge } from './SystemObservabilityModal';
import { useAuthStore } from '../../store/authStore';
import { getRoleLabel } from '../../lib/utils';
import type { UserRole } from '../../types';
import { Shield } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      {/* Main content area with top header */}
      <div className="flex-1 md:ml-60 flex flex-col h-screen overflow-hidden transition-all duration-300">
        {/* Sleek Top Navigation Bar */}
        <header className="bg-white border-b border-gray-200/80 px-6 py-3 flex items-center justify-between shadow-xs z-20">
          <div className="flex items-center gap-3">
            {/* Mobile spacer */}
            <div className="md:hidden w-8" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#1e3a5f]">
                  MediCore HMS Platform
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Shield className="w-3 h-3 text-emerald-600" />
                  Verified & Validated
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-gray-500">
                Hospital Operational Workflow & Real-Time Clinical Data Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* System Observability & Database Connection Badge */}
            <SystemObservabilityBadge />

            {/* User chip */}
            {user && (
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-gray-200">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#1e3a5f] to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                  {user.name.charAt(0)}
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-800 leading-tight">{user.name}</p>
                  <p className="text-[10px] text-teal-600 font-medium">
                    {getRoleLabel(user.role as UserRole)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#1f2937',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            borderRadius: '10px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#0d9488', secondary: '#fff' } },
          error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
        }}
      />
    </div>
  );
};
