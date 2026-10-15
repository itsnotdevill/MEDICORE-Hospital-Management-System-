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
      toast.success('Inventory stock quantity updated');
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
      TABLET: 'bg-blue-50 text-blue-700',
      CAPSULE: 'bg-purple-50 text-purple-700',
      INJECTION: 'bg-red-50 text-red-700',
      SYRUP: 'bg-amber-50 text-amber-700',
      INHALER: 'bg-teal-50 text-teal-700',
    };
    return map[cat] || 'bg-gray-50 text-gray-700';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pharmacy & Dispensary Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Hospital medicine formulary, stock levels, batch tracking, and dispensary unit prices
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
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
            placeholder="Search medicine brand or generic name..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:border-[#1e3a5f]"
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
            className={`px-3 py-2 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors ${
              lowStockOnly
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Low Stock Alerts
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <PageLoader />
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Pill className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-base font-medium text-gray-600">No pharmacy items found</p>
            <p className="text-xs text-gray-400 mt-1">Adjust your search or filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/75 border-b border-gray-100 text-xs uppercase font-semibold text-gray-500">
                <tr>
                  <th className="px-5 py-3.5">Code / Item</th>
                  <th className="px-5 py-3.5">Generic & Strength</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Manufacturer</th>
                  <th className="px-5 py-3.5">Unit Price</th>
                  <th className="px-5 py-3.5">In Stock</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => {
                  const isLow = item.stockQuantity <= item.reorderLevel;

                  return (
                    <tr key={item._id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs text-gray-400 uppercase">{item.code}</span>
                        <p className="font-semibold text-gray-900 mt-0.5">{item.name}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-800 text-xs">{item.genericName}</p>
                        <span className="inline-block mt-0.5 text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {item.dosageStrength}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getCategoryColor(item.category)}`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-600">
                        {item.manufacturer}
                        <span className="block text-[11px] text-gray-400">Batch: {item.batchNumber}</span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-900">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold text-sm ${isLow ? 'text-amber-600' : 'text-gray-900'}`}>
                            {item.stockQuantity}
                          </span>
                          {isLow && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                              <AlertTriangle className="w-3 h-3" /> Reorder
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-400">Min: {item.reorderLevel}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {(user?.role === 'ADMIN' || user?.role === 'BILLING_STAFF') && (
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setNewStock(item.stockQuantity);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Adjust Stock
                          </button>
                        )}
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

      {/* Adjust Stock Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="px-5 py-4 bg-[#1e3a5f] text-white flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Adjust Medicine Stock
              </h2>
              <button onClick={() => setEditingItem(null)} className="text-white/80 hover:text-white">✕</button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div>
                <span className="text-gray-400 uppercase font-semibold">Medicine</span>
                <p className="font-bold text-gray-900 text-sm mt-0.5">{editingItem.name}</p>
                <p className="text-gray-500">{editingItem.genericName} • {editingItem.dosageStrength}</p>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">New Total In-Stock Quantity</label>
                <input
                  type="number"
                  value={newStock}
                  onChange={(e) => setNewStock(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-[#1e3a5f] font-semibold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateStock}
                  disabled={updating}
                  className="px-4 py-1.5 bg-[#1e3a5f] hover:bg-[#162d4a] text-white rounded-lg font-medium shadow-sm disabled:opacity-60"
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
