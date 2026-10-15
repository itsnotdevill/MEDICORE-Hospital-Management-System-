import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { departmentsApi } from '../../api';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { PageLoader } from '../../components/shared/LoadingSpinner';
import { extractError } from '../../lib/utils';

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  description: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface Department {
  _id: string;
  name: string;
  description?: string;
  headDoctorId?: { _id: string; name: string };
  isActive: boolean;
}

export const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [confirmDel, setConfirmDel] = useState<Department | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await departmentsApi.getAll({ limit: 100 });
      setDepartments((res.data as any).data);
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (d: Department) => {
    setEditing(d);
    reset({ name: d.name, description: d.description || '' });
    setShowModal(true);
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      if (editing) {
        await departmentsApi.update(editing._id, data);
        toast.success('Department updated');
      } else {
        await departmentsApi.create(data);
        toast.success('Department created');
      }
      setShowModal(false);
      fetch();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDel) return;
    try {
      await departmentsApi.delete(confirmDel._id);
      toast.success('Department deactivated');
      setConfirmDel(null);
      fetch();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Departments</h1>
          <p className="page-subtitle">Manage hospital departments</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.length === 0 && (
            <div className="col-span-3 card p-12 text-center text-gray-400">
              No departments yet. Create the first one.
            </div>
          )}
          {departments.map((dept) => (
            <div key={dept._id} className="card p-5 hover:shadow-card-hover transition-shadow animate-slide-up">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#1e3a5f]/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-[#1e3a5f]">
                    {dept.name[0]}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(dept)}
                    className="p-1.5 text-gray-400 hover:text-[#1e3a5f] hover:bg-[#1e3a5f]/10 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDel(dept)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{dept.name}</h3>
              <p className="text-sm text-gray-500 mb-3">{dept.description || 'No description provided'}</p>
              {dept.headDoctorId && (
                <p className="text-xs text-[#1e3a5f] font-medium">
                  Head: {(dept.headDoctorId as any).name || 'N/A'}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
          <div className="modal-content max-w-md">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Department' : 'New Department'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="card-body space-y-4">
              <div>
                <label className="form-label">Department Name *</label>
                <input {...register('name')} className="form-input" placeholder="e.g., Cardiology" />
                {errors.name && <p className="form-error">{errors.name.message}</p>}
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea {...register('description')} className="form-input min-h-[80px] resize-none" placeholder="Brief description of this department..." />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmDel}
        title="Deactivate Department"
        message={`Deactivate "${confirmDel?.name}"? This will hide it from listings.`}
        confirmLabel="Deactivate"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  );
};
