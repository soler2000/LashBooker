import ServicesManager from "./ServicesManager";

export const dynamic = "force-dynamic";

export default function AdminServicesPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Services</h1>
      <ServicesManager />
    </div>
  );
}
