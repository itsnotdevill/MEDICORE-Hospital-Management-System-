import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Edit2, PowerOff, Filter, Shield, Users as UsersIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { usersApi } from '../../api';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Pagination } from '../../components/shared/Pagination';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { PageLoader } from '../../components/shared/LoadingSpinner';
import { formatDate, getRoleBadgeColor, getRoleLabel, extractError, getInitials } from '../../lib/utils';
import type { User, UserRole } from '../../types';

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'At least 8 characters').regex(/[A-Z]/, 'Need uppercase').regex(/[a-z]/, 'Need lowercase').regex(/[0-9]/, 'Need number').optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'BILLING_STAFF']),
  phone: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [confirmUser, setConfirmUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const limit = 10;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersApi.getAll({ page, limit, search, role: roleFilter || undefined });
      setUsers(res.data.data);
      setTotal(res.data.pagination.total);
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openCreate = () => {
    setEditingUser(null);
    reset({ name: '', email: '', password: '', role: 'RECEPTIONIST', phone: '' });
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    reset({ name: user.name, email: user.email, password: '', role: user.role as UserRole, phone: user.phone || '' });
    setShowModal(true);
  };

  const onSubmit = async (data: UserFormData) => {
    setSubmitting(true);
    try {
      if (editingUser) {
        const updateData: Partial<User & { password?: string }> = { name: data.name, email: data.email, role: data.role as UserRole, phone: data.phone };
        await usersApi.update(editingUser._id, updateData);
        toast.success('User updated successfully');
      } else {
        if (!data.password) return toast.error('Password is required for new users');
        await usersApi.create({ name: data.name, email: data.email, password: data.password!, role: data.role, phone: data.phone });
        toast.success('User created successfully');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirmUser) return;
    try {
      await usersApi.deactivate(confirmUser._id);
      toast.success('User account deactivated successfully');
      setConfirmUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const roles: UserRole[] = ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'BILLING_STAFF'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-navy-950 tracking-tight">Staff Directory & RBAC Security</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-navy-50 text-navy-800 border border-navy-200">
              {total} Staff Accounts
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage hospital staff credentials, administrative access, role privileges, and account security
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Staff Member
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search staff by name or email address..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="form-input pl-9"
          />
        </div>
        <div className="relative sm:w-56">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="form-select pl-9 py-1.5 text-xs"
          >
            <option value="">All Hospital Roles</option>
            {roles.map((r) => (
              <option key={r} value={r}>{getRoleLabel(r)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <PageLoader />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Assigned Role</th>
                <th>Contact Phone</th>
                <th>Security Status</th>
                <th>Joined Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                      <UsersIcon className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">No staff accounts found</p>
                    <p className="text-xs text-slate-400 mt-1">Adjust your search or add a new staff member</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-navy-950 border border-navy-800 flex items-center justify-center text-cyan-300 text-xs font-bold flex-shrink-0 shadow-xs">
                          {getInitials(u.name)}
                        </div>
                        <div>
                          <p className="font-bold text-navy-950 text-sm leading-snug">{u.name}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(u.role as UserRole)}`}>
                        {getRoleLabel(u.role as UserRole)}
                      </span>
                    </td>
                    <td className="text-xs text-slate-600 font-mono">{u.phone || '—'}</td>
                    <td>
                      <StatusBadge status={u.isActive ? 'ACTIVE' : 'INACTIVE'} showDot />
                    </td>
                    <td className="text-xs text-slate-500">{formatDate(u.createdAt)}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 text-slate-400 hover:text-navy-900 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                          title="Edit User"
                        >
                          <Edit2 className="w-4 h-4 text-cyan-700" />
                        </button>
                        {u.isActive && (
                          <button
                            onClick={() => setConfirmUser(u)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                            title="Deactivate Account"
                          >
                            <PowerOff className="w-4 h-4" />
                          </button>
                        )}
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
          <div className="modal-content max-w-lg p-0 overflow-hidden">
            <div className="px-6 py-4 bg-navy-950 text-white flex items-center justify-between border-b border-navy-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{editingUser ? 'Edit Staff Credentials' : 'Add Staff Member'}</h2>
                  <p className="text-xs text-slate-400">Assign role access and identity credentials</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="form-label">Full Name *</label>
                  <input {...register('name')} className="form-input" placeholder="e.g. Dr. John Doe" />
                  {errors.name && <p className="form-error">{errors.name.message}</p>}
                </div>
                <div className="col-span-2">
                  <label className="form-label">Email Address *</label>
                  <input {...register('email')} type="email" className="form-input" placeholder="user@medicore-hms.local" />
                  {errors.email && <p className="form-error">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="form-label">Hospital Role *</label>
                  <select {...register('role')} className="form-select">
                    {roles.map((r) => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Contact Phone</label>
                  <input {...register('phone')} className="form-input font-mono" placeholder="+91 98000 00000" />
                </div>
                <div className="col-span-2">
                  <label className="form-label">{editingUser ? 'New Password (leave blank to keep unchanged)' : 'Password *'}</label>
                  <input {...register('password')} type="password" className="form-input" placeholder="Min 8 chars, 1 uppercase, 1 number" />
                  {errors.password && <p className="form-error">{errors.password.message}</p>}
                </div>
              </div>
              <div className="flex gap-3 pt-3 justify-end border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Saving...' : editingUser ? 'Update Staff Member' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate User Confirmation */}
      <ConfirmDialog
        isOpen={!!confirmUser}
        title="Deactivate Staff Account"
        message={`Are you sure you want to deactivate ${confirmUser?.name}? They will immediately lose access to MediCore HMS.`}
        confirmLabel="Deactivate Account"
        onConfirm={handleDeactivate}
        onCancel={() => setConfirmUser(null)}
      />
    </div>
  );
};

