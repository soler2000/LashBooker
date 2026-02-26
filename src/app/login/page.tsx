import { auth, signIn } from "@/lib/auth";
import { hasDatabaseConfiguration, prisma } from "@/lib/prisma";
import { AuthError } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams?: {
    redirectTo?: string;
    error?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const redirectTo = searchParams?.redirectTo?.startsWith("/") ? searchParams.redirectTo : "";
  const showInvalidCredentialsError = searchParams?.error === "invalid_credentials";

  return (
    <form action={async (formData) => {
      "use server";
      try {
        const hasDatabaseUrl = hasDatabaseConfiguration();
        const email = String(formData.get("email") ?? "").trim().toLowerCase();
        const requestedRedirect = String(formData.get("redirectTo") ?? "");

        const signInResult = await signIn("credentials", {
          email,
          password: String(formData.get("password")),
          redirect: false,
        });

        if (signInResult?.error) {
          redirect(`/login?error=invalid_credentials&redirectTo=${encodeURIComponent(requestedRedirect || "/portal/appointments")}`);
        }

        let isAdmin = false;
        let mustChangePassword = false;

        if (hasDatabaseUrl) {
          const user = await prisma.user.findUnique({
            where: { email },
            select: { role: true, mustChangePassword: true },
          });

          isAdmin = ["STAFF", "ADMIN", "OWNER"].includes(user?.role ?? "CLIENT");
          mustChangePassword = Boolean(user?.mustChangePassword);
        } else {
          const session = await auth();
          isAdmin = ["STAFF", "ADMIN", "OWNER"].includes(session?.user?.role ?? "CLIENT");
          mustChangePassword = Boolean(session?.user?.mustChangePassword);
        }

        if (mustChangePassword) {
          redirect("/admin/change-password");
        }

        if (requestedRedirect.startsWith("/")) {
          if (!requestedRedirect.startsWith("/admin") || isAdmin) {
            redirect(requestedRedirect);
          }
        }

        redirect(isAdmin ? "/admin/dashboard" : "/portal/appointments");
      } catch (error) {
        if (error instanceof AuthError && error.type === "CredentialsSignin") {
          redirect(`/login?error=invalid_credentials&redirectTo=${encodeURIComponent(String(formData.get("redirectTo") ?? "/portal/appointments"))}`);
        }
        throw error;
      }
    }} className="mx-auto mt-20 max-w-md space-y-4 rounded bg-white p-6 shadow">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      {showInvalidCredentialsError ? (
        <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          Invalid email or password.
        </p>
      ) : null}
      <input name="redirectTo" type="hidden" value={redirectTo} />
      <input name="email" type="email" placeholder="Email" className="w-full rounded border p-2" required />
      <input name="password" type="password" placeholder="Password" className="w-full rounded border p-2" required />
      <button className="w-full rounded bg-black p-2 text-white" type="submit">Sign in</button>
      <p className="text-center text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link
          href={`/register${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`}
          className="font-medium text-black underline"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
