import axios from 'axios';

const API_URL = '/api/dashboard';

export const dashboardService = {
  getStats: async () => {
    const response = await axios.get(`${API_URL}/stats`);
    return response.data;
  }
};
