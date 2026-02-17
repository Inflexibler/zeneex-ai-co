'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';

export default function Home() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGetStarted = async () => {
    if (!email) {
      alert('Please enter your email');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        alert('Check your email for signup link');
        setEmail('');
      } else {
        alert('Something went wrong');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-700 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-500">ZENEX AI</div>
          <div className="flex gap-4">
            <a href="#features" className="text-slate-300 hover:text-white">Features</a>
            <a href="#pricing" className="text-slate-300 hover:text-white">Pricing</a>
            <Button variant="primary" size="sm">Sign In</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Generate Websites with AI
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Create production-ready websites in minutes using advanced AI technology
          </p>

          <div className="flex gap-4 justify-center mb-12">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="px-6 py-3 bg-slate-800 text-white rounded-lg border border-slate-700 focus:border-blue-500 focus:outline-none w-full max-w-sm"
            />
            <Button
              onClick={handleGetStarted}
              disabled={loading}
              variant="primary"
              size="lg"
            >
              {loading ? 'Loading...' : 'Get Started'}
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-12">Features</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'AI-Powered',
                description: 'Advanced AI models generate perfect code',
              },
              {
                title: 'Production Ready',
                description: 'Deploy immediately without modifications',
              },
              {
                title: 'Global Deployment',
                description: 'Automatic deployment to CDN worldwide',
              },
            ].map((feature, i) => (
              <div key={i} className="p-6 bg-slate-700 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-12">Pricing</h2>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { name: 'Free', price: '0', features: ['5 projects', '1 generation/day'] },
              { name: 'Starter', price: '29', features: ['50 projects', '10 generations/day'] },
              { name: 'Pro', price: '99', features: ['Unlimited projects', 'Unlimited generations'] },
              { name: 'Business', price: 'Custom', features: ['Everything', 'Priority support'] },
            ].map((plan, i) => (
              <div key={i} className="p-6 bg-slate-700 rounded-lg border border-slate-600">
                <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                <p className="text-3xl font-bold text-blue-500 mb-4">${plan.price}</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="text-slate-300">✓ {f}</li>
                  ))}
                </ul>
                <Button variant="primary" className="w-full">
                  Choose Plan
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-700 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-slate-400">
          <p>&copy; 2024 ZENEX AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
