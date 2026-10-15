import React, { useEffect, useState, useCallback } from 'react';
import { ClipboardList } from 'lucide-react';
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

  const actionColor = (action: string) => {
    if (action.includes('CREATE')) return 'text-green-600 bg-green-50';
    if (action.includes('UPDATE') || action.includes('CHANGE')) return 'text-blue-600 bg-blue-50';
    if (action.includes('DELETE') || action.includes('CANCEL') || action.includes('DEACTIVATE')) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-[#1e3a5f]" />
          Audit Logs
        </h1>
        <p className="page-subtitle">Track all system changes and activities</p>
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Details</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id}>
                    <td className="text-xs text-gray-500 whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                    <td>
                      <p className="font-medium text-sm text-gray-900">{log.userEmail}</p>
                      <p className="text-xs text-gray-400">{log.userRole}</p>
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${actionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <p className="text-sm font-medium text-gray-700">{log.resource}</p>
                      {log.resourceId && <p className="text-xs text-gray-400 font-mono">{log.resourceId.slice(0, 12)}…</p>}
                    </td>
                    <td className="text-sm text-gray-500 max-w-xs truncate">{log.details || '—'}</td>
                    <td className="text-xs text-gray-400 font-mono">{log.ipAddress || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <Pagination currentPage={page} totalPages={Math.ceil(total / limit)} total={total} limit={limit} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
};
