import { useState } from 'react';
import { X, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import type { MovementType, Product } from '../../types/product';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { quantity: number; type: MovementType; reason: string }) => Promise<void>;
  product: Product | null;
}

export default function StockAdjustmentModal({ isOpen, onClose, onSubmit, product }: StockAdjustmentModalProps) {
  const [quantity, setQuantity] = useState('');
  const [type, setType] = useState<MovementType>('IN');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({ 
      quantity: parseInt(quantity), 
      type, 
      reason 
    });
    setLoading(false);
    // Reset form after submit in the parent by unmounting or handling state
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Adjust Stock</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 pb-0">
          <div className="bg-slate-50 p-4 rounded-lg mb-6 text-center border border-slate-100">
            <div className="text-sm text-slate-500 mb-1">{product.sku}</div>
            <div className="font-semibold text-slate-800 mb-2">{product.name}</div>
            <div className="text-2xl font-bold text-indigo-600">{product.currentStock}</div>
            <div className="text-xs text-slate-400">Current Stock</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 pt-0">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Adjustment Type *</label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition ${type === 'IN' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  <input type="radio" name="type" className="sr-only" checked={type === 'IN'} onChange={() => setType('IN')} />
                  <ArrowUpCircle size={18} /> Add (IN)
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition ${type === 'OUT' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  <input type="radio" name="type" className="sr-only" checked={type === 'OUT'} onChange={() => setType('OUT')} />
                  <ArrowDownCircle size={18} /> Remove (OUT)
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantity *</label>
              <input
                type="number"
                min="1"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reason *</label>
              <input
                type="text"
                required
                placeholder="e.g. New stock received, Damaged goods..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Confirm Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
