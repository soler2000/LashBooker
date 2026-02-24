"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export default function ChangePasswordPage() {
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  return (
    <form
      className="mx-auto mt-20 max-w-md space-y-4 rounded bg-white p-6 shadow"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const password = String(fd.get("password") ?? "");
        const confirmPassword = String(fd.get("confirmPassword") ?? "");

        if (password !== confirmPassword) {
          setIsError(true);
          setMessage("Passwords do not match.");
          return;
        }

        const res = await fetch("/api/auth/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });

        if (!res.ok) {
          setIsError(true);
          setMessage("Failed to update password.");
          return;
        }

        setIsError(false);
        setMessage("Password updated. Please sign in again.");
        await signOut({ callbackUrl: "/login" });
      }}
    >
      <h1 className="text-2xl font-semibold">Change your password</h1>
      <p className="text-sm text-slate-600">You must set a new password before continuing.</p>
      <input name="password" type="password" placeholder="New password" className="w-full rounded border p-2" required minLength={8} />
      <input name="confirmPassword" type="password" placeholder="Confirm new password" className="w-full rounded border p-2" required minLength={8} />
      <button className="w-full rounded bg-black p-2 text-white" type="submit">Update password</button>
      {message ? <p className={`text-sm ${isError ? "text-red-600" : "text-green-700"}`}>{message}</p> : null}
    </form>
  );
}
