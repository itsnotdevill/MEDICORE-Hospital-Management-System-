import React, { useEffect, useState, useCallback } from 'react';
import {
  Pill,
  Search,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { pharmacyApi } from '../../api';
import { Pagination } from '../../components/shared/Pagination';
import { PageLoader } from '../../components/shared/LoadingSpinner';
import { formatCurrency, extractError } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import type { PharmacyItem } from '../../types';

export const PharmacyPage: React.FC = () => {
  const { user } = useAuthStore();
  const [items, setItems] = useState<PharmacyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const limit = 10;

  // Quick stock edit
  const [editingItem, setEditingItem] = useState<PharmacyItem | null>(null);
  const [newStock, setNewStock] = useState<number>(0);
  const [updating, setUpdating] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pharmacyApi.getAll({
        page,
        limit,
        category: categoryFilter || undefined,
        search: search || undefined,
        lowStock: lowStockOnly || undefined,
      });
      setItems((res.data as any).data || []);
      setTotal((res.data as any).pagination?.total || 0);
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [page, categoryFilter, search, lowStockOnly]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleUpdateStock = async () => {
    if (!editingItem) return;
    setUpdating(true);
    try {
      await pharmacyApi.updateStock(editingItem._id, { stockQuantity: newStock });
      toast.success('Inventory stock quantity updated successfully');
      setEditingItem(null);
      fetchItems();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setUpdating(false);
    }
  };

  const getCategoryColor = (cat: string) => {
    const map: Record<string, string> = {
      TABLET: 'bg-blue-50 text-blue-700 border-blue-200',
      CAPSULE: 'bg-purple-50 text-purple-700 border-purple-200',
      INJECTION: 'bg-red-50 text-red-700 border-red-200',
      SYRUP: 'bg-amber-50 text-amber-700 border-amber-200',
      INHALER: 'bg-teal-50 text-teal-700 border-teal-200',
    };
    return map[cat] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-navy-950 tracking-tight">Pharmacy Formulary & Inventory</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
              Dispensary Stock
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Hospital medicine formulary, stock levels, batch tracking, and dispensary unit prices
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
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
            placeholder="Search medicine brand or generic name..."
            className="form-input pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="form-select py-1.5 text-xs"
          >
            <option value="">All Dosage Forms</option>
            <option value="TABLET">Tablets</option>
            <option value="CAPSULE">Capsules</option>
            <option value="INJECTION">Injections</option>
            <option value="SYRUP">Syrups</option>
            <option value="INHALER">Inhalers</option>
          </select>

          <button
            onClick={() => {
              setLowStockOnly(!lowStockOnly);
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-all ${
              lowStockOnly
                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Low Stock Alerts
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <PageLoader />
      ) : items.length === 0 ? (
        <div className="card p-16 text-center text-slate-400">
          <Pill className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-base font-semibold text-slate-700">No pharmacy items found</p>
          <p className="text-xs text-slate-400 mt-1">Adjust your search or dosage category filter</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Code / Item</th>
                <th>Generic & Strength</th>
                <th>Category</th>
                <th>Manufacturer & Batch</th>
                <th>Unit Price</th>
                <th>In Stock Level</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => {
                const isLow = item.stockQuantity <= item.reorderLevel;

                return (
                  <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                    <td>
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded border border-navy-100 bg-navy-50/80 text-navy-800 uppercase">
                        {item.code}
                      </span>
                      <p className="font-bold text-slate-900 mt-1 text-sm">{item.name}</p>
                    </td>
                    <td>
                      <p className="font-medium text-slate-800 text-xs">{item.genericName}</p>
                      <span className="inline-block mt-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {item.dosageStrength}
                      </span>
                    </td>
                    <td>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getCategoryColor(item.category)}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="text-xs text-slate-700">
                      <p className="font-medium text-slate-900">{item.manufacturer}</p>
                      <span className="font-mono text-[11px] text-slate-400">Batch: {item.batchNumber}</span>
                    </td>
                    <td className="font-bold text-slate-900 text-sm">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold text-sm ${isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                          {item.stockQuantity} units
                        </span>
                        {isLow && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> Reorder
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">Threshold: {item.reorderLevel}</span>
                    </td>
                    <td className="text-right">
                      {(user?.role === 'ADMIN' || user?.role === 'BILLING_STAFF') && (
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setNewStock(item.stockQuantity);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-navy-50 hover:bg-navy-100 text-navy-900 border border-navy-100 transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-cyan-700" /> Adjust Stock
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
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

      {/* Adjust Stock Modal */}
      {editingItem && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setEditingItem(null)} />
          <div className="modal-content max-w-sm p-0 overflow-hidden">
            <div className="px-5 py-4 bg-navy-950 text-white flex items-center justify-between border-b border-navy-800">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white">Adjust Medicine Stock</h2>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="w-6 h-6 rounded text-slate-400 hover:text-white hover:bg-navy-800 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider">Medicine Item</span>
                <p className="font-bold text-navy-950 text-sm mt-0.5">{editingItem.name}</p>
                <p className="text-slate-500 mt-0.5">{editingItem.genericName} • {editingItem.dosageStrength}</p>
              </div>

              <div>
                <label className="form-label mb-1">New In-Stock Quantity</label>
                <input
                  type="number"
                  value={newStock}
                  onChange={(e) => setNewStock(Number(e.target.value))}
                  className="form-input font-bold text-base"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="btn-secondary py-1.5 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateStock}
                  disabled={updating}
                  className="btn-primary py-1.5 text-xs"
                >
                  {updating ? 'Saving...' : 'Update Stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

