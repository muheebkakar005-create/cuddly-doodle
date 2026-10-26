"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, GridIcon, HomeIcon, UserIcon } from "./Icons";
import { useAuth } from "@/context/AuthContext";

export function BottomNav() {
  const pathname = usePathname();
  const { role } = useAuth();

  // Hide on salon booking pages and admin/owner dashboard screens
  if (
    pathname.startsWith("/salons") ||
    pathname.startsWith("/super-admin") ||
    pathname.startsWith("/shop-owner") ||
    (pathname.startsWith("/admin") && pathname !== "/admin/login") ||
    (pathname.startsWith("/owner") && pathname !== "/owner/login" && pathname !== "/owner/register")
  ) {
    return null;
  }

  const profileHref =
    role === "admin"
      ? "/super-admin/dashboard"
      : role === "owner"
      ? "/shop-owner/dashboard"
      : role === "customer"
      ? "/bookings"
      : "/login";

  const profileLabel =
    role === "admin" ? "Admin" : role === "owner" ? "Portal" : role === "customer" ? "Account" : "Sign in";

  const items = [
    { href: "/", label: "Home", icon: HomeIcon },
    { href: "/explore", label: "Explore", icon: GridIcon },
    { href: "/bookings", label: "Bookings", icon: CalendarIcon },
    { href: profileHref, label: profileLabel, icon: UserIcon },
  ];

  return (
    <div className="fixed inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] z-50 flex justify-center px-4 md:hidden pointer-events-none">
      <nav
        className="pointer-events-auto relative flex w-full max-w-sm items-center justify-around rounded-full bg-[#16161D]/95 px-3 py-1.5 border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl"
        aria-label="Mobile Bottom Navigation"
      >
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href) ||
                (item.label === "Admin" && (pathname.startsWith("/admin") || pathname.startsWith("/super-admin"))) ||
                (item.label === "Portal" && (pathname.startsWith("/owner") || pathname.startsWith("/shop-owner")));

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-1 flex-col items-center justify-center py-1 text-center transition-all duration-300"
            >
              {active ? (
                <div className="flex flex-col items-center -mt-5">
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-[0_8px_20px_rgba(255,255,255,0.35)] ring-4 ring-[#0C0C0E] transition-all duration-300 scale-105">
                    <Icon className="h-5 w-5 text-black stroke-[2.4]" />
                  </div>
                  <span className="mt-1 text-[10px] font-bold tracking-tight text-white">
                    {item.label}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center py-1 opacity-55 hover:opacity-100 transition-opacity">
                  <Icon className="h-5 w-5 text-white stroke-[1.8]" />
                  <span className="mt-1 text-[10px] font-medium text-white/70">
                    {item.label}
                  </span>
                </div>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
