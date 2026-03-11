import Link from "next/link";
import {
  ArrowRight,
  House,
  ClipboardText,
  Scales,
  Megaphone,
} from "@phosphor-icons/react/dist/ssr";

const features = [
  {
    icon: ClipboardText,
    title: "Fair chore tracking",
    description:
      "Create, assign, and rotate chores. A points system keeps things balanced so nobody gets stuck with the dishes forever.",
    iconBg: "bg-primary-light",
    iconColor: "text-primary",
  },
  {
    icon: Scales,
    title: "Democratic decisions",
    description:
      "Put it to a vote. From picking a new couch to setting quiet hours, everyone gets a say in how the house runs.",
    iconBg: "bg-highlight-light",
    iconColor: "text-highlight",
  },
  {
    icon: Megaphone,
    title: "Stay in the loop",
    description:
      "Post announcements, share updates, and keep the whole house on the same page without endless group chats.",
    iconBg: "bg-accent-light",
    iconColor: "text-accent",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="min-h-[70vh] flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <span className="font-logo text-5xl text-primary">NestSync</span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-text-primary font-heading">
            Your household, finally in sync.
          </h1>

          <p className="text-lg sm:text-xl text-text-secondary max-w-xl mx-auto leading-relaxed">
            The lightweight app that helps roommates split chores, make
            decisions together, and keep everyone in the loop.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-text-on-primary rounded-xl font-semibold hover:bg-primary-hover transition-all shadow-sm active:scale-95"
            >
              <House weight="bold" className="w-5 h-5" />
              Create your household
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-4 text-primary font-semibold hover:text-primary-hover transition-colors"
            >
              Sign in
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-surface py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider text-center mb-2">
            How it works
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary font-heading text-center mb-10 sm:mb-12">
            Everything your household needs
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="text-center space-y-3">
                <div
                  className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center ${feature.iconBg}`}
                >
                  <feature.icon
                    weight="duotone"
                    className={`w-7 h-7 ${feature.iconColor}`}
                  />
                </div>
                <h3 className="text-lg font-bold text-text-primary font-heading">
                  {feature.title}
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 sm:py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary font-heading">
            Ready to get your house in order?
          </h2>
          <p className="text-text-secondary mt-3 mb-8">
            Free for up to 10 roommates. Set up in under a minute.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-text-on-primary rounded-xl font-semibold hover:bg-primary-hover transition-all shadow-sm active:scale-95"
          >
            Get started
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-12 text-xs text-text-muted">
            &copy; 2026 NestSync
          </p>
        </div>
      </section>
    </div>
  );
}
