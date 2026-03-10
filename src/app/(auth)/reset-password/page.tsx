import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">
            Set new password
          </h1>
          <p className="text-slate-500">
            Enter your new password below
          </p>
        </div>

        <ResetPasswordForm />
      </div>
    </div>
  );
}
