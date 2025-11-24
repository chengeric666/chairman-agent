// Stub implementation to bypass Supabase dependency
// This allows the app to run without Supabase authentication
// All authentication checks will pass through without actual user verification

import { User } from "@supabase/supabase-js";

// Mock Supabase client that returns no user (anonymous access)
export function createSupabaseClient() {
  return {
    auth: {
      // Return no user - allows anonymous access
      getUser: async (): Promise<{ data: { user: User | null }; error: null }> => {
        return {
          data: { user: null },
          error: null,
        };
      },
      // Mock other auth methods if needed
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: { message: "Supabase disabled - local mode", name: "AuthError", status: 401 },
      }),
    },
  };
}
