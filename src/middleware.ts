import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/app", "/konselor", "/admin"];

export async function middleware(request: NextRequest) {
  let res = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          res = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED.some((p) => path === p || path.startsWith(p + "/"));
  const isAuthPage = path === "/login" || path === "/register";

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    if (isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
    return res;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,status,banned_reason")
    .eq("id", user.id)
    .single();

  const role = (profile?.role ?? "user") as "user" | "konselor" | "admin";
  const home = role === "admin" ? "/admin" : role === "konselor" ? "/konselor" : "/app";

  if (profile?.status === "dibanned") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("banned", "1");
    const redirect = NextResponse.redirect(url);
    request.cookies.getAll().forEach((c) => {
      if (c.name.startsWith("sb-")) redirect.cookies.delete(c.name);
    });
    return redirect;
  }

  if (path === "/" || isAuthPage) {
    const next = request.nextUrl.searchParams.get("next");
    const url = request.nextUrl.clone();
    url.pathname = next && next.startsWith("/") && !next.startsWith("//") ? next : home;
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (
    (path.startsWith("/admin") && role !== "admin") ||
    (path.startsWith("/konselor") && role !== "konselor") ||
    (path.startsWith("/app") && role !== "user")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = home;
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3)$).*)",
  ],
};
