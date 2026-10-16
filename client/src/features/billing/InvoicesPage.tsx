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
      toast.success('Invoice generated successfully!');
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-navy-950 tracking-tight">Patient Billing & Invoices</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-navy-50 text-navy-800 border border-navy-200">
              Financial Registry
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage patient bills, fee schedules, payments, and generated hospital receipts
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" /> Generate Invoice
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Billed</p>
            <p className="text-2xl font-bold text-navy-950 mt-1">{formatCurrency(totalBilled)}</p>
            <span className="text-xs text-slate-500 mt-0.5 block">{invoices.length} active invoices on register</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-navy-50 border border-navy-100 text-navy-800 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-cyan-600" />
          </div>
        </div>

        <div className="card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Collected</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalCollected)}</p>
            <span className="text-xs text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Payments Reconciled
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outstanding Dues</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(totalPending)}</p>
            <span className="text-xs text-amber-700 font-semibold mt-0.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Pending Settlements
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice #, patient name or ID..."
            className="form-input pl-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="form-select py-1.5 text-xs"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partial Payment</option>
            <option value="PAID">Fully Settled (Paid)</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      {loading ? (
        <PageLoader />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Patient Details</th>
                <th>Created Date</th>
                <th>Total Amount</th>
                <th>Paid Amount</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                      <Receipt className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">No invoices found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Generate a new invoice or adjust your search filter to review records
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const patient = typeof inv.patientId === 'object' ? inv.patientId : null;
                  const balance = inv.totalAmount - inv.paidAmount;

                  return (
                    <tr key={inv._id} className="hover:bg-slate-50/70 transition-colors">
                      <td>
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded border border-navy-100 bg-navy-50/80 text-navy-800">
                          {inv.invoiceId}
                        </span>
                        {inv.paymentMethod && (
                          <span className="block text-[11px] text-slate-500 uppercase tracking-wider mt-1 font-medium">
                            via {inv.paymentMethod}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {patient?.name?.[0]?.toUpperCase() || 'P'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm leading-snug">
                              {patient?.name || 'Unknown Patient'}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                              ID: {patient?.patientId || '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="text-xs text-slate-600 font-medium">
                        {formatDate(inv.createdAt)}
                      </td>
                      <td className="font-bold text-slate-900 text-sm">
                        {formatCurrency(inv.totalAmount)}
                      </td>
                      <td className="text-xs">
                        <span className="font-bold text-emerald-600">
                          {formatCurrency(inv.paidAmount)}
                        </span>
                        {balance > 0 && (
                          <span className="block text-amber-600 font-bold text-[11px] mt-0.5">
                            Due: {formatCurrency(balance)}
                          </span>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={inv.status} showDot />
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openViewModal(inv)}
                            title="View / Print Receipt"
                            className="p-1.5 rounded-lg bg-navy-50 hover:bg-navy-100 text-navy-800 border border-navy-100 transition-colors"
                          >
                            <Eye className="w-4 h-4 text-cyan-700" />
                          </button>
                          {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                            <button
                              onClick={() => openPaymentModal(inv)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
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

      {/* Modal: Create Invoice */}
      {createModalOpen && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setCreateModalOpen(false)} />
          <div className="modal-content max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <div className="px-6 py-4 bg-navy-950 text-white flex items-center justify-between border-b border-navy-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Generate Patient Invoice</h2>
                  <p className="text-xs text-slate-400">Bill outpatient consultation, diagnostics, and medical supplies</p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit(onCreateInvoiceSubmit)} className="p-6 overflow-y-auto space-y-4">
              {/* Select Patient */}
              <div>
                <label className="form-label">
                  Select Patient *
                </label>
                <select
                  {...register('patientId')}
                  onChange={(e) => {
                    register('patientId').onChange(e);
                    handlePatientChange(e.target.value);
                  }}
                  className="form-select"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.patientId}) - {p.phone}
                    </option>
                  ))}
                </select>
                {errors.patientId && (
                  <p className="form-error">{errors.patientId.message}</p>
                )}
              </div>

              {/* Select Appointment */}
              <div>
                <label className="form-label">
                  Select Appointment Encounter *
                </label>
                <select
                  {...register('appointmentId')}
                  disabled={loadingAppointments || patientAppointments.length === 0}
                  className="form-select disabled:bg-slate-50 disabled:text-slate-400"
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
                  <p className="form-error">{errors.appointmentId.message}</p>
                )}
              </div>

              {/* Consultation Fee & Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">
                    Consultation Fee (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    {...register('consultationFee', { valueAsNumber: true })}
                    className="form-input"
                  />
                  {errors.consultationFee && (
                    <p className="form-error">{errors.consultationFee.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">
                    Discretionary Discount (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    {...register('discount', { valueAsNumber: true })}
                    className="form-input"
                  />
                  {errors.discount && (
                    <p className="form-error">{errors.discount.message}</p>
                  )}
                </div>
              </div>

              {/* Additional Charges dynamic list */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-navy-950 uppercase tracking-wider">
                    Additional Services / Lab / Medicine Charges
                  </span>
                  <button
                    type="button"
                    onClick={() => append({ description: '', amount: 0 })}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Charge Item
                  </button>
                </div>

                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        {...register(`additionalCharges.${index}.description` as const)}
                        placeholder="Description (e.g. CBC Blood Test, Chest X-Ray, Dressing)"
                        className="form-input text-xs py-1.5 flex-1"
                      />
                      <input
                        type="number"
                        step="any"
                        {...register(`additionalCharges.${index}.amount` as const, {
                          valueAsNumber: true,
                        })}
                        placeholder="Amount"
                        className="form-input text-xs py-1.5 w-28"
                      />
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove Charge"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {fields.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No additional charges added to this invoice</p>
                  )}
                </div>
              </div>

              {/* Invoice Summary Box */}
              <div className="p-4 rounded-xl bg-cyan-50/70 border border-cyan-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-cyan-950 font-bold uppercase tracking-wider">
                    Calculated Total
                  </span>
                  <p className="text-xs text-cyan-800 mt-0.5">
                    Fee: ₹{watchFee} + Charges: ₹{additionalChargesTotal} - Discount: ₹{watchDiscount}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-navy-950">
                    {formatCurrency(computedTotal)}
                  </span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInvoice}
                  className="btn-primary"
                >
                  {submittingInvoice ? 'Generating...' : 'Create & Issue Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Payment */}
      {paymentModalOpen && activeInvoice && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setPaymentModalOpen(false)} />
          <div className="modal-content max-w-md p-0 overflow-hidden">
            <div className="px-6 py-4 bg-navy-950 text-white flex items-center justify-between border-b border-navy-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Record Invoice Payment</h2>
                  <p className="text-xs text-slate-400">Reconcile patient payment at cash counter</p>
                </div>
              </div>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice:</span>
                  <span className="font-mono font-semibold text-navy-900">{activeInvoice.invoiceId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Billed:</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(activeInvoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Already Paid:</span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(activeInvoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-900">
                  <span>Balance Due:</span>
                  <span className="text-amber-600">{formatCurrency(activeInvoice.totalAmount - activeInvoice.paidAmount)}</span>
                </div>
              </div>

              <div>
                <label className="form-label">
                  Payment Amount Received (₹) *
                </label>
                <input
                  type="number"
                  step="any"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="form-input font-bold text-base"
                />
              </div>

              <div>
                <label className="form-label">
                  Settlement Method *
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="form-select"
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
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onRecordPayment}
                  disabled={submittingPayment}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-60"
                >
                  {submittingPayment ? 'Processing...' : 'Confirm & Reconcile'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View / Print Invoice Receipt */}
      {viewModalOpen && viewInvoice && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setViewModalOpen(false)} />
          <div className="modal-content max-w-xl p-0 overflow-hidden my-8">
            {/* Modal Controls Bar */}
            <div className="px-6 py-3 bg-navy-950 text-white flex items-center justify-between no-print border-b border-navy-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Hospital Receipt Preview</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-navy-700"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Receipt
                </button>
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Area */}
            <div className="p-8 space-y-6 text-slate-800 bg-white" id="printable-receipt">
              {/* Receipt Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                <div>
                  <h1 className="text-2xl font-bold text-navy-950 tracking-tight">MediCore HMS</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Central Multi-Speciality Healthcare Network</p>
                  <p className="text-xs text-slate-400 mt-1">Tel: +91 1800-MEDICORE • contact@medicore-hms.local</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">OFFICIAL TAX INVOICE</span>
                  <p className="text-base font-mono font-bold text-navy-950 mt-0.5">{viewInvoice.invoiceId}</p>
                  <p className="text-xs text-slate-500 mt-1">Issued: {formatDate(viewInvoice.createdAt)}</p>
                  <div className="mt-1.5">
                    <StatusBadge status={viewInvoice.status} showDot />
                  </div>
                </div>
              </div>

              {/* Patient & Billing Info */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Billed To:</span>
                  <p className="font-bold text-navy-950 text-sm mt-0.5">
                    {typeof viewInvoice.patientId === 'object' ? viewInvoice.patientId.name : 'Patient'}
                  </p>
                  <p className="text-slate-500 font-mono mt-0.5">
                    ID: {typeof viewInvoice.patientId === 'object' ? viewInvoice.patientId.patientId : '—'}
                  </p>
                  {typeof viewInvoice.patientId === 'object' && viewInvoice.patientId.phone && (
                    <p className="text-slate-500">Phone: {viewInvoice.patientId.phone}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Payment Settlement:</span>
                  <p className="text-slate-700 mt-0.5">
                    Method: <strong className="text-navy-900">{viewInvoice.paymentMethod || 'Pending'}</strong>
                  </p>
                  {viewInvoice.paymentDate && (
                    <p className="text-slate-500">Date: {formatDate(viewInvoice.paymentDate)}</p>
                  )}
                  <p className="text-slate-500 mt-0.5">
                    Authorized Cashier: {typeof viewInvoice.createdBy === 'object' ? viewInvoice.createdBy.name : 'Billing Registry'}
                  </p>
                </div>
              </div>

              {/* Charges Breakdown */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Item Description</th>
                      <th className="px-4 py-2.5 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-4 py-2.5 font-semibold text-slate-800">Doctor Consultation Fee</td>
                      <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(viewInvoice.consultationFee)}</td>
                    </tr>
                    {viewInvoice.additionalCharges &&
                      viewInvoice.additionalCharges.map((charge, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2.5 text-slate-700">{charge.description}</td>
                          <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(charge.amount)}</td>
                        </tr>
                      ))}
                    {viewInvoice.discount > 0 && (
                      <tr className="text-emerald-700 bg-emerald-50/40">
                        <td className="px-4 py-2.5 font-medium">Healthcare Courtesy Discount</td>
                        <td className="px-4 py-2.5 text-right font-medium">- {formatCurrency(viewInvoice.discount)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="flex justify-end text-xs">
                <div className="w-64 space-y-1.5 border-t border-slate-200 pt-2.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Billed:</span>
                    <span className="font-semibold text-navy-950">{formatCurrency(viewInvoice.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Paid Amount:</span>
                    <span className="font-bold">{formatCurrency(viewInvoice.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-1.5 text-navy-950">
                    <span>Balance Due:</span>
                    <span className={viewInvoice.totalAmount - viewInvoice.paidAmount > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                      {formatCurrency(viewInvoice.totalAmount - viewInvoice.paidAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Receipt Footer Note */}
              <div className="border-t border-dashed border-slate-200 pt-4 text-center text-[11px] text-slate-400">
                <p>Thank you for choosing MediCore HMS. Computer-generated verified healthcare tax invoice.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

