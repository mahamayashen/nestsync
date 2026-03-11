export function AuthDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border-light" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="bg-surface px-4 text-text-secondary">or</span>
      </div>
    </div>
  );
}
