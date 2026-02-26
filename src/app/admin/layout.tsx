import Link from "next/link";
import type { ReactNode } from "react";

const links = [
  ["Back to Main Page", "/"],
  ["Dashboard", "/admin/dashboard"],
  ["Calendar", "/admin/calendar"],
  ["Services", "/admin/services"],
  ["Clients", "/admin/clients"],
  ["Marketing", "/admin/marketing"],
  ["Owner Settings", "/admin/settings"],
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-[220px_1fr] bg-black text-slate-100">
      <aside className="border-r border-slate-800 bg-slate-950 p-4">
        <h2 className="mb-4 text-xl font-semibold text-white">Admin</h2>
        <nav className="space-y-2">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="block rounded px-2 py-1 text-slate-200 hover:bg-slate-800 hover:text-white">{label}</Link>
          ))}
        </nav>
      </aside>
      <main className="bg-black p-6 text-slate-100">{children}</main>
    </div>
  );
}
