"use client";

import Script from "next/script";

/** Single global Google Ads tag (gtag.js) — load once for all routes (home, chat, signup success, etc.) */
export default function GoogleAdsTag() {
  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=AW-17996021173"
        strategy="afterInteractive"
      />
      <Script id="google-ads-gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-17996021173');
        `}
      </Script>
    </>
  );
}
