import React, { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Stethoscope,
  Star,
  Clock,
  Mail,
  CheckCircle2,
  Plus,
  Edit2,
  Trash2,
  X,
  Phone,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { doctorsApi, departmentsApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { PageLoader } from '../../components/shared/LoadingSpinner';
import { Pagination } from '../../components/shared/Pagination';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { extractError, formatCurrency } from '../../lib/utils';
import type { Department, Doctor, ScheduleSlot } from '../../types';

const DAY_LABELS: Record<string, string> = {
  MON: 'Mon',
  TUE: 'Tue',
  WED: 'Wed',
  THU: 'Thu',
  FRI: 'Fri',
  SAT: 'Sat',
  SUN: 'Sun',
};

const ALL_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;

const doctorFormSchema = z.object({
  name: z.string().min(2, 'Doctor name must be at least 2 characters'),
  email: z.string().email('Valid hospital or Google email is required'),
  password: z.string().optional(),
  phone: z.string().optional(),
  departmentId: z.string().min(1, 'Please select a hospital department'),
  specialization: z.string().min(2, 'Specialization is required (e.g. Cardiology)'),
  qualification: z.string().min(2, 'Qualifications required (e.g. MBBS, MD)'),
  experience: z.coerce.number().min(0, 'Experience must be 0 or more years'),
  consultationFee: z.coerce.number().min(0, 'Consultation fee must be non-negative'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  bio: z.string().optional(),
});

type DoctorFormData = z.infer<typeof doctorFormSchema>;

export const DoctorsPage: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 9;

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [deletingDoctor, setDeletingDoctor] = useState<Doctor | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Consulting schedule days selection
  const [selectedDays, setSelectedDays] = useState<string[]>(['MON', 'WED', 'FRI']);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<DoctorFormData>({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: 'Password123!',
      phone: '',
      departmentId: '',
      specialization: '',
      qualification: 'MBBS, MD',
      experience: 5,
      consultationFee: 700,
      startTime: '09:00',
      endTime: '13:00',
      bio: '',
    },
  });

  const enteredEmail = watch('email');

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await doctorsApi.getAll({ page, limit });
      const data = (res.data as any).data as Doctor[];
      const filtered = search
        ? data.filter(
            (d) =>
              d.userId.name.toLowerCase().includes(search.toLowerCase()) ||
              d.specialization.toLowerCase().includes(search.toLowerCase()) ||
              d.departmentId?.name?.toLowerCase().includes(search.toLowerCase()) ||
              d.userId.email.toLowerCase().includes(search.toLowerCase())
          )
        : data;
      setDoctors(filtered);
      setTotal((res.data as any).pagination?.total || data.length);
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await departmentsApi.getAll({ limit: 100 });
      setDepartments((res.data as any).data || []);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const openCreateModal = () => {
    setEditingDoctor(null);
    setSelectedDays(['MON', 'WED', 'FRI']);
    reset({
      name: 'Dr. ',
      email: '',
      password: 'Password123!',
      phone: '',
      departmentId: departments[0]?._id || '',
      specialization: '',
      qualification: 'MBBS, MD',
      experience: 5,
      consultationFee: 700,
      startTime: '09:00',
      endTime: '13:00',
      bio: '',
    });
    setShowModal(true);
  };

  const openEditModal = (doc: Doctor) => {
    setEditingDoctor(doc);
    const days = doc.schedule?.map((s) => s.day) || ['MON', 'WED', 'FRI'];
    setSelectedDays(days);
    const start = doc.schedule?.[0]?.startTime || '09:00';
    const end = doc.schedule?.[0]?.endTime || '13:00';

    reset({
      name: doc.userId.name,
      email: doc.userId.email,
      phone: doc.userId.phone || '',
      departmentId: doc.departmentId?._id || '',
      specialization: doc.specialization,
      qualification: doc.qualification,
      experience: doc.experience,
      consultationFee: doc.consultationFee,
      startTime: start,
      endTime: end,
      bio: doc.bio || '',
    });
    setShowModal(true);
  };

  const onSubmit = async (data: DoctorFormData) => {
    if (selectedDays.length === 0) {
      toast.error('Please select at least one consulting day');
      return;
    }

    const schedulePayload: ScheduleSlot[] = selectedDays.map((day) => ({
      day: day as any,
      startTime: data.startTime,
      endTime: data.endTime,
    }));

    setSubmitting(true);
    try {
      if (editingDoctor) {
        await doctorsApi.update(editingDoctor._id, {
          name: data.name,
          phone: data.phone,
          email: data.email,
          departmentId: data.departmentId,
          specialization: data.specialization,
          qualification: data.qualification,
          experience: data.experience,
          consultationFee: data.consultationFee,
          schedule: schedulePayload,
          bio: data.bio,
        });
        toast.success(`Doctor profile for ${data.name} updated successfully!`);
      } else {
        await doctorsApi.create({
          name: data.name,
          email: data.email,
          password: data.password || 'Password123!',
          phone: data.phone,
          departmentId: data.departmentId,
          specialization: data.specialization,
          qualification: data.qualification,
          experience: data.experience,
          consultationFee: data.consultationFee,
          schedule: schedulePayload,
          bio: data.bio,
        });
        toast.success(
          `Dr. ${data.name.replace(/^Dr\.\s*/i, '')} registered! They can now sign in via Google or password with full Doctor permissions.`,
          { duration: 6000, icon: '🩺' }
        );
      }
      setShowModal(false);
      fetchDoctors();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDoctor = async () => {
    if (!deletingDoctor) return;
    try {
      await doctorsApi.delete(deletingDoctor._id);
      toast.success(`Doctor profile removed successfully`);
      setDeletingDoctor(null);
      fetchDoctors();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const getInitials = (name: string) =>
    name
      .replace(/^Dr\.\s*/i, '')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'DR';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-navy-950 tracking-tight">Medical Faculty &amp; Practitioners</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
              Verified Doctors ({total})
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Clinical specialists, departmental affiliations, consulting schedules, and qualifications
          </p>
        </div>

        {/* Add Doctor Button for Administrator */}
        {isAdmin && (
          <button
            type="button"
            onClick={openCreateModal}
            className="btn-primary py-2.5 px-4 flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold rounded-xl shadow-xs hover:shadow-cyan-glow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Doctor</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search doctor by name, email, specialization, or department..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="form-input pl-9"
          />
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {doctors.length === 0 && (
              <div className="col-span-3 card p-16 text-center text-slate-400">
                <Stethoscope className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-base font-semibold text-slate-700">No medical doctors found</p>
                <p className="text-xs text-slate-400 mt-1">
                  {isAdmin ? 'Click "Add New Doctor" above to provision a physician' : 'Try adjusting your search criteria'}
                </p>
              </div>
            )}
            {doctors.map((doctor) => (
              <div
                key={doctor._id}
                className="card overflow-hidden hover:shadow-card-hover transition-all duration-200 group flex flex-col justify-between relative"
              >
                {/* Header Top Accent */}
                <div className="h-1.5 bg-gradient-to-r from-navy-900 via-teal-600 to-cyan-500" />
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="w-13 h-13 rounded-2xl bg-navy-950 border border-navy-800 flex items-center justify-center text-cyan-300 font-bold text-base flex-shrink-0 shadow-xs">
                          {getInitials(doctor.userId.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-navy-950 text-base leading-snug truncate">
                            {doctor.userId.name}
                          </h3>
                          <p className="text-xs text-teal-700 font-semibold mt-0.5 truncate">
                            {doctor.specialization}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium truncate">
                            {doctor.departmentId?.name || 'General Department'}
                          </p>
                        </div>
                      </div>

                      {/* Admin Quick Actions */}
                      {isAdmin && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditModal(doctor)}
                            title="Edit Doctor Profile"
                            className="w-7 h-7 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 flex items-center justify-center transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingDoctor(doctor)}
                            title="Remove Doctor"
                            className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                      {doctor.bio || doctor.qualification}
                    </p>

                    <div className="grid grid-cols-2 gap-2.5 mb-4">
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Star className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-[11px] text-slate-500 font-medium">Experience</span>
                        </div>
                        <p className="text-sm font-bold text-navy-950">{doctor.experience} Years</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                          <span className="text-[11px] text-slate-500 font-medium">Standard Fee</span>
                        </div>
                        <p className="text-sm font-bold text-navy-950">{formatCurrency(doctor.consultationFee)}</p>
                      </div>
                    </div>

                    {doctor.schedule && doctor.schedule.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Clock className="w-3.5 h-3.5 text-cyan-600" />
                          <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                            Weekly Consulting Hours
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {doctor.schedule.map((s, i) => (
                            <span
                              key={i}
                              className="text-[11px] px-2.5 py-0.5 bg-navy-50 text-navy-900 border border-navy-100 rounded-full font-medium font-mono"
                            >
                              {DAY_LABELS[s.day]} {s.startTime}–{s.endTime}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{doctor.userId.email}</span>
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {doctor.userId.googleId && (
                        <span
                          title="Verified Google OAuth Connected"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                        >
                          <svg className="w-3 h-3" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                          </svg>
                          <span>Google</span>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(total / limit) || 1}
              total={total}
              limit={limit}
              onPageChange={setPage}
            />
          </div>
        </>
      )}

      {/* ── Add / Edit Doctor Modal ── */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
          <div className="modal-content max-w-2xl p-0 overflow-hidden shadow-2xl animate-scale-in">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-navy-950 via-[#101B2D] to-teal-900 text-white flex items-center justify-between border-b border-navy-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {editingDoctor ? 'Edit Doctor Profile' : 'Register New Medical Faculty'}
                  </h2>
                  <p className="text-xs text-teal-200/80">
                    Clinical credentials, departmental affiliation, and Google OAuth access
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {/* Google OAuth & Permission Notice */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50/70 border border-teal-200 text-teal-950 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0F9D91] flex-shrink-0" />
                  <span className="font-bold text-xs text-slate-900">
                    Seamless Google Account Access &amp; Clinical Permissions
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  When this doctor signs in via <strong className="text-teal-900">&ldquo;Continue with Google&rdquo;</strong> using{' '}
                  <span className="font-mono font-semibold text-teal-900 bg-white/80 px-1 py-0.5 rounded border border-teal-200">
                    {enteredEmail || 'their Google email'}
                  </span>
                  , they will immediately be authenticated with full <strong>Doctor Permissions</strong> to view appointments, manage clinical consultations, and write prescriptions.
                </p>
              </div>

              {/* Row 1: Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Doctor Full Name &amp; Title *</label>
                  <input
                    {...register('name')}
                    placeholder="e.g. Dr. Sneha Roy"
                    className="form-input text-xs"
                  />
                  {errors.name && <p className="form-error">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="form-label">Doctor Email (Google Account) *</label>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="e.g. doctor.sneha@gmail.com"
                    className="form-input text-xs"
                  />
                  {errors.email && <p className="form-error">{errors.email.message}</p>}
                </div>
              </div>

              {/* Row 2: Department & Specialization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Hospital Department *</label>
                  <select {...register('departmentId')} className="form-input text-xs">
                    <option value="">Select Department...</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  {errors.departmentId && <p className="form-error">{errors.departmentId.message}</p>}
                </div>

                <div>
                  <label className="form-label">Clinical Specialization *</label>
                  <input
                    {...register('specialization')}
                    placeholder="e.g. Interventional Cardiology"
                    className="form-input text-xs"
                  />
                  {errors.specialization && <p className="form-error">{errors.specialization.message}</p>}
                </div>
              </div>

              {/* Row 3: Qualification & Experience */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Degrees &amp; Qualifications *</label>
                  <input
                    {...register('qualification')}
                    placeholder="e.g. MBBS, MD, DM"
                    className="form-input text-xs"
                  />
                  {errors.qualification && <p className="form-error">{errors.qualification.message}</p>}
                </div>

                <div>
                  <label className="form-label">Clinical Experience (Years) *</label>
                  <input
                    {...register('experience')}
                    type="number"
                    min="0"
                    placeholder="e.g. 10"
                    className="form-input text-xs"
                  />
                  {errors.experience && <p className="form-error">{errors.experience.message}</p>}
                </div>

                <div>
                  <label className="form-label">Consultation Fee (₹) *</label>
                  <input
                    {...register('consultationFee')}
                    type="number"
                    min="0"
                    step="50"
                    placeholder="e.g. 800"
                    className="form-input text-xs"
                  />
                  {errors.consultationFee && <p className="form-error">{errors.consultationFee.message}</p>}
                </div>
              </div>

              {/* Row 4: Phone & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Contact Phone</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      {...register('phone')}
                      placeholder="+91 98000 00000"
                      className="form-input text-xs pl-8"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">
                    Hospital Security Password {editingDoctor && '(Leave blank to keep current)'}
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      {...register('password')}
                      type="password"
                      placeholder={editingDoctor ? '••••••••' : 'Password123!'}
                      className="form-input text-xs pl-8"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Allows password sign-in alongside 1-click Google sign-in
                  </span>
                </div>
              </div>

              {/* Consulting Hours Schedule */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#0F9D91]" />
                    Weekly Consulting Hours &amp; Available Days
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Select practicing weekdays</span>
                </div>

                {/* Day selector pills */}
                <div className="flex flex-wrap gap-2">
                  {ALL_DAYS.map((day) => {
                    const isSelected = selectedDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#101B2D] text-cyan-300 shadow-xs ring-1 ring-[#19B8C9]'
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        {DAY_LABELS[day]}
                      </button>
                    );
                  })}
                </div>

                {/* Time slot pickers */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Daily Start Time (e.g. 09:00)
                    </label>
                    <input
                      {...register('startTime')}
                      type="time"
                      className="form-input text-xs font-mono py-1.5"
                    />
                    {errors.startTime && <p className="form-error">{errors.startTime.message}</p>}
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Daily End Time (e.g. 13:00)
                    </label>
                    <input
                      {...register('endTime')}
                      type="time"
                      className="form-input text-xs font-mono py-1.5"
                    />
                    {errors.endTime && <p className="form-error">{errors.endTime.message}</p>}
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="form-label">Clinical Background &amp; Bio</label>
                <textarea
                  {...register('bio')}
                  rows={2}
                  placeholder="Outline clinical interests, fellowships, research, or patient care philosophy..."
                  className="form-input text-xs resize-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs flex items-center gap-2"
                >
                  {submitting ? (
                    'Saving Doctor Profile...'
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{editingDoctor ? 'Update Doctor Profile' : 'Register Doctor'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Doctor Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingDoctor}
        title="Remove Doctor Profile"
        message={`Are you sure you want to remove ${deletingDoctor?.userId.name} from the medical directory? Patients will no longer be able to book appointments with this doctor.`}
        confirmLabel="Remove Doctor"
        onConfirm={handleDeleteDoctor}
        onCancel={() => setDeletingDoctor(null)}
      />
    </div>
  );
};
