import Link from "next/link";
import type { ReactNode } from "react";

const links = [
  ["Back to Main Page", "/"],
  ["Dashboard", "/admin/dashboard"],
  ["Calendar", "/admin/calendar"],
  ["Services", "/admin/services"],
  ["Clients", "/admin/clients"],
  ["Marketing", "/admin/marketing"],
  ["Working Times", "/admin/working-times"],
];

const systemSettingsLinks = [
  ["Owner Settings", "/admin/settings"],
  ["Email Settings", "/admin/email-settings"],
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

          <div className="pt-3">
            <div className="mb-2 border-t border-slate-800" />
            <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">System settings</p>
          </div>

          {systemSettingsLinks.map(([label, href]) => (
            <Link key={href} href={href} className="block rounded px-2 py-1 text-slate-200 hover:bg-slate-800 hover:text-white">{label}</Link>
          ))}
        </nav>
      </aside>
      <main className="bg-black p-6 text-slate-100">{children}</main>
    </div>
  );
}
