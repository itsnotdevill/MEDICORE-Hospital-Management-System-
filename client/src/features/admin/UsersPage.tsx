import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Edit2, PowerOff, Filter } from 'lucide-react';
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
      toast.success('User deactivated');
      setConfirmUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const roles: UserRole[] = ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'BILLING_STAFF'];

  return (
    <div className="animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">Manage staff accounts and permissions</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="form-input pl-9"
          />
        </div>
        <div className="relative sm:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="form-select pl-9"
          >
            <option value="">All Roles</option>
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
                <th>User</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {getInitials(user.name)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role as UserRole)}`}>
                        {getRoleLabel(user.role as UserRole)}
                      </span>
                    </td>
                    <td className="text-gray-500">{user.phone || '—'}</td>
                    <td>
                      <StatusBadge status={user.isActive ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                    <td className="text-gray-500">{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(user)}
                          className="p-1.5 text-gray-400 hover:text-[#1e3a5f] hover:bg-[#1e3a5f]/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {user.isActive && (
                          <button
                            onClick={() => setConfirmUser(user)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Deactivate"
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
          <Pagination currentPage={page} totalPages={Math.ceil(total / limit)} total={total} limit={limit} onPageChange={setPage} />
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
          <div className="modal-content max-w-lg">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editingUser ? 'Edit User' : 'Add New User'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="card-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="form-label">Full Name *</label>
                  <input {...register('name')} className="form-input" placeholder="Dr. John Doe" />
                  {errors.name && <p className="form-error">{errors.name.message}</p>}
                </div>
                <div className="col-span-2">
                  <label className="form-label">Email *</label>
                  <input {...register('email')} type="email" className="form-input" placeholder="user@medicore.dev" />
                  {errors.email && <p className="form-error">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="form-label">Role *</label>
                  <select {...register('role')} className="form-select">
                    {roles.map((r) => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input {...register('phone')} className="form-input" placeholder="+91-9000000000" />
                </div>
                <div className="col-span-2">
                  <label className="form-label">{editingUser ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                  <input {...register('password')} type="password" className="form-input" placeholder="Min. 8 chars with uppercase, number" />
                  {errors.password && <p className="form-error">{errors.password.message}</p>}
                </div>
              </div>
              <div className="flex gap-3 pt-2 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmUser}
        title="Deactivate User"
        message={`Are you sure you want to deactivate ${confirmUser?.name}? They will no longer be able to log in.`}
        confirmLabel="Deactivate"
        onConfirm={handleDeactivate}
        onCancel={() => setConfirmUser(null)}
      />
    </div>
  );
};
