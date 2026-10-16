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
  Trash2,
  Clock,
  Printer,
  Stethoscope,
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-navy-950 tracking-tight">Clinical Consultations & EMR</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
              Active Queue
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Record medical diagnoses, prescribe formulary medications, order lab diagnostics, and archive clinical records
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient name, ID, or appointment..."
            className="form-input pl-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="form-select py-1.5 text-xs"
          >
            <option value="">All Statuses</option>
            <option value="SCHEDULED">Scheduled Queue</option>
            <option value="COMPLETED">Completed Consultations</option>
          </select>
        </div>
      </div>

      {/* Appointments & Consultations Table */}
      {loading ? (
        <PageLoader />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Appointment</th>
                <th>Patient Details</th>
                <th>Schedule</th>
                <th>Status</th>
                <th className="text-right">Clinical Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                      <FileText className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">No appointments found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Appointments assigned for consultation will appear in this clinical queue
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((app) => {
                  const patient = typeof app.patientId === 'object' ? app.patientId : null;
                  const isCompleted = app.status === 'COMPLETED';

                  return (
                    <tr key={app._id} className="hover:bg-slate-50/70 transition-colors">
                      <td>
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded border border-navy-100 bg-navy-50/80 text-navy-800">
                          {app.appointmentId}
                        </span>
                        <span className="block text-[11px] text-slate-500 uppercase tracking-wider mt-1 font-medium">
                          {app.type}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {patient?.name?.[0]?.toUpperCase() || 'P'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm leading-snug">
                              {patient?.name || 'Unknown Patient'}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {patient?.patientId} • {patient?.gender} {patient?.bloodGroup ? `• ${patient.bloodGroup}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-slate-800 text-xs font-medium">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatDate(app.date)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <Clock className="w-3 h-3 text-cyan-600" />
                            <span className="font-mono">{app.timeSlot}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={app.status} showDot />
                      </td>
                      <td className="text-right">
                        {isCompleted ? (
                          <button
                            onClick={() => openViewModal(app._id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-navy-50 hover:bg-navy-100 text-navy-900 border border-navy-100 transition-colors shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5 text-cyan-600" />
                            View EMR Record
                          </button>
                        ) : app.status === 'SCHEDULED' ? (
                          <button
                            onClick={() => openCreateModal(app)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-all shadow-sm hover:shadow-md"
                          >
                            <Stethoscope className="w-3.5 h-3.5" />
                            Start Consultation
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No action</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(total / limit) || 1}
            total={total}
            limit={limit}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Modal: Create Consultation Record */}
      {createModalOpen && selectedAppointment && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setCreateModalOpen(false)} />
          <div className="modal-content max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-navy-950 text-white flex items-center justify-between border-b border-navy-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    Medical Consultation Record
                    <span className="text-[10px] font-mono uppercase bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
                      EMR Entry
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Appointment: <span className="font-mono text-cyan-300">{selectedAppointment.appointmentId}</span> • Patient:{' '}
                    <strong className="text-white">
                      {typeof selectedAppointment.patientId === 'object' ? selectedAppointment.patientId.name : ''}
                    </strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto space-y-5">
              {/* Chief Complaint */}
              <div>
                <label className="form-label">
                  Chief Complaint / Observed Symptoms *
                </label>
                <textarea
                  rows={2}
                  {...register('chiefComplaint')}
                  placeholder="e.g. High fever for 3 days with persistent dry cough, headache, and body aches..."
                  className="form-input text-xs"
                />
                {errors.chiefComplaint && (
                  <p className="form-error">{errors.chiefComplaint.message}</p>
                )}
              </div>

              {/* Diagnosis */}
              <div>
                <label className="form-label">
                  Clinical Diagnosis (ICD-10 / Assessment) *
                </label>
                <input
                  type="text"
                  {...register('diagnosis')}
                  placeholder="e.g. Acute Upper Respiratory Tract Infection (URTI)"
                  className="form-input text-xs"
                />
                {errors.diagnosis && (
                  <p className="form-error">{errors.diagnosis.message}</p>
                )}
              </div>

              {/* Prescription Items */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-bold text-navy-950 uppercase tracking-wider">
                      Prescription Formulary (Rx)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      append({ medicine: '', dosage: '', duration: '', instructions: 'After meals' })
                    }
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Medication
                  </button>
                </div>

                <div className="space-y-2.5">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-12 gap-2 bg-white p-3 rounded-lg border border-slate-200 items-end shadow-xs"
                    >
                      <div className="col-span-12 sm:col-span-4">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Medicine Name</label>
                        <input
                          type="text"
                          {...register(`prescription.${index}.medicine` as const)}
                          placeholder="e.g. Amoxicillin 500mg"
                          className="form-input text-xs py-1.5"
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Dosage</label>
                        <input
                          type="text"
                          {...register(`prescription.${index}.dosage` as const)}
                          placeholder="e.g. 1 Tab"
                          className="form-input text-xs py-1.5"
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Duration</label>
                        <input
                          type="text"
                          {...register(`prescription.${index}.duration` as const)}
                          placeholder="e.g. 5 days"
                          className="form-input text-xs py-1.5"
                        />
                      </div>
                      <div className="col-span-10 sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Instructions</label>
                        <input
                          type="text"
                          {...register(`prescription.${index}.instructions` as const)}
                          placeholder="e.g. Twice daily after meals"
                          className="form-input text-xs py-1.5"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1 flex justify-center pb-1">
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove Medication"
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
                  <label className="form-label flex items-center gap-1.5">
                    <TestTube className="w-3.5 h-3.5 text-amber-500" />
                    Recommended Diagnostic Tests (comma-separated)
                  </label>
                  <input
                    type="text"
                    {...register('labTestsInput')}
                    placeholder="e.g. Complete Blood Count (CBC), Serum Electrolytes"
                    className="form-input text-xs"
                  />
                </div>

                <div>
                  <label className="form-label flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                    Follow-Up Review Date (Optional)
                  </label>
                  <input
                    type="date"
                    {...register('followUpDate')}
                    className="form-input text-xs"
                  />
                </div>
              </div>

              {/* Doctor's Notes */}
              <div>
                <label className="form-label">
                  Attending Physician Notes / Lifestyle Directives
                </label>
                <textarea
                  rows={2}
                  {...register('notes')}
                  placeholder="e.g. Recommended hydration of 3L/day, complete rest for 48 hours..."
                  className="form-input text-xs"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="btn-secondary"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-60"
                >
                  <CheckCircle className="w-4 h-4" />
                  {submitting ? 'Saving EMR Record...' : 'Complete & Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Existing Consultation Record */}
      {viewModalOpen && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setViewModalOpen(false)} />
          <div className="modal-content max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            {viewLoading || !selectedConsultation ? (
              <div className="p-16">
                <PageLoader />
              </div>
            ) : (
              <div>
                {/* Header */}
                <div className="px-6 py-4 bg-navy-950 text-white flex items-center justify-between border-b border-navy-800">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        Official Clinical Consultation Summary
                      </h2>
                      <p className="text-xs text-slate-400">
                        Encounter Timestamp: {formatDate(selectedConsultation.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-navy-700"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print EMR
                    </button>
                    <button
                      onClick={() => setViewModalOpen(false)}
                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 flex items-center justify-center transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                  {/* Patient Info Card */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">Patient Information</span>
                      <p className="font-bold text-navy-950 text-sm mt-0.5">
                        {typeof selectedConsultation.patientId === 'object'
                          ? selectedConsultation.patientId.name
                          : 'Patient'}
                      </p>
                      <p className="text-slate-500 font-mono text-xs mt-0.5">
                        ID:{' '}
                        {typeof selectedConsultation.patientId === 'object'
                          ? selectedConsultation.patientId.patientId
                          : '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">Attending Clinician</span>
                      <p className="font-bold text-navy-950 text-sm mt-0.5">
                        {typeof selectedConsultation.doctorId === 'object'
                          ? selectedConsultation.doctorId.name
                          : 'Doctor'}
                      </p>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                        Verified Practitioner
                      </span>
                    </div>
                  </div>

                  {/* Complaint & Diagnosis */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                      <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Chief Complaint
                      </h4>
                      <p className="text-xs text-slate-800 leading-relaxed font-medium">
                        {selectedConsultation.chiefComplaint}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/50">
                      <h4 className="text-[11px] font-bold text-teal-800 uppercase tracking-wider mb-1.5">
                        Clinical Diagnosis
                      </h4>
                      <p className="text-xs font-bold text-teal-950 leading-relaxed">
                        {selectedConsultation.diagnosis}
                      </p>
                    </div>
                  </div>

                  {/* Prescription */}
                  {selectedConsultation.prescription &&
                    selectedConsultation.prescription.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Pill className="w-3.5 h-3.5 text-teal-600" />
                          Prescribed Medications (Rx)
                        </h4>
                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                              <tr>
                                <th className="px-3.5 py-2.5">Medication</th>
                                <th className="px-3.5 py-2.5">Dosage</th>
                                <th className="px-3.5 py-2.5">Duration</th>
                                <th className="px-3.5 py-2.5">Administration Directives</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {selectedConsultation.prescription.map((rx, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/60">
                                  <td className="px-3.5 py-2.5 font-bold text-slate-900">{rx.medicine}</td>
                                  <td className="px-3.5 py-2.5 font-mono text-slate-600">{rx.dosage}</td>
                                  <td className="px-3.5 py-2.5 text-slate-600">{rx.duration}</td>
                                  <td className="px-3.5 py-2.5 text-slate-600">{rx.instructions || '—'}</td>
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
                      <h4 className="text-xs font-bold text-navy-950 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <TestTube className="w-3.5 h-3.5 text-amber-500" />
                        Diagnostic Investigations & Lab Orders
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedConsultation.labTests.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Follow-up & Notes */}
                  {selectedConsultation.followUpDate && (
                    <div className="p-3 bg-cyan-50/70 rounded-xl border border-cyan-200 flex items-center gap-2 text-xs text-cyan-950">
                      <Calendar className="w-4 h-4 text-cyan-700" />
                      <span>Follow-up Recommended on: <strong>{formatDate(selectedConsultation.followUpDate)}</strong></span>
                    </div>
                  )}

                  {selectedConsultation.notes && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Doctor's Clinical Notes
                      </h4>
                      <p className="text-xs text-slate-700 italic">
                        "{selectedConsultation.notes}"
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={() => setViewModalOpen(false)}
                    className="btn-secondary"
                  >
                    Close Record
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

