import React, { useEffect, useState, useCallback } from 'react';
import {
  Activity,
  Plus,
  Search,
  CheckCircle2,
  TestTube,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { servicesApi } from '../../api';
import { Pagination } from '../../components/shared/Pagination';
import { PageLoader } from '../../components/shared/LoadingSpinner';
import { formatCurrency, extractError } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import type { HospitalService } from '../../types';

const serviceSchema = z.object({
  code: z.string().min(2, 'Code is required').toUpperCase(),
  name: z.string().min(3, 'Service name is required'),
  category: z.enum(['LABORATORY', 'RADIOLOGY', 'PROCEDURE', 'CONSULTATION', 'ROOM_CHARGE']),
  price: z.number().min(0, 'Price must be positive'),
  description: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export const ServicesPage: React.FC = () => {
  const { user } = useAuthStore();
  const [services, setServices] = useState<HospitalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const limit = 10;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      category: 'LABORATORY',
      price: 500,
    },
  });

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await servicesApi.getAll({
        page,
        limit,
        category: categoryFilter || undefined,
        search: search || undefined,
      });
      setServices((res.data as any).data || []);
      setTotal((res.data as any).pagination?.total || 0);
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [page, categoryFilter, search]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const onSubmit = async (values: ServiceFormValues) => {
    setSubmitting(true);
    try {
      await servicesApi.create(values);
      toast.success('Hospital service registered successfully');
      setCreateModalOpen(false);
      reset();
      fetchServices();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryBadge = (cat: string) => {
    const map: Record<string, string> = {
      LABORATORY: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      RADIOLOGY: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      PROCEDURE: 'bg-amber-50 text-amber-700 border-amber-200',
      CONSULTATION: 'bg-blue-50 text-blue-700 border-blue-200',
      ROOM_CHARGE: 'bg-purple-50 text-purple-700 border-purple-200',
    };
    return map[cat] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-navy-950 tracking-tight">Hospital Services & Diagnostics</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200">
              Standard Tariff
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Diagnostic lab tests, imaging, surgical procedures, and standard hospital charge schedule
          </p>
        </div>
        {user?.role === 'ADMIN' && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" /> Add Hospital Service
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search service name or code (e.g. CBC, MRI)..."
            className="form-input pl-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="form-select py-1.5 text-xs"
          >
            <option value="">All Categories</option>
            <option value="LABORATORY">Laboratory Tests</option>
            <option value="RADIOLOGY">Radiology & Imaging</option>
            <option value="PROCEDURE">Clinical Procedures</option>
            <option value="ROOM_CHARGE">Room / Bed Charges</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <PageLoader />
      ) : services.length === 0 ? (
        <div className="card p-16 text-center text-slate-400">
          <TestTube className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-base font-semibold text-slate-700">No services catalogued</p>
          <p className="text-xs text-slate-400 mt-1">Hospital services will appear here once registered</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Service Code</th>
                <th>Service Details</th>
                <th>Category</th>
                <th>Standard Rate</th>
                <th className="text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {services.map((srv) => (
                <tr key={srv._id} className="hover:bg-slate-50/70 transition-colors">
                  <td>
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded border border-navy-100 bg-navy-50/80 text-navy-800 uppercase">
                      {srv.code}
                    </span>
                  </td>
                  <td>
                    <p className="font-bold text-slate-900 text-sm">{srv.name}</p>
                    {srv.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{srv.description}</p>
                    )}
                  </td>
                  <td>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getCategoryBadge(srv.category)}`}>
                      {srv.category}
                    </span>
                  </td>
                  <td className="font-bold text-slate-900 text-sm">
                    {formatCurrency(srv.price)}
                  </td>
                  <td className="text-right">
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active Tariff
                    </span>
                  </td>
                </tr>
              ))}
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

      {/* Modal: Add Service */}
      {createModalOpen && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setCreateModalOpen(false)} />
          <div className="modal-content max-w-md p-0 overflow-hidden">
            <div className="px-6 py-4 bg-navy-950 text-white flex items-center justify-between border-b border-navy-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Add Hospital Service / Diagnostic</h2>
                  <p className="text-xs text-slate-400">Register new tariff item into master catalog</p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="form-label">Service Code *</label>
                <input
                  type="text"
                  placeholder="e.g. SRV-LAB04"
                  {...register('code')}
                  className="form-input uppercase font-mono text-xs"
                />
                {errors.code && <p className="form-error">{errors.code.message}</p>}
              </div>

              <div>
                <label className="form-label">Service / Procedure Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Thyroid Profile (T3, T4, TSH)"
                  {...register('name')}
                  className="form-input text-xs"
                />
                {errors.name && <p className="form-error">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Category *</label>
                  <select
                    {...register('category')}
                    className="form-select text-xs"
                  >
                    <option value="LABORATORY">Laboratory</option>
                    <option value="RADIOLOGY">Radiology</option>
                    <option value="PROCEDURE">Procedure</option>
                    <option value="ROOM_CHARGE">Room Charge</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Price (₹) *</label>
                  <input
                    type="number"
                    step="any"
                    {...register('price', { valueAsNumber: true })}
                    className="form-input font-bold text-xs"
                  />
                  {errors.price && <p className="form-error">{errors.price.message}</p>}
                </div>
              </div>

              <div>
                <label className="form-label">Clinical Description / Preparation</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Fasting 8-10 hours required before sample collection..."
                  {...register('description')}
                  className="form-input text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? 'Registering...' : 'Register Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

