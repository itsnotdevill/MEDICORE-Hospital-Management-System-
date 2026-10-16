import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, Building2, Stethoscope } from 'lucide-react';
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
type DepartmentFormData = z.infer<typeof schema>;

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

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DepartmentFormData>({
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

  const onSubmit = async (data: DepartmentFormData) => {
    setSubmitting(true);
    try {
      if (editing) {
        await departmentsApi.update(editing._id, data);
        toast.success('Department updated successfully');
      } else {
        await departmentsApi.create({
          name: data.name,
          description: data.description,
        });
        toast.success('Department created successfully');
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
      toast.success('Department deactivated successfully');
      setConfirmDel(null);
      fetch();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-navy-950 tracking-tight">Clinical Departments & Centers</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
              {departments.length} Units
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Organize medical specialities, departmental heads, outpatient clinics, and inpatient services
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.length === 0 && (
            <div className="col-span-3 card p-16 text-center text-slate-400">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-base font-semibold text-slate-700">No departments configured</p>
              <p className="text-xs text-slate-400 mt-1">Register the first medical department for your facility</p>
            </div>
          )}
          {departments.map((dept) => (
            <div
              key={dept._id}
              className="card p-5 hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-navy-950 border border-navy-800 flex items-center justify-center text-cyan-300 text-lg font-bold shadow-xs">
                    {dept.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(dept)}
                      className="p-1.5 text-slate-400 hover:text-navy-900 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                      title="Edit Department"
                    >
                      <Edit2 className="w-4 h-4 text-cyan-700" />
                    </button>
                    <button
                      onClick={() => setConfirmDel(dept)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                      title="Deactivate Department"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-navy-950 text-base mb-1.5">{dept.name}</h3>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed line-clamp-3">
                  {dept.description || 'Dedicated clinical department supporting outpatient and inpatient care services.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                {dept.headDoctorId ? (
                  <span className="flex items-center gap-1.5 text-teal-700 font-semibold truncate">
                    <Stethoscope className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">Head: {(dept.headDoctorId as any).name || 'Assigned'}</span>
                  </span>
                ) : (
                  <span className="text-slate-400 italic">No Head Assigned</span>
                )}
                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
          <div className="modal-content max-w-md p-0 overflow-hidden">
            <div className="px-6 py-4 bg-navy-950 text-white flex items-center justify-between border-b border-navy-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{editing ? 'Edit Department' : 'Register New Department'}</h2>
                  <p className="text-xs text-slate-400">Configure hospital clinical unit</p>
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
              <div>
                <label className="form-label">Department Name *</label>
                <input {...register('name')} className="form-input text-xs" placeholder="e.g. Cardiology, Neurology, Pediatrics" />
                {errors.name && <p className="form-error">{errors.name.message}</p>}
              </div>
              <div>
                <label className="form-label">Scope & Description</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="form-input text-xs resize-none"
                  placeholder="Outline clinical specialities, clinical sub-divisions, or equipment managed..."
                />
              </div>
              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Saving...' : editing ? 'Update Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Department Confirmation */}
      <ConfirmDialog
        isOpen={!!confirmDel}
        title="Deactivate Department"
        message={`Are you sure you want to deactivate "${confirmDel?.name}"? It will be archived from public booking listings.`}
        confirmLabel="Deactivate Department"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  );
};

