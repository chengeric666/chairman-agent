// Stub implementation to bypass Supabase dependency
// This allows the app to run without Supabase authentication in local mode

import { User } from "@supabase/supabase-js";

// Create a mock user for local development (anonymous access with user context)
const MOCK_USER: User = {
  id: "local-user-00000000-0000-0000-0000-000000000000",
  email: "local@localhost",
  aud: "authenticated",
  role: "authenticated",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {
    name: "Local User",
  },
};

// Mock Supabase client that returns a mock user (allows full functionality in local mode)
export function createSupabaseClient() {
  return {
    auth: {
      // Return mock user - enables full app functionality without authentication
      getUser: async (): Promise<{ data: { user: User | null }; error: null }> => {
        return {
          data: { user: MOCK_USER },
          error: null,
        };
      },
      // Mock other auth methods
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => ({
        data: { user: MOCK_USER, session: null },
        error: null,
      }),
    },
  };
}
