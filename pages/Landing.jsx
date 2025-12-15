import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Camera, Video, Music, Sparkles, Wine, Flower2,
  ArrowRight, CheckCircle2, Users, Calendar, Shield,
  MessageSquare, FileText, DollarSign, Download
} from 'lucide-react';

const serviceTypes = [
  { icon: Camera, label: 'Photographers' },
  { icon: Video, label: 'Videographers' },
  { icon: Music, label: 'DJs' },
  { icon: Sparkles, label: 'MUA & Hair' },
  { icon: Wine, label: 'Bartenders' },
  { icon: Flower2, label: 'Florists' }
];

const features = [
  {
    icon: Calendar,
    title: 'Last-Minute Coverage',
    description: 'Find qualified professionals quickly when you need backup for your events'
  },
  {
    icon: Users,
    title: 'Verified Vendors',
    description: 'Connect with experienced, reliable vendors in your area'
  },
  {
    icon: MessageSquare,
    title: 'Direct Communication',
    description: 'Chat directly with vendors and coordinate seamlessly'
  },
  {
    icon: FileText,
    title: 'Built-in Agreements',
    description: 'Generate subcontract agreements automatically for every job'
  },
  {
    icon: Shield,
    title: 'Reliability Tracking',
    description: 'Private reliability ratings help you find dependable help'
  },
  {
    icon: DollarSign,
    title: 'Transparent Pay',
    description: 'Clear payment terms upfront - know exactly what you\'ll earn'
  }
];

export default function Landing() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.deferredPrompt = e;
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleLogin = () => {
    base44.auth.redirectToLogin();
  };

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Show instructions for manual installation
      alert('To install this app:\n\niPhone/iPad: Tap the Share button and select "Add to Home Screen"\n\nAndroid: Tap the menu (3 dots) and select "Add to Home Screen" or "Install App"');
      return;
    }

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-stone-100 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">VC</span>
              </div>
              <span className="text-lg font-semibold text-stone-900">VendorCover</span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleInstall}
                variant="outline"
                size="sm"
                className="hidden sm:flex"
              >
                <Download className="w-4 h-4 mr-2" />
                Install App
              </Button>
              <Button onClick={handleLogin} className="bg-stone-900 hover:bg-stone-800">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 leading-tight">
            Find Last-Minute Coverage for Your Events
          </h1>
          <p className="mt-6 text-xl text-stone-600 max-w-2xl mx-auto">
            The trusted network for wedding and event vendors to find backup professionals, 
            second shooters, and extra help when they need it most.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md px-4">
              <Button 
                onClick={handleLogin}
                size="lg" 
                className="bg-stone-900 hover:bg-stone-800 text-lg px-8 w-full"
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                onClick={handleInstall}
                size="lg"
                variant="outline"
                className="text-lg px-8 w-full border-2"
              >
                <Download className="w-5 h-5 mr-2" />
                Install App
              </Button>
            </div>
            <button
              onClick={handleInstall}
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              📱 Install VendorCover on your device
            </button>
            <p className="text-sm text-stone-500">Free to join • No monthly fees</p>
          </div>
        </div>
      </section>

      {/* Service Types */}
      <section className="py-12 bg-stone-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-stone-500 uppercase tracking-wide mb-8">
            For all event professionals
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {serviceTypes.map((service, i) => (
              <div key={i} className="flex items-center gap-2 text-stone-700">
                <service.icon className="w-5 h-5 text-stone-400" />
                <span className="font-medium">{service.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-stone-900">How It Works</h2>
            <p className="mt-4 text-lg text-stone-600">Simple, fast, and reliable</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-stone-900 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto">
                1
              </div>
              <h3 className="mt-6 text-xl font-semibold text-stone-900">Create Your Profile</h3>
              <p className="mt-3 text-stone-600">
                Set up your vendor profile with your services, experience, location, and travel radius
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-stone-900 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto">
                2
              </div>
              <h3 className="mt-6 text-xl font-semibold text-stone-900">Post or Apply</h3>
              <p className="mt-3 text-stone-600">
                Post help requests for your events or browse and apply to available opportunities
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-stone-900 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto">
                3
              </div>
              <h3 className="mt-6 text-xl font-semibold text-stone-900">Connect & Confirm</h3>
              <p className="mt-3 text-stone-600">
                Chat directly, confirm the agreement, and show up ready to work
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-stone-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-stone-900">Everything You Need</h2>
            <p className="mt-4 text-lg text-stone-600">Built by event pros, for event pros</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="border-stone-200">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-stone-700" />
                  </div>
                  <h3 className="text-lg font-semibold text-stone-900">{feature.title}</h3>
                  <p className="mt-2 text-stone-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-stone-900">
            Ready to Join the Network?
          </h2>
          <p className="mt-4 text-lg text-stone-600">
            Join thousands of event vendors who trust VendorCover for reliable backup coverage
          </p>
          <Button 
            onClick={handleLogin}
            size="lg" 
            className="mt-8 bg-stone-900 hover:bg-stone-800 text-lg px-8"
          >
            Create Your Free Account
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-stone-200">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-stone-900 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">VC</span>
            </div>
            <span className="text-sm text-stone-600">© 2024 VendorCover</span>
          </div>
          <p className="text-sm text-stone-500">
            The marketplace for event vendor coverage
          </p>
        </div>
      </footer>
    </div>
  );
}