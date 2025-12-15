import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "693a5ce3f6a1bee2d5add602", 
  requiresAuth: true // Ensure authentication is required for all operations
});
