"use client";

import Script from "next/script";

/** Single global Google tag (gtag.js) — loads once for all routes (home, chat, signup success, etc.) */
export default function GoogleAdsTag() {
  return (
    <>
      {/* Load gtag with GA4 ID (also used by Ads) */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-67LQK88473"
        strategy="afterInteractive"
      />
      <Script id="google-gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          // Google Ads conversion tag
          gtag('config', 'AW-17996021173');
          // Google Analytics 4 measurement ID
          gtag('config', 'G-67LQK88473');
        `}
      </Script>
    </>
  );
}
