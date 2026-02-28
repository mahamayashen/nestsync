"use client";

import { useSearchParams } from "next/navigation";
import { login, signup } from "./actions";
import { useState, Suspense } from "react";
import { Home, Loader2 } from "lucide-react";
import Link from "next/link";

function AuthForm() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const errorMessage = searchParams.get("error");
  
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [pending, setPending] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl ring-1 ring-slate-200 p-8">
        <div className="flex flex-col items-center mb-8">
          <Link href="/">
            <div className="bg-indigo-600 p-3 rounded-2xl mb-4 hover:scale-105 transition-transform">
              <Home className="w-8 h-8 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            {mode === "login" ? "Welcome back" : "Create an account"}
          </h1>
          <p className="text-slate-500 mt-2 text-sm text-center">
            {mode === "login" 
              ? "Sign in to manage your household." 
              : "Sign up to create or join a household."}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
            {errorMessage}
          </div>
        )}

        <form 
          className="space-y-4"
          action={(formData) => {
            setPending(true);
            if (mode === "login") {
              login(formData);
            } else {
              signup(formData);
            }
          }}
        >
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="you@example.com"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full flex justify-center items-center py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 mt-6"
          >
            {pending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : mode === "login" ? (
              "Sign In"
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <button onClick={() => setMode("signup")} className="font-semibold text-indigo-600 hover:underline">
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button onClick={() => setMode("login")} className="font-semibold text-indigo-600 hover:underline">
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
