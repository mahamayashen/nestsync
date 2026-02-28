import Link from "next/link";
import { ArrowRight, Home } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="w-full max-w-2xl text-center space-y-8">
        
        {/* Hero Icon */}
        <div className="flex justify-center">
          <div className="bg-indigo-600 p-4 rounded-3xl shadow-lg ring-8 ring-indigo-50">
            <Home className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Headlines */}
        <div className="space-y-4 pt-4">
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
            Households without the headache.
          </h1>
          <p className="text-xl text-slate-600 max-w-xl mx-auto leading-relaxed">
            NestSync combines chore tracking, expense splitting, and democratic decisions into one lightweight app. No bosses. Just roommates.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Link
            href="/auth?mode=signup"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-sm active:scale-95"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/auth?mode=login"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all shadow-sm ring-1 ring-slate-200 active:scale-95"
          >
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}
