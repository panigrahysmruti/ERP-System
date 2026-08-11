import axios from 'axios';
import type { Customer, CustomerFollowUp } from '../types/customer';

const API_URL = '/api/customers';

// We assume there's a global interceptor that adds the auth token
// For now, we'll just use basic axios.

export const customerService = {
  getCustomers: async (params?: { page?: number; limit?: number; search?: string; status?: string; type?: string }) => {
    const response = await axios.get(API_URL, { params });
    return response.data;
  },

  getCustomerById: async (id: string) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data.customer as Customer;
  },

  createCustomer: async (customerData: Partial<Customer>) => {
    const response = await axios.post(API_URL, customerData);
    return response.data.customer as Customer;
  },

  updateCustomer: async (id: string, customerData: Partial<Customer>) => {
    const response = await axios.put(`${API_URL}/${id}`, customerData);
    return response.data.customer as Customer;
  },

  addFollowUp: async (id: string, note: string, followUpDate?: string) => {
    const response = await axios.post(`${API_URL}/${id}/follow-ups`, { note, followUpDate });
    return response.data.followUp as CustomerFollowUp;
  }
};
