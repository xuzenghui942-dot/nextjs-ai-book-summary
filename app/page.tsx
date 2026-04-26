import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">B</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                BookWise
              </span>
            </Link>
            <div className="flex items-center space-x-6">
              <Link
                href="/login"
                className="text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/admin/login"
                className="text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors text-sm"
              >
                Admin Sign In
              </Link>
              <ThemeToggle />
              <Link
                href="/register"
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
        <div className="container mx-auto px-4 text-center max-w-5xl">
          <div className="inline-block mb-6 px-4 py-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-semibold shadow-sm">
            📚 Over 1000+ Book Summaries Available
          </div>
          <h1 className="text-6xl md:text-7xl font-extrabold text-slate-900 dark:text-white mb-8 leading-tight tracking-tight">
            Learn from the best books in
            <br />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
              just 15 minutes
            </span>
          </h1>
          <p className="text-2xl text-slate-600 dark:text-slate-400 mb-12 leading-relaxed max-w-3xl mx-auto">
            Get key insights from bestselling books. Read or listen anytime,
            anywhere.
          </p>
          <div className="flex gap-4 justify-center mb-16">
            <Link
              href="/register"
              className="px-10 py-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-lg rounded-xl font-bold shadow-2xl hover:shadow-emerald-500/50 transform hover:scale-105 transition-all"
            >
              Start Free Today
            </Link>
            <Link
              href="/books"
              className="px-10 py-5 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-lg rounded-xl font-bold hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              Browse Library
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-12 max-w-3xl mx-auto pt-12 border-t-2 border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400">1000+</div>
              <div className="text-slate-600 dark:text-slate-400 font-medium">Summaries</div>
            </div>
            <div>
              <div className="text-4xl font-black text-teal-600 dark:text-teal-400">15min</div>
              <div className="text-slate-600 dark:text-slate-400 font-medium">Per Book</div>
            </div>
            <div>
              <div className="text-4xl font-black text-amber-500 dark:text-amber-400">20+</div>
              <div className="text-slate-600 dark:text-slate-400 font-medium">Categories</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
              Why Choose BookWise?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Everything you need to accelerate your learning journey
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
            {[
              {
                icon: "📖",
                title: "Expert Summaries",
                desc: "Professional summaries capturing key insights from each book",
                color: "indigo",
              },
              {
                icon: "🎧",
                title: "Audio Narration",
                desc: "Listen on-the-go with high-quality AI-powered audio",
                color: "purple",
              },
              {
                icon: "⚡",
                title: "Save Hours",
                desc: "Learn in 15 minutes what takes hours to read",
                color: "pink",
              },
              {
                icon: "💡",
                title: "Key Insights",
                desc: "Actionable takeaways highlighted for quick reference",
                color: "indigo",
              },
              {
                icon: "📱",
                title: "Any Device",
                desc: "Seamless experience across web, mobile, and tablet",
                color: "purple",
              },
              {
                icon: "⭐",
                title: "Best Selection",
                desc: "Curated collection of top-rated bestsellers",
                color: "pink",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-8 rounded-2xl border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-200 dark:hover:border-emerald-700 hover:shadow-xl transition-all duration-300"
              >
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 rounded-2xl flex items-center justify-center mb-6 text-3xl">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 tracking-tight">
            Start Learning Today
          </h2>
          <p className="text-2xl text-emerald-100 mb-12 max-w-2xl mx-auto">
            Join thousands growing their knowledge daily
          </p>
          <Link
            href="/register"
            className="inline-block px-12 py-6 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 text-xl rounded-xl font-bold shadow-2xl hover:shadow-white/30 transform hover:scale-105 transition-all"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">B</span>
            </div>
            <span className="text-2xl font-bold text-white">BookWise</span>
          </div>
          <p className="mb-8 text-lg">
            Learn from the world's best books in just 15 minutes.
          </p>
          <p className="text-sm">&copy; 2024 BookWise. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
