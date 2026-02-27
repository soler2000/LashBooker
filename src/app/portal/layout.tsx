import Link from "next/link";
import type { ReactNode } from "react";

const links = [
  ["Back to Main Page", "/"],
  ["Appointments", "/portal/appointments"],
  ["Book New", "/book"],
  ["Policies", "/policies"],
  ["Cookie Policy", "/cookie-policy"],
];

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid min-h-screen max-w-6xl gap-6 px-4 py-8 md:grid-cols-[220px_1fr]">
      <aside className="rounded border bg-white p-4">
        <h2 className="mb-4 text-xl font-semibold">Client Portal</h2>
        <nav className="space-y-2">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="block rounded px-2 py-1 hover:bg-slate-100">{label}</Link>
          ))}
        </nav>
      </aside>
      <main>{children}</main>
    </div>
  );
}
