"use client";

import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";

// Zitadel OIDC end_session endpoint for federated logout
const ZITADEL_END_SESSION_URL = "https://zitadel.aotsea.com/oidc/v1/end_session";
const ZITADEL_CLIENT_ID = process.env.NEXT_PUBLIC_ZITADEL_CLIENT_ID || "348526968934825987";

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
    );
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user;
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0]?.toUpperCase() || "U";

  const handleSignOut = async () => {
    // 1. Clear NextAuth session first (don't redirect)
    await signOut({ redirect: false });

    // 2. Redirect to Zitadel's end_session endpoint for federated logout
    // This ensures the Zitadel SSO session is also terminated
    // Note: post_logout_redirect_uri needs to be registered in Zitadel app config
    // If not registered, we omit it and Zitadel will show its default logout page
    const endSessionUrl = new URL(ZITADEL_END_SESSION_URL);
    endSessionUrl.searchParams.set("client_id", ZITADEL_CLIENT_ID);

    // Set post_logout_redirect_uri to redirect back to login page after logout
    endSessionUrl.searchParams.set("post_logout_redirect_uri", `${window.location.origin}/auth/login`);

    // Redirect to Zitadel to terminate SSO session
    window.location.href = endSessionUrl.toString();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
            <AvatarFallback className="bg-blue-600 text-white text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name || "用户"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="cursor-default">
          <User className="mr-2 h-4 w-4" />
          <span>个人设置</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-red-600 focus:text-red-600 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>退出登录</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
