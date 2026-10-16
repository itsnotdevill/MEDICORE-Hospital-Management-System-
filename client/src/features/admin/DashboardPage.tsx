import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CalendarDays,
  TrendingUp,
  Receipt,
  Stethoscope,
  Activity,
  Calendar,
  ArrowUpRight,
  PlusCircle,
  FileText,
  UserPlus,
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
import { useAuthStore } from '../../store/authStore';
import { formatCurrency, extractError } from '../../lib/utils';
import { PageLoader } from '../../components/shared/LoadingSpinner';
import type { DashboardStats } from '../../types';
import toast from 'react-hot-toast';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: '#2563EB',
  COMPLETED: '#0F9D91',
  CANCELLED: '#E11D48',
  NO_SHOW: '#94A3B8',
};

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [todayStr, setTodayStr] = useState('');

  useEffect(() => {
    setTodayStr(
      new Date().toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    );
  }, []);

  useEffect(() => {
    reportsApi
      .getDashboard()
      .then((res) => setStats(res.data.data))
      .catch((err) => toast.error(extractError(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader label="Aggregating clinical metrics & financial ledger..." />;
  if (!stats) return null;

  const revenueData = stats.revenueByMonth.map((d) => ({
    month: MONTHS[d._id.month - 1],
    revenue: d.revenue,
  }));

  const pieData = stats.appointmentsByStatus.map((d) => ({
    name: d._id.replace('_', ' '),
    value: d.count,
    color: STATUS_COLORS[d._id] || '#64748B',
  }));

  const statCards = [
    {
      label: 'Total Registered Patients',
      value: stats.totalPatients.toLocaleString(),
      icon: Users,
      iconBg: 'bg-cyan-50 text-[#19B8C9] border border-cyan-200/60',
      borderAccent: 'border-l-4 border-l-[#19B8C9]',
      description: 'Active medical records',
    },
    {
      label: "Today's Clinical Appointments",
      value: stats.todayAppointments.toLocaleString(),
      icon: CalendarDays,
      iconBg: 'bg-teal-50 text-[#0F9D91] border border-teal-200/60',
      borderAccent: 'border-l-4 border-l-[#0F9D91]',
      description: 'Consultations scheduled',
    },
    {
      label: 'Total Realized Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: TrendingUp,
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60',
      borderAccent: 'border-l-4 border-l-emerald-500',
      description: 'Cleared patient payments',
    },
    {
      label: 'Outstanding Invoices',
      value: stats.pendingInvoices.toLocaleString(),
      icon: Receipt,
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-200/60',
      borderAccent: 'border-l-4 border-l-amber-500',
      description: 'Awaiting balance clearance',
    },
    {
      label: 'Active Attending Doctors',
      value: stats.totalDoctors.toLocaleString(),
      icon: Stethoscope,
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-200/60',
      borderAccent: 'border-l-4 border-l-blue-500',
      description: 'Specialists & Physicians',
    },
    {
      label: 'Total Appointments Booked',
      value: stats.totalAppointments.toLocaleString(),
      icon: Activity,
      iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-200/60',
      borderAccent: 'border-l-4 border-l-indigo-500',
      description: 'Cumulative OPD load',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#101B2D] via-[#17263D] to-[#123048] rounded-2xl p-6 sm:p-7 text-white shadow-card border border-[#17263D] relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-[#19B8C9]/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#19B8C9]/20 text-[#83E2EB] border border-[#19B8C9]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#19B8C9] animate-pulse" />
                Live Operational Command Center
              </span>
              <span className="text-xs text-slate-400 font-medium hidden sm:inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {todayStr}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.name || 'Administrator'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300/90 mt-1 max-w-xl">
              Real-time monitoring of hospital inpatient capacity, outpatient triage, doctor allocations, and financial reconciliations.
            </p>
          </div>

          {/* Quick clinical shortcut buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 md:pt-0">
            <Link
              to="/appointments"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#19B8C9] text-white hover:bg-[#1397A6] transition-colors shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              Schedule Appt
            </Link>
            <Link
              to="/patients"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Register Patient
            </Link>
            <Link
              to="/invoices"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Generate Bill
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`card p-5 hover:shadow-card-hover transition-all duration-200 group ${card.borderAccent}`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#65748B] uppercase tracking-wider">
                  {card.label}
                </p>
                <p className="text-2xl font-bold text-[#172337] tracking-tight">
                  {card.value}
                </p>
                <p className="text-[11px] text-[#65748B] flex items-center gap-1 pt-1">
                  <span className="w-1 h-1 rounded-full bg-[#19B8C9]" />
                  {card.description}
                </p>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${card.iconBg}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics & Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-[#E3E9F0] gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#172337] tracking-tight">Hospital Revenue Flow</h2>
                <span className="text-[10px] font-semibold bg-teal-50 text-[#0F9D91] px-2 py-0.5 rounded-full border border-teal-200">
                  Paid Invoices
                </span>
              </div>
              <p className="text-xs text-[#65748B] mt-0.5">
                Monthly trends for outpatient consultations and itemized hospital procedures
              </p>
            </div>
            <Link
              to="/invoices"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F9D91] hover:text-[#0D7F76] transition-colors"
            >
              View ledger <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {revenueData.length > 0 ? (
            <div className="w-full h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#19B8C9" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0F9D91" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(v: any) => [formatCurrency(Number(v) || 0), 'Cleared Revenue']}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E3E9F0',
                      boxShadow: '0 10px 25px -5px rgba(16, 27, 45, 0.1)',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#172337',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#19B8C9"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#101B2D', stroke: '#19B8C9', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#19B8C9', stroke: '#FFFFFF', strokeWidth: 2 }}
                    fill="url(#revenueGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[280px] flex flex-col items-center justify-center text-slate-400 text-center p-6">
              <TrendingUp className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-xs sm:text-sm font-medium text-slate-600">No revenue data recorded yet</p>
              <p className="text-[11px] text-slate-400 mt-1">Paid invoices will automatically populate this financial curve</p>
            </div>
          )}
        </div>

        {/* Appointment Status Pie / Donut */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E3E9F0]">
              <div>
                <h2 className="text-base font-bold text-[#172337] tracking-tight">Appointment Triage</h2>
                <p className="text-xs text-[#65748B] mt-0.5">Distribution by operational status</p>
              </div>
              <Link
                to="/appointments"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#19B8C9] hover:text-[#1397A6] transition-colors"
              >
                Schedule <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {pieData.length > 0 ? (
              <div className="w-full h-[230px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-xs text-slate-600 font-medium capitalize">{value}</span>}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '10px',
                        border: '1px solid #E3E9F0',
                        boxShadow: '0 8px 16px rgba(16, 27, 45, 0.08)',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[230px] flex flex-col items-center justify-center text-slate-400 text-center p-6">
                <Activity className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-xs sm:text-sm font-medium text-slate-600">No appointment records yet</p>
                <p className="text-[11px] text-slate-400 mt-1">Bookings will display status distributions here</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#E3E9F0] text-center">
            <span className="text-[11px] text-[#65748B] font-medium">
              Total Managed: <strong className="text-[#172337]">{stats.totalAppointments} consultations</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

