"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [message, setMessage] = useState("");

  return (
    <form
      className="mx-auto mt-20 max-w-md space-y-4 rounded bg-white p-6 shadow"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(Object.fromEntries(fd.entries())),
        });
        setMessage(res.ok ? "Registered. You can sign in now." : "Registration failed");
      }}
    >
      <h1 className="text-2xl font-semibold">Create account</h1>
      <input name="firstName" placeholder="First name" className="w-full rounded border p-2" required />
      <input name="lastName" placeholder="Last name" className="w-full rounded border p-2" required />
      <input name="email" type="email" placeholder="Email" className="w-full rounded border p-2" required />
      <input name="password" type="password" placeholder="Password" className="w-full rounded border p-2" required minLength={8} />
      <button className="w-full rounded bg-black p-2 text-white" type="submit">Register</button>
      {message ? <p className="text-sm">{message}</p> : null}
    </form>
  );
}
