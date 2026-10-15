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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'OCCUPIED':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'MAINTENANCE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CLEANING':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getWardColor = (type: string) => {
    switch (type) {
      case 'ICU':
        return 'border-l-4 border-l-red-500';
      case 'EMERGENCY':
        return 'border-l-4 border-l-amber-500';
      case 'PRIVATE_AC':
        return 'border-l-4 border-l-purple-500';
      case 'SEMI_PRIVATE':
        return 'border-l-4 border-l-blue-500';
      default:
        return 'border-l-4 border-l-emerald-500';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ward & Bed Occupancy Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time hospital ward tracking, inpatient bed availability, and ICU status
          </p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Hospital Beds</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalBeds}</p>
            <span className="text-xs text-gray-500 mt-0.5 block">Across all medical floors</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vacant & Ready</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{summary.availableBeds}</p>
            <span className="text-xs text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Available for Admission
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Bed className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Currently Occupied</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{summary.occupiedBeds}</p>
            <span className="text-xs text-red-600 font-medium mt-0.5 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> Admitted Patients
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Filter Beds:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-[#1e3a5f]"
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
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-[#1e3a5f]"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="OCCUPIED">Occupied</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Bed Cards Grid */}
      {loading ? (
        <PageLoader />
      ) : beds.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400 border border-gray-100">
          <Bed className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-base font-medium text-gray-600">No beds match filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {beds.map((b) => {
            const isOccupied = b.status === 'OCCUPIED';
            const patient = typeof b.currentPatientId === 'object' ? b.currentPatientId : null;

            return (
              <div
                key={b._id}
                className={`bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${getWardColor(
                  b.wardType
                )}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-1.5">
                      <Bed className="w-5 h-5 text-[#1e3a5f]" />
                      {b.bedNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(
                        b.status
                      )}`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1">
                    <p className="font-semibold text-gray-700">
                      Ward: {b.wardType.replace('_', ' ')}
                    </p>
                    <p>Floor {b.floor} • Room {b.roomNumber}</p>
                    <p className="font-medium text-gray-900 pt-1">
                      Rate: {formatCurrency(b.dailyRate)} / 24h
                    </p>
                  </div>

                  {isOccupied && patient && (
                    <div className="mt-3 p-2.5 rounded-lg bg-red-50/70 border border-red-100 text-xs">
                      <p className="font-bold text-red-900">{patient.name}</p>
                      <p className="text-[11px] text-red-700">ID: {patient.patientId}</p>
                      {b.admittedAt && (
                        <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Admitted: {formatDate(b.admittedAt)}
                        </p>
                      )}
                    </div>
                  )}

                  {b.notes && (
                    <p className="mt-2 text-[11px] italic text-gray-400 bg-gray-50 p-1.5 rounded">
                      {b.notes}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                  {(user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST') && (
                    <button
                      onClick={() => {
                        setSelectedBed(b);
                        setNewStatus(b.status);
                      }}
                      className="text-xs font-semibold text-[#1e3a5f] hover:text-[#0d9488] transition-colors"
                    >
                      Update Status →
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="px-5 py-4 bg-[#1e3a5f] text-white flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Bed className="w-4 h-4" /> Bed {selectedBed.bedNumber} Status
              </h2>
              <button onClick={() => setSelectedBed(null)} className="text-white/80 hover:text-white">✕</button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Select Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-[#1e3a5f]"
                >
                  <option value="AVAILABLE">AVAILABLE (Vacant & Ready)</option>
                  <option value="OCCUPIED">OCCUPIED (Admitted)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Repair/Sanitizing)</option>
                  <option value="CLEANING">CLEANING (Housekeeping in progress)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBed(null)}
                  className="px-3 py-1.5 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStatusChange}
                  disabled={updating}
                  className="px-4 py-1.5 bg-[#1e3a5f] hover:bg-[#162d4a] text-white rounded-lg font-medium shadow-sm disabled:opacity-60"
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
