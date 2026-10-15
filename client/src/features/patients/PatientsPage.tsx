import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Eye, Edit2 } from 'lucide-react';
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
          <h1 className="page-title">Patients</h1>
          <p className="page-subtitle">Register and manage patient records</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Register Patient
        </button>
      </div>

      <div className="card mb-6 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or patient ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="form-input pl-9"
          />
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Patient ID</th>
                <th>Age / Gender</th>
                <th>Phone</th>
                <th>Blood Group</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    No patients found
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {patient.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{patient.name}</p>
                          <p className="text-xs text-gray-400">{patient.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                        {patient.patientId}
                      </span>
                    </td>
                    <td>
                      <p className="text-sm text-gray-700">{calculateAge(patient.dob)} yrs</p>
                      <p className="text-xs text-gray-400">{patient.gender}</p>
                    </td>
                    <td className="text-gray-600">{patient.phone}</td>
                    <td>
                      {patient.bloodGroup ? (
                        <span className="text-xs font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded">
                          {patient.bloodGroup}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="text-gray-500 text-sm">{formatDate(patient.createdAt)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/patients/${patient._id}`)}
                          className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(patient)}
                          className="p-1.5 text-gray-400 hover:text-[#1e3a5f] hover:bg-[#1e3a5f]/10 rounded-lg transition-colors"
                          title="Edit"
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
          <Pagination currentPage={page} totalPages={Math.ceil(total / limit)} total={total} limit={limit} onPageChange={setPage} />
        </div>
      )}

      {/* Patient Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
          <div className="modal-content max-w-2xl">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editingPatient ? 'Edit Patient' : 'Register New Patient'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="card-body">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="form-label">Full Name *</label>
                  <input {...register('name')} className="form-input" placeholder="Patient's full name" />
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
                  <label className="form-label">Phone *</label>
                  <input {...register('phone')} className="form-input" placeholder="+91-9000000000" />
                  {errors.phone && <p className="form-error">{errors.phone.message}</p>}
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input {...register('email')} type="email" className="form-input" placeholder="Optional" />
                </div>
                <div>
                  <label className="form-label">Blood Group</label>
                  <select {...register('bloodGroup')} className="form-select">
                    <option value="">Unknown</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Address *</label>
                  <input {...register('address')} className="form-input" placeholder="Full address" />
                  {errors.address && <p className="form-error">{errors.address.message}</p>}
                </div>

                <div className="col-span-2">
                  <p className="text-sm font-semibold text-gray-700 mb-3 pt-2 border-t">Emergency Contact</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="form-label">Name *</label>
                      <input {...register('emergencyContact.name')} className="form-input" placeholder="Contact name" />
                      {errors['emergencyContact.name'] && <p className="form-error">{errors['emergencyContact.name'].message}</p>}
                    </div>
                    <div>
                      <label className="form-label">Phone *</label>
                      <input {...register('emergencyContact.phone')} className="form-input" placeholder="Phone" />
                      {errors['emergencyContact.phone'] && <p className="form-error">{errors['emergencyContact.phone'].message}</p>}
                    </div>
                    <div>
                      <label className="form-label">Relation *</label>
                      <input {...register('emergencyContact.relation')} className="form-input" placeholder="e.g., Spouse" />
                      {errors['emergencyContact.relation'] && <p className="form-error">{errors['emergencyContact.relation'].message}</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 mt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Saving...' : editingPatient ? 'Update Patient' : 'Register Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
