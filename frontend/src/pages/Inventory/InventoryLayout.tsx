import { useState } from 'react';
import ProductList from './ProductList';
import StockLedger from './StockLedger';
import { Package, FileText } from 'lucide-react';

export default function InventoryLayout() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'ledger'>('catalog');

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex border-b border-slate-200 mb-6">
        <button
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition ${
            activeTab === 'catalog' 
              ? 'border-b-2 border-indigo-600 text-indigo-600' 
              : 'text-slate-500 hover:text-slate-700 hover:border-slate-300 border-b-2 border-transparent'
          }`}
          onClick={() => setActiveTab('catalog')}
        >
          <Package size={18} />
          Product Catalog
        </button>
        <button
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition ${
            activeTab === 'ledger' 
              ? 'border-b-2 border-indigo-600 text-indigo-600' 
              : 'text-slate-500 hover:text-slate-700 hover:border-slate-300 border-b-2 border-transparent'
          }`}
          onClick={() => setActiveTab('ledger')}
        >
          <FileText size={18} />
          Stock Ledger
        </button>
      </div>

      <div className="mt-4">
        {activeTab === 'catalog' && <ProductList />}
        {activeTab === 'ledger' && <StockLedger />}
      </div>
    </div>
  );
}
