"use client";

import Link from "next/link";

export default function InvalidAffiliatePage() {
  return (
    <main className="min-h-screen bg-soft-white px-4 py-16">
      <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-red-700">Invalid Affiliate Link</h1>
        <p className="mt-3 text-sm text-gray-700">
          This referral link is invalid or expired. Please contact support or ask for a valid affiliate link.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex rounded-md bg-jet-blue px-4 py-2 text-sm font-semibold text-white hover:bg-jet-blue/90"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
