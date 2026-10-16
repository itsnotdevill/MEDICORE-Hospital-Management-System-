import React, { useEffect, useState, useCallback } from 'react';
import {
  Bed,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Activity,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { bedsApi } from '../../api';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { PageLoader } from '../../components/shared/LoadingSpinner';
import { formatCurrency, formatDate, extractError } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import type { WardBed } from '../../types';

export const WardBedsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [beds, setBeds] = useState<WardBed[]>([]);
  const [summary, setSummary] = useState({ totalBeds: 0, availableBeds: 0, occupiedBeds: 0 });
  const [loading, setLoading] = useState(true);
  const [wardFilter, setWardFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Status update modal
  const [selectedBed, setSelectedBed] = useState<WardBed | null>(null);
  const [newStatus, setNewStatus] = useState<string>('AVAILABLE');
  const [updating, setUpdating] = useState(false);

  const fetchBeds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bedsApi.getAll({
        wardType: wardFilter || undefined,
        status: statusFilter || undefined,
      });
      setBeds((res.data as any).data || []);
      if ((res.data as any).summary) {
        setSummary((res.data as any).summary);
      }
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [wardFilter, statusFilter]);

  useEffect(() => {
    fetchBeds();
  }, [fetchBeds]);

  const handleStatusChange = async () => {
    if (!selectedBed) return;
    setUpdating(true);
    try {
      await bedsApi.updateStatus(selectedBed._id, { status: newStatus });
      toast.success(`Bed ${selectedBed.bedNumber} status updated to ${newStatus}`);
      setSelectedBed(null);
      fetchBeds();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setUpdating(false);
    }
  };

  const getWardBadge = (type: string) => {
    switch (type) {
      case 'ICU':
        return { label: 'Intensive Care Unit (ICU)', color: 'bg-red-50 text-red-700 border-red-200' };
      case 'EMERGENCY':
        return { label: 'Emergency Room', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'PRIVATE_AC':
        return { label: 'Private Deluxe AC', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'SEMI_PRIVATE':
        return { label: 'Semi-Private Room', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      default:
        return { label: 'General Ward', color: 'bg-teal-50 text-teal-700 border-teal-200' };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-navy-950 tracking-tight">Ward & Bed Occupancy Command</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200">
              Live Inpatient Tracking
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time hospital ward tracking, inpatient bed availability, ICU status, and admission allocations
          </p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Hospital Beds</p>
            <p className="text-2xl font-bold text-navy-950 mt-1">{summary.totalBeds}</p>
            <span className="text-xs text-slate-500 mt-0.5 block">Across all clinical floors</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-navy-50 border border-navy-100 text-navy-800 flex items-center justify-center">
            <Layers className="w-6 h-6 text-cyan-600" />
          </div>
        </div>

        <div className="card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vacant & Ready</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{summary.availableBeds}</p>
            <span className="text-xs text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Immediate Admission
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
            <Bed className="w-6 h-6" />
          </div>
        </div>

        <div className="card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Currently Occupied</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{summary.occupiedBeds}</p>
            <span className="text-xs text-amber-700 font-semibold mt-0.5 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> Admitted Inpatients
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-navy-950 uppercase tracking-wider">Filter Beds Registry:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="form-select py-1.5 text-xs w-full sm:w-auto"
          >
            <option value="">All Ward Types</option>
            <option value="GENERAL">General Ward</option>
            <option value="SEMI_PRIVATE">Semi-Private Ward</option>
            <option value="PRIVATE_AC">Private AC Room</option>
            <option value="ICU">Intensive Care Unit (ICU)</option>
            <option value="EMERGENCY">Emergency Room</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select py-1.5 text-xs w-full sm:w-auto"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available (Vacant)</option>
            <option value="OCCUPIED">Occupied (Admitted)</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="CLEANING">Cleaning & Sanitization</option>
          </select>
        </div>
      </div>

      {/* Bed Cards Grid */}
      {loading ? (
        <PageLoader />
      ) : beds.length === 0 ? (
        <div className="card p-16 text-center text-slate-400">
          <Bed className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-base font-semibold text-slate-700">No beds match filter</p>
          <p className="text-xs text-slate-400 mt-1">Adjust your ward category or status filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {beds.map((b) => {
            const isOccupied = b.status === 'OCCUPIED';
            const patient = typeof b.currentPatientId === 'object' ? b.currentPatientId : null;
            const wardInfo = getWardBadge(b.wardType);

            return (
              <div
                key={b._id}
                className="card p-5 flex flex-col justify-between transition-all hover:shadow-card-hover"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-base font-bold text-navy-950 tracking-tight flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-navy-50 border border-navy-100 flex items-center justify-center text-navy-800">
                        <Bed className="w-4 h-4 text-cyan-600" />
                      </div>
                      {b.bedNumber}
                    </span>
                    <StatusBadge status={b.status} showDot />
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${wardInfo.color}`}>
                      {wardInfo.label}
                    </span>
                    <p className="text-slate-500">
                      Floor <strong className="text-slate-700">{b.floor}</strong> • Room <strong className="text-slate-700">{b.roomNumber}</strong>
                    </p>
                    <p className="font-semibold text-navy-900 pt-0.5">
                      Rate: {formatCurrency(b.dailyRate)} / 24h
                    </p>
                  </div>

                  {isOccupied && patient && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs">
                      <p className="font-bold text-amber-950">{patient.name}</p>
                      <p className="text-[11px] text-amber-800 font-mono mt-0.5">ID: {patient.patientId}</p>
                      {b.admittedAt && (
                        <p className="text-[10px] text-amber-700 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Admitted: {formatDate(b.admittedAt)}
                        </p>
                      )}
                    </div>
                  )}

                  {b.notes && (
                    <p className="mt-2 text-[11px] italic text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {b.notes}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                  {(user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST') && (
                    <button
                      onClick={() => {
                        setSelectedBed(b);
                        setNewStatus(b.status);
                      }}
                      className="text-xs font-semibold text-navy-900 hover:text-cyan-700 transition-colors flex items-center gap-1"
                    >
                      <span>Update Status</span>
                      <span>→</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bed Status Update Modal */}
      {selectedBed && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setSelectedBed(null)} />
          <div className="modal-content max-w-sm p-0 overflow-hidden">
            <div className="px-5 py-4 bg-navy-950 text-white flex items-center justify-between border-b border-navy-800">
              <div className="flex items-center gap-2">
                <Bed className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white">Bed {selectedBed.bedNumber} Status</h2>
              </div>
              <button
                onClick={() => setSelectedBed(null)}
                className="w-6 h-6 rounded text-slate-400 hover:text-white hover:bg-navy-800 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="form-label mb-1.5">Operational Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="form-select text-xs"
                >
                  <option value="AVAILABLE">AVAILABLE (Vacant & Ready for Admission)</option>
                  <option value="OCCUPIED">OCCUPIED (Inpatient Admitted)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Repair / Sanitizing)</option>
                  <option value="CLEANING">CLEANING (Housekeeping in progress)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedBed(null)}
                  className="btn-secondary py-1.5 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStatusChange}
                  disabled={updating}
                  className="btn-primary py-1.5 text-xs"
                >
                  {updating ? 'Saving...' : 'Update Bed'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

