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
    // Use ipinfo.io which provides all data in a single call
    const response = await axios.get('https://ipinfo.io/json');
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