import axios from 'axios';

const BASE_URL = 'https://api.mail.tm';

// Rate limiting configuration
const RATE_LIMIT_DELAY = 2000; // 2 seconds between requests
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds between retries

let lastRequestTime = 0;

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to respect rate limits
const rateLimitedRequest = async (requestFn: () => Promise<any>) => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await delay(RATE_LIMIT_DELAY - timeSinceLastRequest);
  }
  
  lastRequestTime = Date.now();
  return requestFn();
};

// Helper function to retry on rate limit errors
const retryOnRateLimit = async (requestFn: () => Promise<any>, retries = MAX_RETRIES): Promise<any> => {
  try {
    return await rateLimitedRequest(requestFn);
  } catch (error: any) {
    if (error.response?.status === 429 && retries > 0) {
      console.log(`Rate limited, retrying in ${RETRY_DELAY/1000} seconds... (${retries} retries left)`);
      await delay(RETRY_DELAY);
      return retryOnRateLimit(requestFn, retries - 1);
    }
    throw error;
  }
};

export interface Email {
  id: string;
  from: string;
  subject: string;
  date: string;
  attachments: { filename: string; contentType: string; size: number }[];
  body: string;
  textBody: string;
  htmlBody: string;
}

export const tempEmailService = {
  generateEmail: async (): Promise<string> => {
    try {
      // Get available domains
      const domainsResponse = await retryOnRateLimit(() => 
        axios.get(`${BASE_URL}/domains`)
      );
      console.log('Raw domains response:', JSON.stringify(domainsResponse.data, null, 2));
      
      // The API returns a hydra collection
      const domains = domainsResponse.data['hydra:member'];
      if (!Array.isArray(domains) || domains.length === 0) {
        throw new Error('No domains available');
      }
      
      const domain = domains[0].domain;
      
      // Generate random username
      const randomString = Math.random().toString(36).substring(2, 10);
      const email = `${randomString}@${domain}`;
      
      // Create account
      const accountResponse = await retryOnRateLimit(() => 
        axios.post(`${BASE_URL}/accounts`, {
          address: email,
          password: randomString
        })
      );
      console.log('Account creation response:', accountResponse.data);
      
      // Get token
      const tokenResponse = await retryOnRateLimit(() => 
        axios.post(`${BASE_URL}/token`, {
          address: email,
          password: randomString
        })
      );
      console.log('Token response:', tokenResponse.data);
      
      // Store token in localStorage for future requests
      localStorage.setItem('mail_tm_token', tokenResponse.data.token);
      
      return email;
    } catch (error) {
      console.error('Error in generateEmail:', error);
      throw error;
    }
  },

  getEmails: async (email: string): Promise<Email[]> => {
    const token = localStorage.getItem('mail_tm_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    try {
      const response = await retryOnRateLimit(() => 
        axios.get(`${BASE_URL}/messages`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      );
      console.log('Get emails response:', response.data);
      
      // The API returns a hydra collection
      const messages = response.data['hydra:member'];
      if (!Array.isArray(messages)) {
        throw new Error('Invalid messages response structure');
      }
      
      return messages.map((msg: any) => ({
        id: msg.id,
        from: msg.from.address,
        subject: msg.subject,
        date: msg.createdAt,
        attachments: msg.attachments || [],
        body: msg.text,
        textBody: msg.text,
        htmlBody: msg.html
      }));
    } catch (error) {
      console.error('Error in getEmails:', error);
      throw error;
    }
  },

  getEmailContent: async (email: string, id: string): Promise<Email> => {
    const token = localStorage.getItem('mail_tm_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    try {
      const response = await retryOnRateLimit(() => 
        axios.get(`${BASE_URL}/messages/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      );
      console.log('Get email content response:', response.data);
      
      const msg = response.data;
      return {
        id: msg.id,
        from: msg.from.address,
        subject: msg.subject,
        date: msg.createdAt,
        attachments: msg.attachments || [],
        body: msg.text,
        textBody: msg.text,
        htmlBody: msg.html
      };
    } catch (error) {
      console.error('Error in getEmailContent:', error);
      throw error;
    }
  }
}; 