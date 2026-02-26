import ConsumablesManager from "./ConsumablesManager";

export const dynamic = "force-dynamic";

export default function AdminConsumablesPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Consumables</h1>
      <ConsumablesManager />
    </div>
  );
}
