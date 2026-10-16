import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Eye, Edit2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { patientsApi } from '../../api';
import { Pagination } from '../../components/shared/Pagination';
import { PageLoader } from '../../components/shared/LoadingSpinner';
import { formatDate, calculateAge, extractError } from '../../lib/utils';
import type { Patient } from '../../types';

const patientSchema = z.object({
  name: z.string().min(2, 'Name required'),
  dob: z.string().min(1, 'Date of birth required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  phone: z.string().min(7, 'Phone required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().min(5, 'Address required'),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '']).optional(),
  'emergencyContact.name': z.string().min(2, 'Emergency contact name required'),
  'emergencyContact.phone': z.string().min(7, 'Emergency contact phone required'),
  'emergencyContact.relation': z.string().min(2, 'Relation required'),
});

type FormData = z.infer<typeof patientSchema>;

export const PatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const limit = 10;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(patientSchema),
  });

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await patientsApi.getAll({ page, limit, search });
      setPatients(res.data.data as any);
      setTotal((res.data as any).pagination.total);
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const openCreate = () => {
    setEditingPatient(null);
    reset();
    setShowModal(true);
  };

  const openEdit = (patient: Patient) => {
    setEditingPatient(patient);
    reset({
      name: patient.name,
      dob: patient.dob.split('T')[0],
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email || '',
      address: patient.address,
      bloodGroup: (patient.bloodGroup as any) || '',
      'emergencyContact.name': patient.emergencyContact.name,
      'emergencyContact.phone': patient.emergencyContact.phone,
      'emergencyContact.relation': patient.emergencyContact.relation,
    });
    setShowModal(true);
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const payload = {
        name: data.name,
        dob: data.dob,
        gender: data.gender,
        phone: data.phone,
        email: data.email || undefined,
        address: data.address,
        bloodGroup: data.bloodGroup || undefined,
        emergencyContact: {
          name: data['emergencyContact.name'],
          phone: data['emergencyContact.phone'],
          relation: data['emergencyContact.relation'],
        },
        allergies: [],
      };

      if (editingPatient) {
        await patientsApi.update(editingPatient._id, payload);
        toast.success('Patient updated');
      } else {
        await patientsApi.create(payload);
        toast.success('Patient registered');
      }
      setShowModal(false);
      fetchPatients();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Users className="w-6 h-6 text-[#19B8C9]" />
            Patient Registry & Medical Records
          </h1>
          <p className="page-subtitle">
            Search, register, and manage electronic health records (EHR) for hospital patients
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4 text-[#19B8C9]" /> Register New Patient
        </button>
      </div>

      <div className="card mb-6 p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search patients by full name, phone number, or unique Patient ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="form-input pl-10 pr-4"
          />
        </div>
      </div>

      {loading ? (
        <PageLoader label="Fetching patient clinical records..." />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Patient Details</th>
                <th>Patient ID</th>
                <th>Age / Gender</th>
                <th>Phone Number</th>
                <th>Blood Group</th>
                <th>Registration Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E9F0]">
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-600">No patient records found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try searching with a different name or register a new patient</p>
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient._id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#101B2D] to-[#17263D] border border-[#17263D] flex items-center justify-center text-[#19B8C9] text-xs font-bold shadow-xs flex-shrink-0">
                          {patient.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#172337] truncate">{patient.name}</p>
                          <p className="text-xs text-slate-400 truncate">{patient.email || 'No email registered'}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 font-semibold">
                        {patient.patientId}
                      </span>
                    </td>
                    <td>
                      <p className="text-xs sm:text-sm font-medium text-[#172337]">{calculateAge(patient.dob)} yrs</p>
                      <p className="text-[11px] text-slate-400 font-medium capitalize">{patient.gender.toLowerCase()}</p>
                    </td>
                    <td className="text-xs sm:text-sm text-slate-600 font-medium">{patient.phone}</td>
                    <td>
                      {patient.bloodGroup ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {patient.bloodGroup}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="text-xs text-slate-500 font-medium">{formatDate(patient.createdAt)}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/patients/${patient._id}`)}
                          className="p-1.5 text-slate-400 hover:text-[#0F9D91] hover:bg-teal-50 rounded-lg transition-colors"
                          title="View Patient Chart"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(patient)}
                          className="p-1.5 text-slate-400 hover:text-[#101B2D] hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Patient Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <Pagination currentPage={page} totalPages={Math.ceil(total / limit) || 1} total={total} limit={limit} onPageChange={setPage} />
        </div>
      )}

      {/* Patient Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
          <div className="modal-content max-w-2xl">
            <div className="card-header flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#19B8C9]" />
                <h2 className="text-base font-bold text-[#172337]">
                  {editingPatient ? 'Update Patient Record' : 'Register New Hospital Patient'}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="card-body">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="form-label">Patient Full Name *</label>
                  <input {...register('name')} className="form-input" placeholder="e.g. Ramesh Kumar Patel" />
                  {errors.name && <p className="form-error">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="form-label">Date of Birth *</label>
                  <input {...register('dob')} type="date" className="form-input" />
                  {errors.dob && <p className="form-error">{errors.dob.message}</p>}
                </div>
                <div>
                  <label className="form-label">Gender *</label>
                  <select {...register('gender')} className="form-select">
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Contact Phone *</label>
                  <input {...register('phone')} className="form-input" placeholder="+91 98000 00000" />
                  {errors.phone && <p className="form-error">{errors.phone.message}</p>}
                </div>
                <div>
                  <label className="form-label">Email Address</label>
                  <input {...register('email')} type="email" className="form-input" placeholder="Optional patient email" />
                </div>
                <div>
                  <label className="form-label">Blood Group</label>
                  <select {...register('bloodGroup')} className="form-select">
                    <option value="">Unknown / Pending Lab</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Residential Address *</label>
                  <input {...register('address')} className="form-input" placeholder="Street, City, Postal Code" />
                  {errors.address && <p className="form-error">{errors.address.message}</p>}
                </div>

                <div className="sm:col-span-2 bg-[#F8FAFC] p-4 rounded-xl border border-[#E3E9F0]">
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Emergency Contact Information</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="form-label">Contact Name *</label>
                      <input {...register('emergencyContact.name')} className="form-input" placeholder="Relative name" />
                      {errors['emergencyContact.name'] && <p className="form-error">{errors['emergencyContact.name'].message}</p>}
                    </div>
                    <div>
                      <label className="form-label">Emergency Phone *</label>
                      <input {...register('emergencyContact.phone')} className="form-input" placeholder="Contact number" />
                      {errors['emergencyContact.phone'] && <p className="form-error">{errors['emergencyContact.phone'].message}</p>}
                    </div>
                    <div>
                      <label className="form-label">Relation *</label>
                      <input {...register('emergencyContact.relation')} className="form-input" placeholder="e.g. Spouse / Sibling" />
                      {errors['emergencyContact.relation'] && <p className="form-error">{errors['emergencyContact.relation'].message}</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 justify-end pt-4 mt-5 border-t border-[#E3E9F0]">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Saving Patient Record...' : editingPatient ? 'Update Patient' : 'Register Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

