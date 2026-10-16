import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  User,
  Phone,
  Mail,
  Shield,
  KeyRound,
  Save,
  CheckCircle2,
  Calendar,
  Lock,
  Sparkles,
  Fingerprint,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api';
import { getRoleLabel, getRoleBadgeColor, formatDate, extractError, getInitials } from '../../lib/utils';
import type { UserRole } from '../../types';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match",
    path: ['confirmPassword'],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (data: ProfileFormValues) => {
    setProfileSaving(true);
    try {
      const res = await authApi.updateProfile(data);
      setUser(res.data.data);
      toast.success('Profile credentials updated successfully');
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setProfileSaving(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    setPasswordSaving(true);
    try {
      await authApi.changePassword(data.currentPassword, data.newPassword);
      toast.success('Security password updated successfully');
      resetPasswordForm();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setPasswordSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header Profile Command Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-midnight-navy via-[#17263D] to-[#1b2f4a] border border-slate-700/60 p-6 sm:p-8 text-white shadow-clinical-lg">
        {/* Futuristic decorative ambient shapes */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-healthcare-cyan/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-refined-teal/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-healthcare-cyan/25 to-refined-teal/20 border-2 border-healthcare-cyan/40 flex items-center justify-center text-healthcare-cyan text-2xl font-bold shadow-clinical-sm flex-shrink-0 tracking-wider">
            {getInitials(user.name)}
          </div>

          <div className="text-center sm:text-left flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-white">{user.name}</h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-healthcare-cyan/15 text-healthcare-cyan border border-healthcare-cyan/30">
                <Sparkles className="w-3 h-3 text-healthcare-cyan" />
                {getRoleLabel(user.role as UserRole)}
              </span>
            </div>

            <p className="text-slate-300 text-sm mt-1.5 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-4 h-4 text-healthcare-cyan" /> {user.email}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Registered: {formatDate(user.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active Practitioner
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 font-mono text-[11px]">
                <Fingerprint className="w-3.5 h-3.5 text-healthcare-cyan" />
                ID: {user._id.slice(-8).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information Form */}
        <div className="card p-6 border border-slate-200/80 shadow-clinical-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
              <div className="p-2.5 rounded-xl bg-healthcare-cyan/10 text-healthcare-cyan border border-healthcare-cyan/20">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 tracking-tight">Personal Information</h2>
                <p className="text-xs text-slate-500">Update clinician name and direct contact numbers</p>
              </div>
            </div>

            <form id="profile-form" onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
              <div>
                <label className="form-label">Full Legal Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="text"
                    {...registerProfile('name')}
                    className="form-input pl-10"
                    placeholder="Clinician or administrator name"
                  />
                </div>
                {profileErrors.name && (
                  <p className="form-error">{profileErrors.name.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">Hospital Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="form-input pl-10 bg-slate-50 text-slate-500 cursor-not-allowed border-dashed"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-slate-400" />
                  Managed by system administrator for audit tracking
                </p>
              </div>

              <div>
                <label className="form-label">Contact Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="tel"
                    {...registerProfile('phone')}
                    className="form-input pl-10"
                    placeholder="+91 98765 43210"
                  />
                </div>
                {profileErrors.phone && (
                  <p className="form-error">{profileErrors.phone.message}</p>
                )}
              </div>
            </form>
          </div>

          <div className="pt-5 mt-6 border-t border-slate-100">
            <button
              type="submit"
              form="profile-form"
              disabled={profileSaving}
              className="btn-primary w-full justify-center py-2.5"
            >
              <Save className="w-4 h-4" />
              {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="card p-6 border border-slate-200/80 shadow-clinical-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 tracking-tight">Security Credentials</h2>
                <p className="text-xs text-slate-500">Update encrypted password to maintain account security</p>
              </div>
            </div>

            <form id="password-form" onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
              <div>
                <label className="form-label">Current Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="password"
                    {...registerPassword('currentPassword')}
                    className="form-input pl-10"
                    placeholder="Enter current password"
                  />
                </div>
                {passwordErrors.currentPassword && (
                  <p className="form-error">{passwordErrors.currentPassword.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">New Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="password"
                    {...registerPassword('newPassword')}
                    className="form-input pl-10"
                    placeholder="Minimum 6 characters"
                  />
                </div>
                {passwordErrors.newPassword && (
                  <p className="form-error">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">Confirm New Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="password"
                    {...registerPassword('confirmPassword')}
                    className="form-input pl-10"
                    placeholder="Re-type new password"
                  />
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="form-error">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>
            </form>
          </div>

          <div className="pt-5 mt-6 border-t border-slate-100">
            <button
              type="submit"
              form="password-form"
              disabled={passwordSaving}
              className="btn-secondary w-full justify-center py-2.5 bg-slate-900 hover:bg-slate-800 text-white border-transparent"
            >
              <Shield className="w-4 h-4" />
              {passwordSaving ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </div>
      </div>

      {/* Role & Access Privileges Summary Card */}
      <div className="card p-6 border border-slate-200/80 shadow-clinical-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-refined-teal" />
          Role Governance & Access Privileges
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/60">
            <span className="font-medium text-slate-500 uppercase tracking-wider text-[10px]">Assigned Role</span>
            <div className="mt-1.5">
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${getRoleBadgeColor(user.role as UserRole)}`}>
                {getRoleLabel(user.role as UserRole)}
              </span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/60">
            <span className="font-medium text-slate-500 uppercase tracking-wider text-[10px]">Session Security</span>
            <p className="text-slate-900 font-semibold mt-1">HttpOnly Cookie + JWT</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/60">
            <span className="font-medium text-slate-500 uppercase tracking-wider text-[10px]">Verification Status</span>
            <p className="text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Active & Verified
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/60">
            <span className="font-medium text-slate-500 uppercase tracking-wider text-[10px]">Database UID</span>
            <p className="text-slate-600 font-mono text-[11px] mt-1 truncate" title={user._id}>
              {user._id}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

