import type { Metadata } from "next";
import Script from "next/script";
import { clarityProjectId, ga4MeasurementId, siteName, siteUrl } from "./site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Label Print Alignment Tool",
    template: "%s | Label Print Alignment Tool"
  },
  description:
    "Fix labels not lining up before you waste sticker sheets. Generate a printable label alignment grid, diagnose sheet drift, and calculate safe printer offset checks.",
  robots: {
    index: true,
    follow: true
  },
  openGraph: {
    title: "Label Print Alignment Tool",
    description:
      "A browser-local calibration bench for label print alignment, offset nudges, row drift, clipped edges, and label-stock print checks.",
    url: siteUrl,
    siteName,
    type: "website"
  },
  twitter: {
    card: "summary",
    title: "Label Print Alignment Tool",
    description: "Print a label alignment grid and calculate the next print alignment test."
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {ga4MeasurementId ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4MeasurementId}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', '${ga4MeasurementId}', { anonymize_ip: true });
              `}
            </Script>
          </>
        ) : null}
        {clarityProjectId ? (
          <Script id="clarity-init" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${clarityProjectId}");
            `}
          </Script>
        ) : null}
        {children}
      </body>
    </html>
  );
}
