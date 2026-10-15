import React, { useEffect, useState } from 'react';
import {
  Users,
  CalendarDays,
  TrendingUp,
  Receipt,
  Stethoscope,
  Activity,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { reportsApi } from '../../api';
import { formatCurrency, extractError } from '../../lib/utils';
import { PageLoader } from '../../components/shared/LoadingSpinner';
import type { DashboardStats } from '../../types';
import toast from 'react-hot-toast';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: '#3b82f6',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
  NO_SHOW: '#9ca3af',
};

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi
      .getDashboard()
      .then((res) => setStats(res.data.data))
      .catch((err) => toast.error(extractError(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader label="Loading dashboard..." />;
  if (!stats) return null;

  const revenueData = stats.revenueByMonth.map((d) => ({
    month: MONTHS[d._id.month - 1],
    revenue: d.revenue,
  }));

  const pieData = stats.appointmentsByStatus.map((d) => ({
    name: d._id,
    value: d.count,
    color: STATUS_COLORS[d._id] || '#6b7280',
  }));

  const statCards = [
    {
      label: 'Total Patients',
      value: stats.totalPatients.toLocaleString(),
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
      border: 'border-l-4 border-blue-500',
    },
    {
      label: "Today's Appointments",
      value: stats.todayAppointments.toLocaleString(),
      icon: CalendarDays,
      color: 'bg-teal-50 text-teal-600',
      border: 'border-l-4 border-teal-500',
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: TrendingUp,
      color: 'bg-green-50 text-green-600',
      border: 'border-l-4 border-green-500',
    },
    {
      label: 'Pending Invoices',
      value: stats.pendingInvoices.toLocaleString(),
      icon: Receipt,
      color: 'bg-amber-50 text-amber-600',
      border: 'border-l-4 border-amber-500',
    },
    {
      label: 'Active Doctors',
      value: stats.totalDoctors.toLocaleString(),
      icon: Stethoscope,
      color: 'bg-purple-50 text-purple-600',
      border: 'border-l-4 border-purple-500',
    },
    {
      label: 'Total Appointments',
      value: stats.totalAppointments.toLocaleString(),
      icon: Activity,
      color: 'bg-indigo-50 text-indigo-600',
      border: 'border-l-4 border-indigo-500',
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of hospital operations</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className={`stat-card ${card.border}`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Revenue Overview</h2>
              <p className="text-sm text-gray-500">Monthly revenue from paid invoices</p>
            </div>
          </div>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => [formatCurrency(Number(v) || 0), 'Revenue']} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="revenue" stroke="#1e3a5f" strokeWidth={2.5} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-gray-400">
              <p className="text-sm">No revenue data yet. Seed some paid invoices.</p>
            </div>
          )}
        </div>

        {/* Appointment Status Pie */}
        <div className="card p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Appointments</h2>
            <p className="text-sm text-gray-500">By status</p>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                />
                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-gray-400 text-sm">
              No appointment data yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
