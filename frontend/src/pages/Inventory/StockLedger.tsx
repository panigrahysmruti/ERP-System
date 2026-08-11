import { useState, useEffect } from 'react';
import { ArrowDownCircle, ArrowUpCircle, User } from 'lucide-react';
import type { StockLog } from '../../types/product';
import { productService } from '../../services/product.service';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function StockLedger() {
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await productService.getMovementLogs();
      setLogs(data?.logs || []);
    } catch (error) {
      toast.error('Failed to load stock ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-slate-800">Stock Movement Ledger</h1>
        <button 
          onClick={fetchLogs}
          className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
        >
          Refresh Ledger
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading ledger...</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 text-sm">
              <tr>
                <th className="p-4 font-medium">Date & Time</th>
                <th className="p-4 font-medium">Product</th>
                <th className="p-4 font-medium">Movement</th>
                <th className="p-4 font-medium">Reason / Reference</th>
                <th className="p-4 font-medium">User</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50 transition text-sm">
                  <td className="p-4 text-slate-500">
                    {format(new Date(log.createdAt), 'MMM d, yyyy h:mm a')}
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-800">{log.product?.name}</div>
                    <div className="text-xs text-slate-400 font-mono">{log.product?.sku}</div>
                  </td>
                  <td className="p-4">
                    {log.type === 'IN' ? (
                      <span className="flex items-center gap-1 text-green-700 font-bold bg-green-50 px-2 py-1 rounded w-fit">
                        <ArrowUpCircle size={14} /> +{log.quantity}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-1 rounded w-fit">
                        <ArrowDownCircle size={14} /> -{log.quantity}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-slate-600">
                    {log.reason || '-'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-slate-700">
                      <div className="bg-slate-200 p-1 rounded-full"><User size={12} /></div>
                      {log.user?.name || 'System'}
                    </div>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">No stock movements found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
