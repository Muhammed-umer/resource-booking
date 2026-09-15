"use client";

import { useActionState, useState } from "react";

import { loginAction } from "@/app/actions/auth";

/** DEV ONLY — an account the panel below can fill into the form. Remove before release. */
export type DevAccount = { email: string; label: string; password: string };

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/30";

export function SignInForm({ devAccounts = [] }: { devAccounts?: DevAccount[] }) {
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="flex w-full max-w-sm flex-col gap-5">
      <form
        action={formAction}
        className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-7 shadow-lg"
      >
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            placeholder="you@gmail.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
          />
        </div>

        {state && !state.ok && (
          <p
            role="alert"
            className="rounded-lg bg-error-light px-3 py-2 text-sm text-error-dark"
          >
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mt-1 rounded-lg bg-primary py-2.5 font-semibold text-white shadow-md transition-transform hover:bg-primary-dark active:scale-[0.98] disabled:opacity-60"
        >
          {isPending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {/* DEV ONLY — remove before release. Rendered only when the page passes accounts. */}
      {devAccounts.length > 0 && (
        <div className="rounded-2xl border border-dashed border-pending bg-pending-light/40 p-4 text-sm">
          <p className="mb-2 font-semibold text-gray-700">
            Dev accounts <span className="font-normal text-gray-500">— click to fill</span>
          </p>
          <ul className="flex flex-col gap-1">
            {devAccounts.map((account) => (
              <li key={account.email}>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword(account.password);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1 text-left hover:bg-white"
                >
                  <span className="min-w-0">
                    <code className="text-gray-800">{account.email}</code>
                    <span className="ml-2 text-gray-500">{account.label}</span>
                  </span>
                  <code className="shrink-0 text-gray-500">{account.password}</code>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
