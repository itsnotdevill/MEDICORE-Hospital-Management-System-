import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Filter, Edit2, X } from 'lucide-react';
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
      toast.success('Appointment scheduled');
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
      toast.success('Appointment cancelled');
      setConfirmCancel(null);
      fetchData();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const canCreate = user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST';

  const STATUS_OPTIONS = ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

  return (
    <div className="animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="page-subtitle">Schedule and manage patient appointments</p>
        </div>
        {canCreate && (
          <button onClick={() => { reset(); setShowModal(true); }} className="btn-primary">
            <Plus className="w-4 h-4" /> Schedule Appointment
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card mb-6 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative sm:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="form-select pl-9"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Appointment ID</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">No appointments found</td>
                </tr>
              ) : (
                appointments.map((apt) => {
                  const patient = typeof apt.patientId === 'object' ? apt.patientId as any : null;
                  const doctor = typeof apt.doctorId === 'object' ? apt.doctorId as any : null;
                  return (
                    <tr key={apt._id}>
                      <td>
                        <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">
                          {apt.appointmentId}
                        </span>
                      </td>
                      <td>
                        <p className="font-medium text-gray-900">{patient?.name || '—'}</p>
                        <p className="text-xs text-gray-400">{patient?.patientId}</p>
                      </td>
                      <td className="text-gray-700">{doctor?.name || '—'}</td>
                      <td>
                        <p className="text-sm text-gray-900">{formatDate(apt.date)}</p>
                        <p className="text-xs text-gray-400">{apt.timeSlot}</p>
                      </td>
                      <td><StatusBadge status={apt.type} /></td>
                      <td><StatusBadge status={apt.status} /></td>
                      <td>
                        <div className="flex items-center gap-1">
                          {apt.status === 'SCHEDULED' && (
                            <>
                              <button
                                onClick={() => setShowStatusModal(apt)}
                                className="p-1.5 text-gray-400 hover:text-[#1e3a5f] hover:bg-[#1e3a5f]/10 rounded-lg transition-colors"
                                title="Update Status"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {user?.role === 'ADMIN' && (
                                <button
                                  onClick={() => setConfirmCancel(apt)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Cancel"
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
          <Pagination currentPage={page} totalPages={Math.ceil(total / limit)} total={total} limit={limit} onPageChange={setPage} />
        </div>
      )}

      {/* Create Appointment Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
          <div className="modal-content max-w-lg">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-lg font-semibold">Schedule Appointment</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="card-body space-y-4">
              <div>
                <label className="form-label">Patient *</label>
                <select {...register('patientId')} className="form-select">
                  <option value="">Select patient...</option>
                  {patients.map((p: any) => (
                    <option key={p._id} value={p._id}>{p.name} ({p.patientId})</option>
                  ))}
                </select>
                {errors.patientId && <p className="form-error">{errors.patientId.message}</p>}
              </div>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Date *</label>
                  <input {...register('date')} type="date" className="form-input" min={new Date().toISOString().split('T')[0]} />
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
                <label className="form-label">Type *</label>
                <select {...register('type')} className="form-select">
                  <option value="CONSULTATION">Consultation</option>
                  <option value="FOLLOW_UP">Follow-Up</option>
                  <option value="EMERGENCY">Emergency</option>
                </select>
              </div>
              <div>
                <label className="form-label">Notes</label>
                <textarea {...register('notes')} className="form-input min-h-[70px] resize-none" placeholder="Any additional notes..." />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Scheduling...' : 'Schedule'}
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
            <div className="card-header flex items-center justify-between">
              <h2 className="text-lg font-semibold">Update Status</h2>
              <button onClick={() => setShowStatusModal(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="card-body space-y-2">
              {['COMPLETED', 'NO_SHOW', 'CANCELLED'].map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(showStatusModal, s)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-[#1e3a5f] hover:bg-[#1e3a5f]/5 transition-colors"
                >
                  <StatusBadge status={s} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmCancel}
        title="Cancel Appointment"
        message={`Cancel appointment ${confirmCancel?.appointmentId}? This action cannot be undone.`}
        confirmLabel="Cancel Appointment"
        onConfirm={handleCancel}
        onCancel={() => setConfirmCancel(null)}
      />
    </div>
  );
};
