import { auth } from "@/lib/auth/config";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // 公开路由：登录页、错误页、NextAuth API
  const publicRoutes = ["/auth/login", "/auth/error", "/api/auth"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // 静态资源
  const isStaticAsset = pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/);

  // 公开路由和静态资源直接放行
  if (isPublicRoute || isStaticAsset) {
    return;
  }

  // 未登录重定向到登录页
  if (!isLoggedIn) {
    return Response.redirect(new URL("/auth/login", req.nextUrl.origin));
  }
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
