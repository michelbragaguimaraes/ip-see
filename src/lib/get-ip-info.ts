import axios from 'axios';

interface IpInfo {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  timezone?: string;
  org?: string; // ISP information
  postal?: string;
  loc?: string;
}

export async function getIpInfo(): Promise<IpInfo> {
  try {
    // Use our server-side API endpoint instead of calling ipinfo.io directly
    const response = await axios.get('/api/ip');
    return response.data;
  } catch (error) {
    console.error('Error fetching IP info:', error);
    if (axios.isAxiosError(error)) {
      if (error.code === 'ERR_NETWORK') {
        throw new Error('Network error. Please check your internet connection.');
      }
      if (error.response?.status === 429) {
        throw new Error('Too many requests. Please try again later.');
      }
      throw new Error(`Error: ${error.response?.data?.message || error.message}`);
    }
    throw new Error('Failed to fetch IP information');
  }
} 