import React, { useEffect, useState, useCallback } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Eye,
  CreditCard,
  Printer,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  X,
  Trash2,
} from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { invoicesApi, patientsApi, appointmentsApi } from '../../api';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Pagination } from '../../components/shared/Pagination';
import { PageLoader } from '../../components/shared/LoadingSpinner';
import { formatCurrency, formatDate, extractError } from '../../lib/utils';
import type { Invoice, Patient, Appointment } from '../../types';

const chargeSchema = z.object({
  description: z.string().min(1, 'Charge description is required'),
  amount: z.number().min(0, 'Amount must be positive'),
});

const createInvoiceSchema = z.object({
  patientId: z.string().min(1, 'Please select a patient'),
  appointmentId: z.string().min(1, 'Please select an appointment'),
  consultationFee: z.number().min(0, 'Consultation fee must be positive'),
  additionalCharges: z.array(chargeSchema).optional(),
  discount: z.number().min(0).optional(),
});

type CreateInvoiceFormValues = {
  patientId: string;
  appointmentId: string;
  consultationFee: number;
  discount?: number;
  additionalCharges?: { description: string; amount: number }[];
};

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const limit = 10;

  // Invoice creation modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [submittingInvoice, setSubmittingInvoice] = useState(false);

  // Payment record modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'CASH' | 'CARD' | 'INSURANCE' | 'ONLINE'>('CASH');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Print/view invoice modal
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateInvoiceFormValues>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      consultationFee: 500,
      discount: 0,
      additionalCharges: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'additionalCharges',
  });

  const watchFee = watch('consultationFee') || 0;
  const watchDiscount = watch('discount') || 0;
  const watchCharges = watch('additionalCharges') || [];
  const additionalChargesTotal = watchCharges.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const computedTotal = Math.max(0, watchFee + additionalChargesTotal - watchDiscount);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await invoicesApi.getAll({
        page,
        limit,
        status: statusFilter || undefined,
      });
      const data = (res.data as any).data || [];
      setInvoices(data);
      setTotal((res.data as any).pagination?.total || 0);
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const openCreateModal = async () => {
    try {
      const res = await patientsApi.getAll({ limit: 100 });
      setPatients((res.data as any).data || []);
      setPatientAppointments([]);
      reset({
        consultationFee: 500,
        discount: 0,
        additionalCharges: [],
      });
      setCreateModalOpen(true);
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const handlePatientChange = async (patientId: string) => {
    if (!patientId) {
      setPatientAppointments([]);
      return;
    }
    setLoadingAppointments(true);
    try {
      const res = await appointmentsApi.getAll({ patientId, limit: 50 });
      setPatientAppointments((res.data as any).data || []);
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoadingAppointments(false);
    }
  };

  const onCreateInvoiceSubmit = async (values: CreateInvoiceFormValues) => {
    setSubmittingInvoice(true);
    try {
      await invoicesApi.create({
        patientId: values.patientId,
        appointmentId: values.appointmentId,
        consultationFee: Number(values.consultationFee),
        discount: Number(values.discount || 0),
        additionalCharges: (values.additionalCharges || []).map((c) => ({
          description: c.description,
          amount: Number(c.amount),
        })),
      });
      toast.success('Invoice created successfully!');
      setCreateModalOpen(false);
      fetchInvoices();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setSubmittingInvoice(false);
    }
  };

  const openPaymentModal = (invoice: Invoice) => {
    setActiveInvoice(invoice);
    const balance = invoice.totalAmount - invoice.paidAmount;
    setPayAmount(balance > 0 ? balance : 0);
    setPayMethod('CASH');
    setPaymentModalOpen(true);
  };

  const onRecordPayment = async () => {
    if (!activeInvoice) return;
    if (payAmount <= 0) {
      toast.error('Payment amount must be greater than 0');
      return;
    }

    setSubmittingPayment(true);
    try {
      const newPaidAmount = activeInvoice.paidAmount + Number(payAmount);
      await invoicesApi.update(activeInvoice._id, {
        paidAmount: newPaidAmount,
        paymentMethod: payMethod,
      });
      toast.success('Payment recorded successfully!');
      setPaymentModalOpen(false);
      fetchInvoices();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setSubmittingPayment(false);
    }
  };

  const openViewModal = (invoice: Invoice) => {
    setViewInvoice(invoice);
    setViewModalOpen(true);
  };

  // Stats calculation
  const totalBilled = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalPending = totalBilled - totalCollected;

  const filteredInvoices = invoices.filter((inv) => {
    if (!search) return true;
    const pat = typeof inv.patientId === 'object' ? inv.patientId.name : '';
    const patId = typeof inv.patientId === 'object' ? inv.patientId.patientId : '';
    const q = search.toLowerCase();
    return inv.invoiceId.toLowerCase().includes(q) || pat.toLowerCase().includes(q) || patId.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Billing & Invoices</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage patient bills, fee schedules, payments, and generated hospital receipts
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1e3a5f] hover:bg-[#162d4a] text-white text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Generate Invoice
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Billed</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalBilled)}</p>
            <span className="text-xs text-gray-500 mt-0.5 block">{invoices.length} invoices on page</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Collected</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalCollected)}</p>
            <span className="text-xs text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Payments Received
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Outstanding Dues</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(totalPending)}</p>
            <span className="text-xs text-amber-600 font-medium mt-0.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Pending Balance
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice #, patient name or ID..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <PageLoader />
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-base font-medium text-gray-600">No invoices found</p>
            <p className="text-xs text-gray-400 mt-1">Generate a new invoice or adjust your search filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/75 border-b border-gray-100 text-xs uppercase font-semibold text-gray-500">
                <tr>
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-5 py-3.5">Patient Details</th>
                  <th className="px-5 py-3.5">Created Date</th>
                  <th className="px-5 py-3.5">Total Amount</th>
                  <th className="px-5 py-3.5">Paid Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInvoices.map((inv) => {
                  const patient = typeof inv.patientId === 'object' ? inv.patientId : null;
                  const balance = inv.totalAmount - inv.paidAmount;

                  return (
                    <tr key={inv._id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-semibold text-gray-900">{inv.invoiceId}</span>
                        {inv.paymentMethod && (
                          <span className="block text-[11px] text-gray-400 uppercase tracking-wider mt-0.5">
                            via {inv.paymentMethod}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900 leading-snug">
                          {patient?.name || 'Unknown Patient'}
                        </p>
                        <p className="text-xs text-gray-400">
                          ID: {patient?.patientId || '—'}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-600">
                        {formatDate(inv.createdAt)}
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-900">
                        {formatCurrency(inv.totalAmount)}
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <span className="font-medium text-emerald-600">
                          {formatCurrency(inv.paidAmount)}
                        </span>
                        {balance > 0 && (
                          <span className="block text-red-500 font-semibold mt-0.5">
                            Due: {formatCurrency(balance)}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openViewModal(inv)}
                            title="View / Print Receipt"
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                            <button
                              onClick={() => openPaymentModal(inv)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Modal: Create Invoice */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl my-8 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-[#1e3a5f] text-white flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Receipt className="w-5 h-5" /> Generate Patient Invoice
              </h2>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onCreateInvoiceSubmit)} className="p-6 overflow-y-auto space-y-4">
              {/* Select Patient */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Select Patient *
                </label>
                <select
                  {...register('patientId')}
                  onChange={(e) => {
                    register('patientId').onChange(e);
                    handlePatientChange(e.target.value);
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.patientId}) - {p.phone}
                    </option>
                  ))}
                </select>
                {errors.patientId && (
                  <p className="text-xs text-red-500 mt-1">{errors.patientId.message}</p>
                )}
              </div>

              {/* Select Appointment */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Select Appointment *
                </label>
                <select
                  {...register('appointmentId')}
                  disabled={loadingAppointments || patientAppointments.length === 0}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">
                    {loadingAppointments
                      ? 'Loading appointments...'
                      : patientAppointments.length === 0
                      ? 'No appointments found for selected patient'
                      : '-- Choose Appointment --'}
                  </option>
                  {patientAppointments.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.appointmentId} • {formatDate(a.date)} at {a.timeSlot} ({a.status})
                    </option>
                  ))}
                </select>
                {errors.appointmentId && (
                  <p className="text-xs text-red-500 mt-1">{errors.appointmentId.message}</p>
                )}
              </div>

              {/* Consultation Fee & Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Consultation Fee (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    {...register('consultationFee', { valueAsNumber: true })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                  />
                  {errors.consultationFee && (
                    <p className="text-xs text-red-500 mt-1">{errors.consultationFee.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Discount (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    {...register('discount', { valueAsNumber: true })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                  />
                  {errors.discount && (
                    <p className="text-xs text-red-500 mt-1">{errors.discount.message}</p>
                  )}
                </div>
              </div>

              {/* Additional Charges dynamic list */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Additional Services / Lab / Medicine Charges
                  </span>
                  <button
                    type="button"
                    onClick={() => append({ description: '', amount: 0 })}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#0d9488] hover:text-[#0b766c]"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Charge
                  </button>
                </div>

                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        {...register(`additionalCharges.${index}.description` as const)}
                        placeholder="Description (e.g. X-Ray, Blood Test, Dressing)"
                        className="flex-1 px-3 py-1.5 text-xs rounded border border-gray-200 focus:outline-none focus:border-[#1e3a5f]"
                      />
                      <input
                        type="number"
                        step="any"
                        {...register(`additionalCharges.${index}.amount` as const, {
                          valueAsNumber: true,
                        })}
                        placeholder="Amount"
                        className="w-24 px-3 py-1.5 text-xs rounded border border-gray-200 focus:outline-none focus:border-[#1e3a5f]"
                      />
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {fields.length === 0 && (
                    <p className="text-xs text-gray-400 italic">No additional charges added</p>
                  )}
                </div>
              </div>

              {/* Invoice Summary Box */}
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-blue-900 font-semibold uppercase tracking-wider">
                    Calculated Total
                  </span>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Fee: ₹{watchFee} + Charges: ₹{additionalChargesTotal} - Discount: ₹{watchDiscount}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-[#1e3a5f]">
                    {formatCurrency(computedTotal)}
                  </span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInvoice}
                  className="px-5 py-2 rounded-lg bg-[#1e3a5f] hover:bg-[#162d4a] text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-60"
                >
                  {submittingInvoice ? 'Generating...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Payment */}
      {paymentModalOpen && activeInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
              <h2 className="text-base font-bold flex items-center gap-2">
                <CreditCard className="w-5 h-5" /> Record Payment
              </h2>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Invoice:</span>
                  <span className="font-semibold text-gray-800">{activeInvoice.invoiceId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Billed:</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(activeInvoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Already Paid:</span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(activeInvoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1 font-bold text-gray-900">
                  <span>Balance Due:</span>
                  <span className="text-red-600">{formatCurrency(activeInvoice.totalAmount - activeInvoice.paidAmount)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Payment Amount (₹) *
                </label>
                <input
                  type="number"
                  step="any"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Payment Method *
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-emerald-600"
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="ONLINE">UPI / Online Transfer</option>
                  <option value="INSURANCE">Health Insurance</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onRecordPayment}
                  disabled={submittingPayment}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors shadow-sm disabled:opacity-60"
                >
                  {submittingPayment ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View / Print Invoice Receipt */}
      {viewModalOpen && viewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl my-8">
            {/* Modal Controls Bar */}
            <div className="px-6 py-3 bg-gray-900 text-white flex items-center justify-between no-print">
              <span className="text-xs font-medium uppercase tracking-wider">Hospital Invoice Preview</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 rounded bg-white/20 hover:bg-white/30 text-white text-xs flex items-center gap-1 font-medium transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Receipt
                </button>
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="text-white/80 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Area */}
            <div className="p-8 space-y-6 text-gray-800 bg-white" id="printable-receipt">
              {/* Receipt Header */}
              <div className="flex justify-between items-start border-b border-gray-200 pb-5">
                <div>
                  <h1 className="text-2xl font-bold text-[#1e3a5f] tracking-tight">MediCore HMS</h1>
                  <p className="text-xs text-gray-500 mt-0.5">Central Multi-Speciality Hospital</p>
                  <p className="text-xs text-gray-400 mt-1">Tel: +91 1800-MEDICORE • help@medicore.dev</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">INVOICE</span>
                  <p className="text-base font-bold text-gray-900 mt-0.5">{viewInvoice.invoiceId}</p>
                  <p className="text-xs text-gray-500 mt-1">Date: {formatDate(viewInvoice.createdAt)}</p>
                  <div className="mt-1">
                    <StatusBadge status={viewInvoice.status} />
                  </div>
                </div>
              </div>

              {/* Patient & Billing Info */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-semibold text-gray-400 uppercase tracking-wider">Billed To:</span>
                  <p className="font-bold text-gray-900 text-sm mt-0.5">
                    {typeof viewInvoice.patientId === 'object' ? viewInvoice.patientId.name : 'Patient'}
                  </p>
                  <p className="text-gray-500 mt-0.5">
                    Patient ID: {typeof viewInvoice.patientId === 'object' ? viewInvoice.patientId.patientId : ''}
                  </p>
                  {typeof viewInvoice.patientId === 'object' && viewInvoice.patientId.phone && (
                    <p className="text-gray-500">Phone: {viewInvoice.patientId.phone}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="font-semibold text-gray-400 uppercase tracking-wider">Payment Details:</span>
                  <p className="text-gray-700 mt-0.5">
                    Method: <strong>{viewInvoice.paymentMethod || 'Pending'}</strong>
                  </p>
                  {viewInvoice.paymentDate && (
                    <p className="text-gray-500">Date: {formatDate(viewInvoice.paymentDate)}</p>
                  )}
                  <p className="text-gray-500 mt-0.5">
                    Billed By: {typeof viewInvoice.createdBy === 'object' ? viewInvoice.createdBy.name : 'Billing Staff'}
                  </p>
                </div>
              </div>

              {/* Charges Breakdown */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 uppercase font-semibold border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2.5">Item Description</th>
                      <th className="px-4 py-2.5 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="px-4 py-2.5 font-medium text-gray-800">Doctor Consultation Fee</td>
                      <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(viewInvoice.consultationFee)}</td>
                    </tr>
                    {viewInvoice.additionalCharges &&
                      viewInvoice.additionalCharges.map((charge, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2.5 text-gray-700">{charge.description}</td>
                          <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(charge.amount)}</td>
                        </tr>
                      ))}
                    {viewInvoice.discount > 0 && (
                      <tr className="text-emerald-700 bg-emerald-50/40">
                        <td className="px-4 py-2.5">Special Discount</td>
                        <td className="px-4 py-2.5 text-right font-medium">- {formatCurrency(viewInvoice.discount)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="flex justify-end text-xs">
                <div className="w-60 space-y-1.5 border-t border-gray-200 pt-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Total Bill:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(viewInvoice.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Paid Amount:</span>
                    <span className="font-semibold">{formatCurrency(viewInvoice.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-1.5 text-gray-900">
                    <span>Balance Due:</span>
                    <span className={viewInvoice.totalAmount - viewInvoice.paidAmount > 0 ? 'text-red-600' : 'text-emerald-600'}>
                      {formatCurrency(viewInvoice.totalAmount - viewInvoice.paidAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Receipt Footer Note */}
              <div className="border-t border-dashed border-gray-200 pt-4 text-center text-[11px] text-gray-400">
                <p>Thank you for choosing MediCore HMS. Computer-generated tax invoice.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
