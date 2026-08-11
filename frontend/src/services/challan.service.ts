import axios from 'axios';
import type { Challan, ChallanStatus } from '../types/challan';

const API_URL = '/api/challans';

export const challanService = {
  getChallans: async (params?: { page?: number; limit?: number; search?: string; status?: string; customerId?: string }) => {
    const response = await axios.get(API_URL, { params });
    return response.data;
  },

  getChallanById: async (id: string) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data.challan as Challan;
  },

  createChallan: async (data: { customerId: string; items: { productId: string; quantity: number }[]; status?: ChallanStatus }) => {
    const response = await axios.post(API_URL, data);
    return response.data.challan as Challan;
  },

  updateChallanStatus: async (id: string, status: ChallanStatus) => {
    const response = await axios.patch(`${API_URL}/${id}/status`, { status });
    return response.data.challan as Challan;
  }
};
