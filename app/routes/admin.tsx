import { json, redirect } from "@remix-run/node";
import { Link, Outlet, useLocation } from "@remix-run/react";
import { requireUserId } from "~/utils/auth.server";
import { prisma } from "~/utils/db.server";
import { motion } from "framer-motion";

export async function loader({ request }) {
  const userId = await requireUserId(request);
  
  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: true },
  });

  if (!user?.roles?.some(role => role.name === "ADMIN")) {
    return redirect("/");
  }

  return json({ user });
}

export default function AdminLayout() {
  const location = useLocation();
  
  const navItems = [
    { name: "Dashboard", href: "/admin" },
    { name: "Users", href: "/admin/users" },
    { name: "Problems", href: "/admin/problems" },
    { name: "Settings", href: "/admin/settings" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <nav className="bg-gray-800/50 backdrop-blur-lg border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl font-bold text-white">DeepSkill Admin</span>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`${
                          isActive
                            ? "bg-purple-500/20 text-white"
                            : "text-gray-300 hover:bg-purple-500/10 hover:text-white"
                        } px-3 py-2 rounded-md text-sm font-medium transition-colors`}
                      >
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
