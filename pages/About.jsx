import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Users, Shield, Zap } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-stone-900 mb-2">About VendorCover</h1>
        <p className="text-lg text-stone-600">
          Connecting wedding and event vendors for last-minute coverage and support
        </p>
      </div>

      <Card className="border-stone-200">
        <CardContent className="p-8 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">Our Mission</h2>
            <p className="text-stone-600 leading-relaxed">
              VendorCover was created to solve a common problem in the wedding and events industry: finding reliable last-minute coverage when you need it most. Whether you're sick, double-booked, or need extra hands, VendorCover connects you with verified professional vendors ready to help.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-stone-900 mb-3">How It Works</h2>
            <p className="text-stone-600 leading-relaxed mb-4">
              Our platform makes it easy to post help requests and find coverage opportunities. Vendors create profiles showcasing their work and experience, which are reviewed by our team to ensure quality and professionalism. Once approved, you can browse available jobs, post requests, and connect directly with other vendors in your area.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 pt-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 mb-1">Verified Vendors</h3>
                <p className="text-sm text-stone-600">All profiles are reviewed and approved by our team</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 mb-1">Quick Response</h3>
                <p className="text-sm text-stone-600">Find coverage fast with instant notifications</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 mb-1">Community</h3>
                <p className="text-sm text-stone-600">Build relationships with other pros in your industry</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 mb-1">Support</h3>
                <p className="text-sm text-stone-600">Dedicated admin team ready to help</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t">
            <h2 className="text-xl font-semibold text-stone-900 mb-3">Contact Us</h2>
            <p className="text-stone-600 leading-relaxed">
              Have questions or feedback? We'd love to hear from you. Use the "Chat with Admins" feature in the app or email us at{' '}
              <a href="mailto:team@twofoldvisuals.com" className="text-blue-600 hover:underline">
                team@twofoldvisuals.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-stone-500 py-4">
        <p>© 2025 VendorCover. All rights reserved.</p>
      </div>
    </div>
  );
}