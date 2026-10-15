import React, { useEffect, useState, useCallback } from 'react';
import {
  FileText,
  Plus,
  Search,
  Eye,
  Calendar,
  Pill,
  TestTube,
  CheckCircle,
  X,
  Trash2,
  Clock,
  Printer,
} from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { appointmentsApi, consultationsApi } from '../../api';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Pagination } from '../../components/shared/Pagination';
import { PageLoader } from '../../components/shared/LoadingSpinner';
import { formatDate, extractError } from '../../lib/utils';
import type { Appointment, Consultation } from '../../types';

const prescriptionItemSchema = z.object({
  medicine: z.string().min(1, 'Medicine name is required'),
  dosage: z.string().min(1, 'Dosage is required (e.g., 500mg)'),
  duration: z.string().min(1, 'Duration is required (e.g., 5 days)'),
  instructions: z.string().optional(),
});

const consultationSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  chiefComplaint: z.string().min(5, 'Chief complaint must be at least 5 characters'),
  diagnosis: z.string().min(5, 'Diagnosis must be at least 5 characters'),
  prescription: z.array(prescriptionItemSchema).optional(),
  labTestsInput: z.string().optional(),
  followUpDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

type ConsultationFormValues = z.infer<typeof consultationSchema>;

export const ConsultationsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const limit = 10;

  // Selected consultation view state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Create consultation modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ConsultationFormValues>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      prescription: [{ medicine: '', dosage: '', duration: '', instructions: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'prescription',
  });

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await appointmentsApi.getAll({
        page,
        limit,
        status: statusFilter || undefined,
      });
      const data = (res.data as any).data || [];
      setAppointments(data);
      setTotal((res.data as any).pagination?.total || 0);
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const openCreateModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setValue('appointmentId', appointment._id);
    reset({
      appointmentId: appointment._id,
      chiefComplaint: '',
      diagnosis: '',
      prescription: [{ medicine: '', dosage: '', duration: '', instructions: 'After meals' }],
      labTestsInput: '',
      followUpDate: '',
      notes: '',
    });
    setCreateModalOpen(true);
  };

  const openViewModal = async (appointmentId: string) => {
    setViewLoading(true);
    setViewModalOpen(true);
    try {
      const res = await consultationsApi.getByAppointment(appointmentId);
      setSelectedConsultation((res.data as any).data);
    } catch (err) {
      toast.error(extractError(err));
      setViewModalOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const onSubmit = async (values: ConsultationFormValues) => {
    setSubmitting(true);
    try {
      const labTests = values.labTestsInput
        ? values.labTestsInput
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      const payload = {
        appointmentId: values.appointmentId,
        chiefComplaint: values.chiefComplaint,
        diagnosis: values.diagnosis,
        prescription: values.prescription?.filter((p) => p.medicine.trim() !== '') || [],
        labTests,
        followUpDate: values.followUpDate || undefined,
        notes: values.notes || undefined,
      };

      await consultationsApi.create(payload);
      toast.success('Consultation record created successfully!');
      setCreateModalOpen(false);
      fetchAppointments();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAppointments = appointments.filter((app) => {
    if (!search) return true;
    const pat = typeof app.patientId === 'object' ? app.patientId.name : '';
    const patId = typeof app.patientId === 'object' ? app.patientId.patientId : '';
    const q = search.toLowerCase();
    return pat.toLowerCase().includes(q) || patId.toLowerCase().includes(q) || app.appointmentId.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Clinical Consultations</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Record diagnoses, prescribe medications, and manage patient clinical encounters
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient name, ID, or appointment..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
          >
            <option value="">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Appointments & Consultations Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <PageLoader />
        ) : filteredAppointments.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-base font-medium text-gray-600">No appointments found</p>
            <p className="text-xs text-gray-400 mt-1">Appointments assigned to you will appear here for consultation</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/75 border-b border-gray-100 text-xs uppercase font-semibold text-gray-500">
                <tr>
                  <th className="px-5 py-3.5">Appointment</th>
                  <th className="px-5 py-3.5">Patient Details</th>
                  <th className="px-5 py-3.5">Schedule</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Clinical Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAppointments.map((app) => {
                  const patient = typeof app.patientId === 'object' ? app.patientId : null;
                  const isCompleted = app.status === 'COMPLETED';

                  return (
                    <tr key={app._id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-semibold text-gray-900">{app.appointmentId}</span>
                        <span className="block text-xs text-gray-400 uppercase tracking-wider mt-0.5">
                          {app.type}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {patient?.name?.[0] || 'P'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 leading-snug">
                              {patient?.name || 'Unknown Patient'}
                            </p>
                            <p className="text-xs text-gray-400">
                              {patient?.patientId} • {patient?.gender} {patient?.bloodGroup ? `• ${patient.bloodGroup}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-gray-700 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{formatDate(app.date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>{app.timeSlot}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        {isCompleted ? (
                          <button
                            onClick={() => openViewModal(app._id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1e3a5f]/10 text-[#1e3a5f] hover:bg-[#1e3a5f]/20 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Record
                          </button>
                        ) : app.status === 'SCHEDULED' ? (
                          <button
                            onClick={() => openCreateModal(app)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Start Consultation
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No action</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={Math.ceil(total / limit) || 1}
          total={total}
          limit={limit}
          onPageChange={setPage}
        />
      </div>

      {/* Modal: Create Consultation Record */}
      {createModalOpen && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl my-8 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#1e3a5f] to-[#0d9488] text-white flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Medical Consultation Record
                </h2>
                <p className="text-xs text-white/80 mt-0.5">
                  Appointment: {selectedAppointment.appointmentId} • Patient:{' '}
                  {typeof selectedAppointment.patientId === 'object'
                    ? selectedAppointment.patientId.name
                    : ''}
                </p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto space-y-5">
              {/* Chief Complaint */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Chief Complaint *
                </label>
                <textarea
                  rows={2}
                  {...register('chiefComplaint')}
                  placeholder="e.g. High fever for 3 days with persistent dry cough and body ache..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                />
                {errors.chiefComplaint && (
                  <p className="text-xs text-red-500 mt-1">{errors.chiefComplaint.message}</p>
                )}
              </div>

              {/* Diagnosis */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Clinical Diagnosis *
                </label>
                <input
                  type="text"
                  {...register('diagnosis')}
                  placeholder="e.g. Acute Upper Respiratory Tract Infection (URTI)"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                />
                {errors.diagnosis && (
                  <p className="text-xs text-red-500 mt-1">{errors.diagnosis.message}</p>
                )}
              </div>

              {/* Prescription Items */}
              <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200/60">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-[#0d9488]" />
                    <span className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
                      Prescription (Rx)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      append({ medicine: '', dosage: '', duration: '', instructions: 'After meals' })
                    }
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#0d9488] hover:text-[#0b766c]"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Medicine
                  </button>
                </div>

                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-12 gap-2 bg-white p-3 rounded-lg border border-gray-200 items-end"
                    >
                      <div className="col-span-12 sm:col-span-4">
                        <label className="block text-[11px] text-gray-500 mb-0.5">Medicine Name</label>
                        <input
                          type="text"
                          {...register(`prescription.${index}.medicine` as const)}
                          placeholder="e.g. Paracetamol"
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-gray-200 focus:outline-none focus:border-[#1e3a5f]"
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-2">
                        <label className="block text-[11px] text-gray-500 mb-0.5">Dosage</label>
                        <input
                          type="text"
                          {...register(`prescription.${index}.dosage` as const)}
                          placeholder="e.g. 500mg"
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-gray-200 focus:outline-none focus:border-[#1e3a5f]"
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-2">
                        <label className="block text-[11px] text-gray-500 mb-0.5">Duration</label>
                        <input
                          type="text"
                          {...register(`prescription.${index}.duration` as const)}
                          placeholder="e.g. 5 days"
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-gray-200 focus:outline-none focus:border-[#1e3a5f]"
                        />
                      </div>
                      <div className="col-span-10 sm:col-span-3">
                        <label className="block text-[11px] text-gray-500 mb-0.5">Instructions</label>
                        <input
                          type="text"
                          {...register(`prescription.${index}.instructions` as const)}
                          placeholder="e.g. Twice daily"
                          className="w-full px-2.5 py-1.5 text-xs rounded border border-gray-200 focus:outline-none focus:border-[#1e3a5f]"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1 flex justify-center pb-1">
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="text-red-400 hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lab Tests & Follow-Up Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <TestTube className="w-3.5 h-3.5 text-amber-500" />
                    Recommended Lab Tests (comma-separated)
                  </label>
                  <input
                    type="text"
                    {...register('labTestsInput')}
                    placeholder="e.g. Complete Blood Count (CBC), Urine Routine"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    Follow-Up Date (Optional)
                  </label>
                  <input
                    type="date"
                    {...register('followUpDate')}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                  />
                </div>
              </div>

              {/* Doctor's Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Additional Clinical Notes / Advice
                </label>
                <textarea
                  rows={2}
                  {...register('notes')}
                  placeholder="e.g. Drink plenty of warm fluids, bed rest recommended..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-60"
                >
                  <CheckCircle className="w-4 h-4" />
                  {submitting ? 'Saving Record...' : 'Complete & Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Existing Consultation Record */}
      {viewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            {viewLoading || !selectedConsultation ? (
              <div className="p-12">
                <PageLoader />
              </div>
            ) : (
              <div>
                {/* Header */}
                <div className="px-6 py-4 bg-[#1e3a5f] text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold">Consultation Summary</h2>
                      <p className="text-xs text-white/70">
                        Date: {formatDate(selectedConsultation.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-1"
                    >
                      <Printer className="w-4 h-4" /> Print
                    </button>
                    <button
                      onClick={() => setViewModalOpen(false)}
                      className="p-1 text-white/70 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                  {/* Patient Info Card */}
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-gray-400 uppercase font-semibold">Patient:</span>
                      <p className="font-semibold text-gray-800 text-sm mt-0.5">
                        {typeof selectedConsultation.patientId === 'object'
                          ? selectedConsultation.patientId.name
                          : 'Patient'}
                      </p>
                      <p className="text-gray-500">
                        ID:{' '}
                        {typeof selectedConsultation.patientId === 'object'
                          ? selectedConsultation.patientId.patientId
                          : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-400 uppercase font-semibold">Attending Doctor:</span>
                      <p className="font-semibold text-gray-800 text-sm mt-0.5">
                        {typeof selectedConsultation.doctorId === 'object'
                          ? selectedConsultation.doctorId.name
                          : 'Doctor'}
                      </p>
                    </div>
                  </div>

                  {/* Complaint & Diagnosis */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Chief Complaint
                      </h4>
                      <p className="mt-1 text-sm text-gray-800 bg-gray-50/50 p-2.5 rounded-lg border border-gray-100">
                        {selectedConsultation.chiefComplaint}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Diagnosis
                      </h4>
                      <p className="mt-1 text-sm font-semibold text-teal-800 bg-teal-50/70 p-2.5 rounded-lg border border-teal-100">
                        {selectedConsultation.diagnosis}
                      </p>
                    </div>
                  </div>

                  {/* Prescription */}
                  {selectedConsultation.prescription &&
                    selectedConsultation.prescription.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Pill className="w-3.5 h-3.5 text-[#0d9488]" />
                          Prescribed Medications
                        </h4>
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 text-gray-500 uppercase font-semibold">
                              <tr>
                                <th className="px-3 py-2">Medicine</th>
                                <th className="px-3 py-2">Dosage</th>
                                <th className="px-3 py-2">Duration</th>
                                <th className="px-3 py-2">Instructions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700">
                              {selectedConsultation.prescription.map((rx, idx) => (
                                <tr key={idx}>
                                  <td className="px-3 py-2 font-medium text-gray-900">{rx.medicine}</td>
                                  <td className="px-3 py-2">{rx.dosage}</td>
                                  <td className="px-3 py-2">{rx.duration}</td>
                                  <td className="px-3 py-2">{rx.instructions || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                  {/* Lab Tests */}
                  {selectedConsultation.labTests && selectedConsultation.labTests.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <TestTube className="w-3.5 h-3.5 text-amber-500" />
                        Requested Investigations / Tests
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedConsultation.labTests.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Follow-up & Notes */}
                  {selectedConsultation.followUpDate && (
                    <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 flex items-center gap-2 text-xs text-blue-900">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>Follow-up Recommended on: <strong>{formatDate(selectedConsultation.followUpDate)}</strong></span>
                    </div>
                  )}

                  {selectedConsultation.notes && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Doctor's Advice / Notes
                      </h4>
                      <p className="mt-1 text-xs text-gray-600 italic bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                        {selectedConsultation.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => setViewModalOpen(false)}
                    className="px-4 py-1.5 rounded-lg text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
