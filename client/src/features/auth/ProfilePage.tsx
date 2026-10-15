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
      toast.success('Profile updated successfully');
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
      toast.success('Password changed successfully');
      resetPasswordForm();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setPasswordSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header Profile Banner */}
      <div className="bg-gradient-to-r from-[#1e3a5f] to-[#0d9488] rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center text-white text-2xl font-bold shadow-inner flex-shrink-0">
          {getInitials(user.name)}
        </div>
        <div className="text-center sm:text-left flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/20 text-white border border-white/30`}
            >
              {getRoleLabel(user.role as UserRole)}
            </span>
          </div>
          <p className="text-white/80 text-sm mt-1 flex items-center justify-center sm:justify-start gap-1.5">
            <Mail className="w-4 h-4" /> {user.email}
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-white/70">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Registered: {formatDate(user.createdAt)}
            </span>
            <span className="flex items-center gap-1 text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" /> Account Active
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Update Profile Form */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Personal Information</h2>
              <p className="text-xs text-gray-500">Update your name and primary contact details</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  {...registerProfile('name')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                  placeholder="Your full name"
                />
              </div>
              {profileErrors.name && (
                <p className="text-xs text-red-500 mt-1">{profileErrors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-[11px] text-gray-400 mt-1">Email address is managed by hospital system admin</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="tel"
                  {...registerProfile('phone')}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                  placeholder="+91 98765 43210"
                />
              </div>
              {profileErrors.phone && (
                <p className="text-xs text-red-500 mt-1">{profileErrors.phone.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#1e3a5f] hover:bg-[#162d4a] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Security Credentials</h2>
              <p className="text-xs text-gray-500">Change your password to keep your account safe</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Current Password</label>
              <input
                type="password"
                {...registerPassword('currentPassword')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                placeholder="••••••••"
              />
              {passwordErrors.currentPassword && (
                <p className="text-xs text-red-500 mt-1">{passwordErrors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                {...registerPassword('newPassword')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                placeholder="Minimum 6 characters"
              />
              {passwordErrors.newPassword && (
                <p className="text-xs text-red-500 mt-1">{passwordErrors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                {...registerPassword('confirmPassword')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                placeholder="Re-type new password"
              />
              {passwordErrors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">{passwordErrors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={passwordSaving}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
            >
              <Shield className="w-4 h-4" />
              {passwordSaving ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Role & Access Permissions Summary */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#0d9488]" />
          Role & Access Privileges
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <span className="font-medium text-gray-700">Assigned Role:</span>
            <div className="mt-1">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(user.role as UserRole)}`}>
                {getRoleLabel(user.role as UserRole)}
              </span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <span className="font-medium text-gray-700">Session Security:</span>
            <p className="text-gray-500 mt-1">HttpOnly Cookie + JWT</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <span className="font-medium text-gray-700">Status:</span>
            <p className="text-emerald-600 font-medium mt-1">Active & Verified</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <span className="font-medium text-gray-700">System ID:</span>
            <p className="text-gray-500 font-mono text-[11px] mt-1 truncate">{user._id}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
