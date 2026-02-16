import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">Z</span>
              </div>
              <span className="text-xl font-bold text-neutral-900">ZENEX AI</span>
            </Link>
            <p className="text-sm text-neutral-600 mb-4">
              Build amazing websites with the power of AI. No coding required.
            </p>
            <div className="flex gap-4">
              {[
                { name: "Twitter", href: "#", icon: "𝕏" },
                { name: "GitHub", href: "#", icon: "🐙" },
                { name: "Discord", href: "#", icon: "💬" },
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="text-neutral-600 hover:text-primary transition-colors"
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              {[
                { name: "Features", href: "#features" },
                { name: "Pricing", href: "#pricing" },
                { name: "Templates", href: "#" },
                { name: "Integrations", href: "#" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-600 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {[
                { name: "About", href: "/about" },
                { name: "Blog", href: "/blog" },
                { name: "Careers", href: "/careers" },
                { name: "Contact", href: "/contact" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-600 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              {[
                { name: "Privacy Policy", href: "/privacy" },
                { name: "Terms of Service", href: "/terms" },
                { name: "Cookie Policy", href: "/cookies" },
                { name: "GDPR", href: "/gdpr" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-neutral-600 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-neutral-200">
          <p className="text-sm text-neutral-600 text-center">
            © {new Date().getFullYear()} ZENEX AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
