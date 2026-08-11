import axios from 'axios';
import type { Product, MovementType } from '../types/product';

const API_URL = '/api/products';
const INVENTORY_URL = '/api/inventory';

export const productService = {
  getProducts: async (params?: { page?: number; limit?: number; search?: string; category?: string; lowStock?: string }) => {
    const response = await axios.get(API_URL, { params });
    return response.data;
  },

  getProductById: async (id: string) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data.product as Product;
  },

  createProduct: async (productData: Partial<Product>) => {
    const response = await axios.post(API_URL, productData);
    return response.data.product as Product;
  },

  updateProduct: async (id: string, productData: Partial<Product>) => {
    const response = await axios.put(`${API_URL}/${id}`, productData);
    return response.data.product as Product;
  },

  adjustStock: async (id: string, data: { quantity: number; type: MovementType; reason: string }) => {
    const response = await axios.post(`${API_URL}/${id}/adjust-stock`, data);
    return response.data;
  },

  getMovementLogs: async (params?: { page?: number; limit?: number; productId?: string }) => {
    const response = await axios.get(`${INVENTORY_URL}/movement-logs`, { params });
    return response.data;
  }
};
