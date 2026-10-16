import React, { useEffect, useState, useCallback } from 'react';
import { ClipboardList, Clock, Globe, ShieldCheck } from 'lucide-react';
import { reportsApi } from '../../api';
import { Pagination } from '../../components/shared/Pagination';
import { PageLoader } from '../../components/shared/LoadingSpinner';
import { formatDateTime, extractError } from '../../lib/utils';
import type { AuditLog } from '../../types';
import toast from 'react-hot-toast';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 15;

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getAuditLogs({ page, limit });
      setLogs((res.data as any).data);
      setTotal((res.data as any).pagination.total);
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  const actionBadge = (action: string) => {
    if (action.includes('CREATE')) {
      return 'text-emerald-700 bg-emerald-50 border border-emerald-200';
    }
    if (action.includes('UPDATE') || action.includes('CHANGE')) {
      return 'text-cyan-800 bg-cyan-50 border border-cyan-200';
    }
    if (action.includes('DELETE') || action.includes('CANCEL') || action.includes('DEACTIVATE')) {
      return 'text-red-700 bg-red-50 border border-red-200';
    }
    return 'text-slate-700 bg-slate-50 border border-slate-200';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-navy-950 tracking-tight flex items-center gap-2.5">
              <ClipboardList className="w-6 h-6 text-cyan-600" />
              Audit Trail & Governance Logs
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-navy-50 text-navy-800 border border-navy-200">
              Immutable Ledger
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Tamper-evident operational audit trail tracking patient records, billing transactions, and staff access
          </p>
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Operator</th>
                <th>Action Type</th>
                <th>Target Resource</th>
                <th>Telemetry Details</th>
                <th>Network IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">No audit log records found</p>
                    <p className="text-xs text-slate-400 mt-1">System operations will be logged here in real-time</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="text-xs text-slate-600 whitespace-nowrap font-mono">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDateTime(log.timestamp)}</span>
                      </div>
                    </td>
                    <td>
                      <p className="font-bold text-sm text-navy-950 leading-snug">{log.userEmail}</p>
                      <span className="inline-block text-[10px] uppercase font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded mt-0.5">
                        {log.userRole}
                      </span>
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${actionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <p className="text-xs font-bold text-slate-800">{log.resource}</p>
                      {log.resourceId && (
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          ID: {log.resourceId.slice(0, 14)}…
                        </p>
                      )}
                    </td>
                    <td className="text-xs text-slate-600 max-w-xs truncate">
                      {log.details || '—'}
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        <Globe className="w-3 h-3 text-slate-400" />
                        {log.ipAddress || '127.0.0.1'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <Pagination currentPage={page} totalPages={Math.ceil(total / limit) || 1} total={total} limit={limit} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
};

