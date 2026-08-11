import { X, Printer } from 'lucide-react';
import type { Challan } from '../../types/challan';
import { format } from 'date-fns';

interface ChallanPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  challan: Challan;
}

export default function ChallanPrintModal({ isOpen, onClose, challan }: ChallanPrintModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const calculateSubtotal = () => {
    return (challan.items || []).reduce((sum, item) => {
      const price = item.snapshotData?.unitPrice || 0;
      return sum + price * item.quantity;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const gstTax = subtotal * 0.18; // 18% GST calculation
  const grandTotal = subtotal + gstTax;

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto print:max-h-none print:shadow-none print:w-full print:rounded-none">
        
        {/* Modal Controls - Hidden during Printing */}
        <div className="flex justify-between items-center p-4 border-b border-slate-100 print:hidden bg-slate-50">
          <div className="font-semibold text-slate-700 text-sm">
            Official GST Tax Invoice & Delivery Challan Document
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition shadow-sm"
            >
              <Printer size={16} /> Print / Save as PDF
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
              <X size={22} />
            </button>
          </div>
        </div>

        {/* PRINTABLE DOCUMENT CONTAINER */}
        <div id="printable-invoice" className="p-8 sm:p-12 text-slate-800 space-y-8 font-sans print:p-6 print:text-black">
          
          {/* Document Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
            <div>
              <div className="text-2xl font-extrabold tracking-wider uppercase text-indigo-950 print:text-black">
                MINI ERP OPERATIONS PORTAL
              </div>
              <div className="text-xs text-slate-500 mt-1 print:text-slate-700">
                100 Industrial Estate, Tech Zone, Mumbai - 400001
              </div>
              <div className="text-xs text-slate-500 print:text-slate-700">
                GSTIN: <span className="font-mono font-semibold">27AAACM1234F1ZV</span> • Phone: +91 22 5550 1234
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block bg-slate-900 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded print:border print:border-black print:text-black print:bg-white">
                TAX INVOICE / DELIVERY CHALLAN
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-2">
                {challan.challanNumber}
              </div>
              <div className="text-xs text-slate-500 print:text-slate-700">
                Date: {format(new Date(challan.createdAt), 'dd/MM/yyyy')}
              </div>
            </div>
          </div>

          {/* Billed To & Shipped To Section */}
          <div className="grid grid-cols-2 gap-8 text-xs border border-slate-200 rounded-xl p-4 print:border-black">
            <div>
              <div className="font-bold text-slate-400 uppercase tracking-wider mb-1 print:text-black">
                Customer Details (Billed To)
              </div>
              <div className="font-bold text-slate-900 text-sm">{challan.customer?.name}</div>
              {challan.customer?.businessName && (
                <div className="font-semibold text-slate-700">{challan.customer.businessName}</div>
              )}
              {challan.customer?.gstNumber && (
                <div className="text-slate-600 mt-0.5">GSTIN: <span className="font-mono font-semibold">{challan.customer.gstNumber}</span></div>
              )}
              <div className="text-slate-500 mt-1">{challan.customer?.mobile} • {challan.customer?.email}</div>
            </div>

            <div>
              <div className="font-bold text-slate-400 uppercase tracking-wider mb-1 print:text-black">
                Delivery Address
              </div>
              <div className="text-slate-700 leading-relaxed">
                {challan.customer?.address || 'Same as Billing Address'}
              </div>
              <div className="mt-2 text-slate-500">
                Dispatch Status: <span className="font-bold text-slate-900 uppercase">{challan.status}</span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <table className="w-full text-left text-xs border-collapse border border-slate-200 print:border-black">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 print:bg-slate-200 print:border-black">
                  <th className="p-3 border-r border-slate-200 print:border-black w-12 text-center">#</th>
                  <th className="p-3 border-r border-slate-200 print:border-black">Item Description</th>
                  <th className="p-3 border-r border-slate-200 print:border-black font-mono w-28">SKU</th>
                  <th className="p-3 border-r border-slate-200 print:border-black text-right w-24">Rate (₹)</th>
                  <th className="p-3 border-r border-slate-200 print:border-black text-center w-20">Qty</th>
                  <th className="p-3 text-right w-28">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 print:divide-black">
                {(challan.items || []).map((item, idx) => {
                  const snap = item.snapshotData;
                  const price = snap?.unitPrice || 0;
                  const lineTotal = price * item.quantity;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-3 text-center border-r border-slate-200 print:border-black font-semibold text-slate-500">{idx + 1}</td>
                      <td className="p-3 border-r border-slate-200 print:border-black font-semibold text-slate-900">{snap?.name || item.product?.name}</td>
                      <td className="p-3 border-r border-slate-200 print:border-black font-mono text-slate-600">{snap?.sku || item.product?.sku}</td>
                      <td className="p-3 border-r border-slate-200 print:border-black text-right">{price.toFixed(2)}</td>
                      <td className="p-3 border-r border-slate-200 print:border-black text-center font-bold">{item.quantity}</td>
                      <td className="p-3 text-right font-bold text-slate-900">{lineTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Tax Calculation & Financial Summary */}
          <div className="flex justify-between items-start text-xs pt-2">
            <div className="max-w-md text-slate-500 space-y-1">
              <div className="font-bold text-slate-700">Terms & Conditions:</div>
              <div>1. Goods once dispatched cannot be returned without prior written approval.</div>
              <div>2. Subject to Mumbai Jurisdiction only.</div>
            </div>

            <div className="w-64 border border-slate-200 rounded-lg p-3 space-y-1.5 bg-slate-50 print:bg-white print:border-black">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Amount:</span>
                <span className="font-semibold text-slate-800">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Integrated GST (18%):</span>
                <span className="font-semibold text-slate-800">₹{gstTax.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-300 pt-1.5 flex justify-between font-bold text-sm text-indigo-950 print:text-black">
                <span>Grand Total:</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Signatures Footer */}
          <div className="pt-12 flex justify-between items-end text-xs text-slate-500">
            <div>
              <div className="border-t border-slate-300 w-40 pt-1 text-center font-medium">Customer Signature</div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-slate-800 mb-8">For MINI ERP OPERATIONS PORTAL</div>
              <div className="border-t border-slate-300 w-48 pt-1 text-center font-medium">Authorized Signatory</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
