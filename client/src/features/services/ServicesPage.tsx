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
    return map[cat] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Hospital Services & Diagnostics</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Diagnostic lab tests, imaging, surgical procedures, and standard charge schedule
          </p>
        </div>
        {user?.role === 'ADMIN' && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1e3a5f] hover:bg-[#162d4a] text-white text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Hospital Service
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search service name or code (e.g. CBC, MRI)..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
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
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <PageLoader />
        ) : services.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <TestTube className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-base font-medium text-gray-600">No services catalogued</p>
            <p className="text-xs text-gray-400 mt-1">Hospital services will appear here once registered</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/75 border-b border-gray-100 text-xs uppercase font-semibold text-gray-500">
                <tr>
                  <th className="px-5 py-3.5">Code</th>
                  <th className="px-5 py-3.5">Service Details</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Standard Rate</th>
                  <th className="px-5 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {services.map((srv) => (
                  <tr key={srv._id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-gray-900">
                      {srv.code}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{srv.name}</p>
                      {srv.description && (
                        <p className="text-xs text-gray-400 mt-0.5">{srv.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getCategoryBadge(srv.category)}`}>
                        {srv.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      {formatCurrency(srv.price)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Available
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={Math.ceil(total / limit) || 1}
          total={total}
          limit={limit}
          onPageChange={setPage}
        />
      </div>

      {/* Modal: Add Service */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-[#1e3a5f] text-white flex items-center justify-between">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Activity className="w-5 h-5" /> Add Hospital Service / Lab Test
              </h2>
              <button onClick={() => setCreateModalOpen(false)} className="text-white/80 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Service Code *</label>
                <input
                  type="text"
                  placeholder="e.g. SRV-LAB04"
                  {...register('code')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 uppercase focus:outline-none focus:border-[#1e3a5f]"
                />
                {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Service Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Thyroid Profile (T3, T4, TSH)"
                  {...register('name')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-[#1e3a5f]"
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Category *</label>
                  <select
                    {...register('category')}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-[#1e3a5f]"
                  >
                    <option value="LABORATORY">Laboratory</option>
                    <option value="RADIOLOGY">Radiology</option>
                    <option value="PROCEDURE">Procedure</option>
                    <option value="ROOM_CHARGE">Room Charge</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    step="any"
                    {...register('price', { valueAsNumber: true })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-[#1e3a5f]"
                  />
                  {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Clinical Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief clinical description..."
                  {...register('description')}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-[#1e3a5f]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-[#1e3a5f] hover:bg-[#162d4a] text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-60"
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
