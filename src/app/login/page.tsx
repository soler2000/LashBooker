import { signIn } from "@/lib/auth";

export default function LoginPage() {
  return (
    <form action={async (formData) => {
      "use server";
      await signIn("credentials", {
        email: String(formData.get("email")),
        password: String(formData.get("password")),
        redirectTo: "/admin/dashboard",
      });
    }} className="mx-auto mt-20 max-w-md space-y-4 rounded bg-white p-6 shadow">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <input name="email" type="email" placeholder="Email" className="w-full rounded border p-2" required />
      <input name="password" type="password" placeholder="Password" className="w-full rounded border p-2" required />
      <button className="w-full rounded bg-black p-2 text-white" type="submit">Sign in</button>
    </form>
  );
}
