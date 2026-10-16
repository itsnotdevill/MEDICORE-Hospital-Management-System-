import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Filter, Edit2, X, Calendar, Clock, Stethoscope, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { appointmentsApi, patientsApi, doctorsApi } from '../../api';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Pagination } from '../../components/shared/Pagination';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { PageLoader } from '../../components/shared/LoadingSpinner';
import { formatDate, extractError } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import type { Appointment } from '../../types';

const apptSchema = z.object({
  patientId: z.string().min(1, 'Patient required'),
  doctorId: z.string().min(1, 'Doctor required'),
  departmentId: z.string().min(1, 'Department required'),
  date: z.string().min(1, 'Date required'),
  timeSlot: z.string().regex(/^\d{2}:\d{2}$/, 'Time required (HH:MM)'),
  type: z.enum(['CONSULTATION', 'FOLLOW_UP', 'EMERGENCY']),
  notes: z.string().optional(),
});
type ApptForm = z.infer<typeof apptSchema>;

const TIME_SLOTS = [
  '08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30',
  '16:00','16:30','17:00','17:30',
];

const TODAY_STR = new Date().toISOString().split('T')[0];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'NO_SHOW', label: 'No Show' },
];

export const AppointmentsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState<Appointment | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<Appointment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const limit = 10;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ApptForm>({
    resolver: zodResolver(apptSchema),
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [apptRes, pRes, dRes] = await Promise.all([
        appointmentsApi.getAll({ page, limit, status: statusFilter || undefined }),
        patientsApi.getAll({ limit: 200 }),
        doctorsApi.getAll({ limit: 100 }),
      ]);
      setAppointments((apptRes.data as any).data);
      setTotal((apptRes.data as any).pagination.total);
      setPatients((pRes.data as any).data);
      setDoctors((dRes.data as any).data);
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onSubmit = async (data: ApptForm) => {
    setSubmitting(true);
    try {
      await appointmentsApi.create(data);
      toast.success('Appointment scheduled successfully');
      setShowModal(false);
      reset();
      fetchData();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (apt: Appointment, status: string) => {
    try {
      await appointmentsApi.update(apt._id, { status });
      toast.success(`Appointment marked as ${status}`);
      setShowStatusModal(null);
      fetchData();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const handleCancel = async () => {
    if (!confirmCancel) return;
    try {
      await appointmentsApi.cancel(confirmCancel._id);
      toast.success('Appointment cancelled successfully');
      setConfirmCancel(null);
      fetchData();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const canCreate = user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-navy-950 tracking-tight">Clinical Appointments</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200">
              {total} Booked
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time outpatient scheduling, clinical consultations, and specialist calendar management
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => { reset(); setShowModal(true); }}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" /> Schedule Appointment
          </button>
        )}
      </div>

      {/* Filter and Status Selector Bar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {STATUS_OPTIONS.map((opt) => {
            const isActive = statusFilter === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => { setStatusFilter(opt.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-navy-900 text-white shadow-sm ring-1 ring-navy-900'
                    : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="form-select pl-9 py-1.5 text-xs"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      {loading ? (
        <PageLoader />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Appointment ID</th>
                <th>Patient Details</th>
                <th>Assigned Doctor</th>
                <th>Date & Schedule</th>
                <th>Encounter Type</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">No appointments found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {statusFilter ? 'Try clearing your status filter to see other appointments' : 'Schedule a new appointment to populate this schedule'}
                    </p>
                  </td>
                </tr>
              ) : (
                appointments.map((apt) => {
                  const patient = typeof apt.patientId === 'object' ? apt.patientId as any : null;
                  const doctor = typeof apt.doctorId === 'object' ? apt.doctorId as any : null;
                  return (
                    <tr key={apt._id} className="hover:bg-slate-50/70 transition-colors">
                      <td>
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded border border-navy-100 bg-navy-50/80 text-navy-800 tracking-wider">
                          {apt.appointmentId}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {patient?.name?.[0]?.toUpperCase() || 'P'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm leading-tight">{patient?.name || '—'}</p>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">{patient?.patientId || 'Unregistered'}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-slate-800 text-sm font-medium">
                          <Stethoscope className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                          <span>{doctor?.name || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium text-slate-800 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {formatDate(apt.date)}
                          </p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-cyan-600" />
                            <span className="font-mono">{apt.timeSlot}</span>
                          </p>
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={apt.type} />
                      </td>
                      <td>
                        <StatusBadge status={apt.status} showDot />
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {apt.status === 'SCHEDULED' && (
                            <>
                              <button
                                onClick={() => setShowStatusModal(apt)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-navy-800 bg-navy-50 hover:bg-navy-100 border border-navy-100 transition-colors"
                                title="Update Status"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-cyan-700" />
                                <span>Status</span>
                              </button>
                              {user?.role === 'ADMIN' && (
                                <button
                                  onClick={() => setConfirmCancel(apt)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                  title="Cancel Appointment"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <Pagination currentPage={page} totalPages={Math.ceil(total / limit) || 1} total={total} limit={limit} onPageChange={setPage} />
        </div>
      )}

      {/* Create Appointment Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
          <div className="modal-content max-w-lg">
            <div className="card-header flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-navy-950">Schedule Clinical Appointment</h2>
                  <p className="text-xs text-slate-500">Book outpatient consultation or follow-up session</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="card-body space-y-4 pt-4">
              <div>
                <label className="form-label">Select Patient *</label>
                <select {...register('patientId')} className="form-select">
                  <option value="">Choose patient...</option>
                  {patients.map((p: any) => (
                    <option key={p._id} value={p._id}>{p.name} ({p.patientId})</option>
                  ))}
                </select>
                {errors.patientId && <p className="form-error">{errors.patientId.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Doctor *</label>
                  <select {...register('doctorId')} className="form-select">
                    <option value="">Select doctor...</option>
                    {doctors.map((d: any) => (
                      <option key={d._id} value={d.userId._id}>{d.userId.name} — {d.specialization}</option>
                    ))}
                  </select>
                  {errors.doctorId && <p className="form-error">{errors.doctorId.message}</p>}
                </div>
                <div>
                  <label className="form-label">Department *</label>
                  <select {...register('departmentId')} className="form-select">
                    <option value="">Select department...</option>
                    {doctors.map((d: any) => (
                      <option key={d.departmentId._id} value={d.departmentId._id}>{d.departmentId.name}</option>
                    ))}
                  </select>
                  {errors.departmentId && <p className="form-error">{errors.departmentId.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Date *</label>
                  <input {...register('date')} type="date" className="form-input" min={TODAY_STR} />
                  {errors.date && <p className="form-error">{errors.date.message}</p>}
                </div>
                <div>
                  <label className="form-label">Time Slot *</label>
                  <select {...register('timeSlot')} className="form-select">
                    <option value="">Select time...</option>
                    {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {errors.timeSlot && <p className="form-error">{errors.timeSlot.message}</p>}
                </div>
              </div>

              <div>
                <label className="form-label">Consultation Type *</label>
                <select {...register('type')} className="form-select">
                  <option value="CONSULTATION">General Consultation</option>
                  <option value="FOLLOW_UP">Follow-Up Encounter</option>
                  <option value="EMERGENCY">Emergency Triage</option>
                </select>
              </div>

              <div>
                <label className="form-label">Clinical Notes / Reason for Visit</label>
                <textarea
                  {...register('notes')}
                  className="form-input min-h-[75px] resize-none text-xs"
                  placeholder="Reason for visit, observed symptoms, or special instructions..."
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Scheduling...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setShowStatusModal(null)} />
          <div className="modal-content max-w-sm">
            <div className="card-header flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-navy-950">Update Appointment Status</h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{showStatusModal.appointmentId}</p>
              </div>
              <button
                onClick={() => setShowStatusModal(null)}
                className="w-6 h-6 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="card-body p-4 space-y-2">
              <p className="text-xs text-slate-500 mb-2">Select the operational outcome for this encounter:</p>
              {[
                { status: 'COMPLETED', label: 'Mark as Completed', desc: 'Encounter concluded by doctor', icon: CheckCircle2, color: 'hover:border-emerald-500 hover:bg-emerald-50/40 text-emerald-700' },
                { status: 'NO_SHOW', label: 'Mark as No-Show', desc: 'Patient failed to appear', icon: AlertCircle, color: 'hover:border-amber-500 hover:bg-amber-50/40 text-amber-700' },
                { status: 'CANCELLED', label: 'Cancel Encounter', desc: 'Appointment cancelled', icon: X, color: 'hover:border-red-500 hover:bg-red-50/40 text-red-700' },
              ].map((opt) => (
                <button
                  key={opt.status}
                  onClick={() => updateStatus(showStatusModal, opt.status)}
                  className={`w-full text-left p-3 rounded-xl border border-slate-200 transition-all ${opt.color} group flex items-start gap-3`}
                >
                  <opt.icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900 group-hover:text-inherit">{opt.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!confirmCancel}
        title="Cancel Appointment"
        message={`Are you sure you want to cancel appointment ${confirmCancel?.appointmentId}? This status change will be recorded in the patient encounter history.`}
        confirmLabel="Cancel Appointment"
        onConfirm={handleCancel}
        onCancel={() => setConfirmCancel(null)}
      />
    </div>
  );
};

