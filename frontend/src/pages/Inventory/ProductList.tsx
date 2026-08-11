import { useState, useEffect } from 'react';
import { Plus, Search, AlertTriangle, Layers } from 'lucide-react';
import type { Product, MovementType } from '../../types/product';
import { productService } from '../../services/product.service';
import toast from 'react-hot-toast';
import ProductModal from './ProductModal';
import StockAdjustmentModal from './StockAdjustmentModal';

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getProducts({ 
        search, 
        lowStock: lowStockFilter ? 'true' : undefined 
      });
      setProducts(data?.products || []);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, lowStockFilter]);

  const handleCreateOrUpdate = async (data: any) => {
    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, data);
        toast.success('Product updated');
      } else {
        await productService.createProduct(data);
        toast.success('Product created');
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save product');
    }
  };

  const handleAdjustStock = async (data: { quantity: number; type: MovementType; reason: string }) => {
    if (!adjustingProduct) return;
    try {
      await productService.adjustStock(adjustingProduct.id, data);
      toast.success('Stock adjusted successfully');
      setIsStockModalOpen(false);
      setAdjustingProduct(null);
      fetchProducts();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to adjust stock');
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const openAdjustModal = (product: Product) => {
    setAdjustingProduct(product);
    setIsStockModalOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-slate-800">Product Catalog</h1>
        <button 
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition"
          onClick={() => {
            setEditingProduct(null);
            setIsProductModalOpen(true);
          }}
        >
          <Plus size={20} />
          Add Product
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex gap-4 border border-slate-100 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by name or SKU..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 border border-slate-200 px-4 py-2 rounded-lg">
          <input 
            type="checkbox" 
            id="lowStock"
            checked={lowStockFilter}
            onChange={(e) => setLowStockFilter(e.target.checked)}
            className="rounded text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="lowStock" className="text-sm font-medium text-slate-700 flex items-center gap-1 cursor-pointer">
            <AlertTriangle size={16} className={lowStockFilter ? "text-amber-500" : "text-slate-400"} />
            Low Stock Alerts Only
          </label>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading catalog...</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 text-sm">
              <tr>
                <th className="p-4 font-medium">Product details</th>
                <th className="p-4 font-medium">Price</th>
                <th className="p-4 font-medium">Stock Status</th>
                <th className="p-4 font-medium">Location</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const isLowStock = p.currentStock <= p.minStockAlert;
                return (
                  <tr key={p.id} className={`border-b border-slate-50 hover:bg-slate-50 transition ${isLowStock ? 'bg-amber-50/30' : ''}`}>
                    <td className="p-4">
                      <div className="font-medium text-slate-800 flex items-center gap-2">
                        <Layers size={16} className="text-indigo-400" />
                        {p.name}
                      </div>
                      <div className="text-sm text-slate-500 flex gap-2 mt-1">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs">{p.sku}</span>
                        {p.category && <span>• {p.category}</span>}
                      </div>
                    </td>
                    <td className="p-4 text-slate-700 font-medium">
                      ₹{p.unitPrice.toFixed(2)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-bold ${isLowStock ? 'text-amber-600' : 'text-slate-700'}`}>
                          {p.currentStock}
                        </span>
                        {isLowStock && (
                          <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                            <AlertTriangle size={12} /> Low Stock
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 text-sm">
                      {p.warehouseLocation || '-'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => openAdjustModal(p)}
                          className="text-emerald-600 hover:text-emerald-800 font-medium text-sm"
                        >
                          Adjust Stock
                        </button>
                        <span className="text-slate-300">|</span>
                        <button 
                          onClick={() => openEditModal(p)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingProduct}
      />

      <StockAdjustmentModal
        isOpen={isStockModalOpen}
        onClose={() => {
          setIsStockModalOpen(false);
          setAdjustingProduct(null);
        }}
        onSubmit={handleAdjustStock}
        product={adjustingProduct}
      />
    </div>
  );
}
