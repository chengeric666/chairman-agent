// Stub implementation to bypass Supabase authentication (server-side)
// This allows the API routes to work without Supabase in local mode

import { Session, User } from "@supabase/supabase-js";

// Create a mock user matching the client-side mock user
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

// Create a mock session
const MOCK_SESSION: Session = {
  access_token: "mock-access-token",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: "mock-refresh-token",
  user: MOCK_USER,
};

/**
 * Verifies user authentication (server-side)
 * In local mode, always returns mock user and session
 */
export async function verifyUserAuthenticated(): Promise<{
  session: Session;
  user: User;
}> {
  // In local mode, always return mock user
  return {
    session: MOCK_SESSION,
    user: MOCK_USER,
  };
}
