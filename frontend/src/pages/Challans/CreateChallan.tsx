import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, AlertTriangle, FileCheck, Save } from 'lucide-react';
import { customerService } from '../../services/customer.service';
import { productService } from '../../services/product.service';
import { challanService } from '../../services/challan.service';
import type { Customer } from '../../types/customer';
import type { Product } from '../../types/product';
import type { ChallanStatus } from '../../types/challan';
import toast from 'react-hot-toast';

interface ItemRow {
  productId: string;
  quantity: number;
}

export default function CreateChallan() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [items, setItems] = useState<ItemRow[]>([{ productId: '', quantity: 1 }]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [custData, prodData] = await Promise.all([
          customerService.getCustomers({ limit: 100 }),
          productService.getProducts({ limit: 100 })
        ]);
        setCustomers(custData?.customers || []);
        setProducts(prodData?.products || []);
      } catch (error) {
        toast.error('Failed to load customers and products');
      }
    };
    loadData();
  }, []);

  const addItemRow = () => {
    setItems([...items, { productId: '', quantity: 1 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemRow = (index: number, field: keyof ItemRow, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const productMap = new Map(products.map(p => [p.id, p]));

  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => {
      const prod = productMap.get(item.productId);
      return sum + (prod ? prod.unitPrice * (item.quantity || 0) : 0);
    }, 0);
  };

  const calculateTotalQuantity = () => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  };

  const handleSubmit = async (targetStatus: ChallanStatus) => {
    if (!selectedCustomerId) {
      toast.error('Please select a customer');
      return;
    }

    const invalidItems = items.filter(i => !i.productId || !i.quantity || i.quantity <= 0);
    if (invalidItems.length > 0) {
      toast.error('Please complete all product rows with valid quantities');
      return;
    }

    // If confirming, check stock availability locally first for immediate feedback
    if (targetStatus === 'CONFIRMED') {
      for (const item of items) {
        const prod = productMap.get(item.productId);
        if (prod && item.quantity > prod.currentStock) {
          toast.error(`Insufficient stock for "${prod.name}" (Stock: ${prod.currentStock}, Requested: ${item.quantity})`);
          return;
        }
      }
    }

    try {
      setLoading(true);
      const challan = await challanService.createChallan({
        customerId: selectedCustomerId,
        items,
        status: targetStatus
      });

      toast.success(targetStatus === 'CONFIRMED' ? 'Challan confirmed & stock deducted!' : 'Draft Challan saved!');
      navigate(`/challans/${challan.id}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create sales challan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <button 
        onClick={() => navigate('/challans')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition"
      >
        <ArrowLeft size={16} /> Back to Sales Challans
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-800">Create New Sales Challan</h1>
        <p className="text-sm text-slate-500 mt-1">Select customer and products to dispatch stock.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        {/* Customer Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Customer *</label>
          <select
            required
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-white"
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
          >
            <option value="">-- Select Customer --</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.businessName ? `(${c.businessName})` : ''} - {c.mobile}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Product Table */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-slate-800 text-sm">Product Dispatch Items</h3>
            <button
              type="button"
              onClick={addItemRow}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
            >
              <Plus size={16} /> Add Another Product
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3 w-32">Price (₹)</th>
                  <th className="p-3 w-32">Quantity</th>
                  <th className="p-3 w-32 text-right">Subtotal</th>
                  <th className="p-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {items.map((item, index) => {
                  const selectedProd = productMap.get(item.productId);
                  const isStockWarning = selectedProd && item.quantity > selectedProd.currentStock;

                  return (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="p-3">
                        <select
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white text-sm"
                          value={item.productId}
                          onChange={(e) => updateItemRow(index, 'productId', e.target.value)}
                        >
                          <option value="">Select product...</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku}) - Stock: {p.currentStock}
                            </option>
                          ))}
                        </select>
                        {selectedProd && (
                          <div className="mt-1 flex items-center gap-2 text-xs">
                            <span className="text-slate-400">Avail Stock: {selectedProd.currentStock}</span>
                            {isStockWarning && (
                              <span className="text-amber-600 font-semibold flex items-center gap-1">
                                <AlertTriangle size={12} /> Exceeds Stock!
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-slate-700 font-medium">
                        {selectedProd ? `₹${selectedProd.unitPrice.toFixed(2)}` : '-'}
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          min="1"
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-sm"
                          value={item.quantity}
                          onChange={(e) => updateItemRow(index, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td className="p-3 text-right font-semibold text-slate-800">
                        {selectedProd ? `₹${(selectedProd.unitPrice * (item.quantity || 0)).toFixed(2)}` : '₹0.00'}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow(index)}
                          className="text-slate-400 hover:text-rose-600 transition"
                          disabled={items.length === 1}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Summary */}
        <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center border border-slate-100">
          <div>
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Total Items</span>
            <div className="text-xl font-bold text-slate-800">{calculateTotalQuantity()} units</div>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Total Estimated Value</span>
            <div className="text-2xl font-bold text-indigo-600">₹{calculateGrandTotal().toFixed(2)}</div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit('DRAFT')}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition"
          >
            <Save size={18} /> Save as Draft
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit('CONFIRMED')}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition shadow-sm"
          >
            <FileCheck size={18} /> Confirm & Dispatch Stock
          </button>
        </div>
      </div>
    </div>
  );
}
