import Link from "next/link";
import type { ReactNode } from "react";

const links = [
  ["Dashboard", "/admin/dashboard"],
  ["Calendar", "/admin/calendar"],
  ["Services", "/admin/services"],
  ["Clients", "/admin/clients"],
  ["Marketing", "/admin/marketing"],
  ["Owner Settings", "/admin/settings"],
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-[220px_1fr]">
      <aside className="border-r bg-white p-4">
        <h2 className="mb-4 text-xl font-semibold">Admin</h2>
        <nav className="space-y-2">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="block rounded px-2 py-1 hover:bg-slate-100">{label}</Link>
          ))}
        </nav>
      </aside>
      <main className="p-6">{children}</main>
    </div>
  );
}
