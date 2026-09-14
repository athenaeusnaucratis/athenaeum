import { Cormorant_Garamond, DM_Mono, Jost } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["300", "400"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["200", "300", "400"],
});

export const viewport = {
  themeColor: "#111009",
}

export const metadata = {
  metadataBase: new URL("https://www.athenaeum-deipnon.com"),
  title: {
    default: "Athenaeum Deipnon — A Personal Cookbook Library",
    template: "%s · Athenaeum Deipnon",
  },
  description:
    "A curated cookbook library — browse 200+ cookbooks by author, chef, category, language, and collection. Rare, out-of-print, and international titles.",
  keywords: [
    "cookbook library",
    "cookbook catalog",
    "rare cookbooks",
    "vintage cookbooks",
    "cookbook collection",
    "chef biography",
    "Athenaeum Deipnon",
  ],
  authors: [{ name: "Athenaeum Deipnon" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Athenaeum Deipnon",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    url: "https://www.athenaeum-deipnon.com",
    siteName: "Athenaeum Deipnon",
    title: "Athenaeum Deipnon — A Personal Cookbook Library",
    description:
      "A curated cookbook library — browse cookbooks by author, chef, category, language, and collection.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Athenaeum Deipnon",
    description: "A curated cookbook library.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${dmMono.variable} ${jost.variable} h-full antialiased`}
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js') }`,
          }}
        />
      </body>
    </html>
  );
}
