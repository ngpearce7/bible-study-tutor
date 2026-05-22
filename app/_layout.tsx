import { ConvexAuthProvider, type TokenStorage } from "@convex-dev/auth/react";
import * as SecureStore from "expo-secure-store";
import { ConvexReactClient } from "convex/react";
import { Stack } from "expo-router";
import Head from "expo-router/head";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";

const SITE_TITLE = "Bible Study Tutor | Free Bible Study App and Printable Worksheets";
const SITE_DESCRIPTION =
  "A free Bible study app for desktop and mobile with Scripture reading, guided Bible study methods, printable worksheets, journaling, memory verses, highlights, and simple church check-ins.";
const siteUrl = (process.env.EXPO_PUBLIC_SITE_URL || "").replace(/\/$/, "");
const siteImage = siteUrl ? `${siteUrl}/icon.png` : undefined;
const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Bible Study Tutor",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web, iOS, Android",
    description: SITE_DESCRIPTION,
    url: siteUrl || undefined,
    image: siteImage,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "AUD"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Bible Study Tutor",
    url: siteUrl || undefined,
    description: SITE_DESCRIPTION
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Bible Study Tutor",
    url: siteUrl || undefined,
    logo: siteImage
  }
].map((item) => Object.fromEntries(Object.entries(item).filter(([, value]) => value !== undefined)));

function resolveConvexUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_CONVEX_URL || "https://example.convex.cloud";

  if (Platform.OS !== "web" || typeof window === "undefined") return configuredUrl;

  try {
    const url = new URL(configuredUrl);
    const appHost = window.location.hostname;
    const isLocalConvexHost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    const isLocalAppHost = appHost === "localhost" || appHost === "127.0.0.1";

    if (isLocalConvexHost && isLocalAppHost) {
      url.hostname = appHost;
      return url.toString().replace(/\/$/, "");
    }
  } catch {
    return configuredUrl;
  }

  return configuredUrl;
}

const convexUrl = resolveConvexUrl();
const convex = new ConvexReactClient(convexUrl, {
  unsavedChangesWarning: false
});

const authStorage: TokenStorage = {
  getItem: (key) => (Platform.OS === "web" && typeof localStorage !== "undefined" ? localStorage.getItem(key) : SecureStore.getItemAsync(key)),
  setItem: (key, value) => {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      localStorage.setItem(key, value);
      return;
    }

    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key) => {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      localStorage.removeItem(key);
      return;
    }

    return SecureStore.deleteItemAsync(key);
  }
};

export default function RootLayout() {
  return (
    <ConvexAuthProvider client={convex} storage={authStorage} storageNamespace="bible-study-tutor-auth">
      <Head>
        <title>{SITE_TITLE}</title>
        <meta name="description" content={SITE_DESCRIPTION} />
        <meta name="keywords" content="free Bible study app, printable Bible study worksheets, Bible study methods, Scripture journal, memory verses, Bible study tutor, church Bible study" />
        <meta name="robots" content="index, follow" />
        <meta name="application-name" content="Bible Study Tutor" />
        <meta name="apple-mobile-web-app-title" content="Bible Study Tutor" />
        <meta name="theme-color" content="#F6F1E8" />
        <meta property="og:site_name" content="Bible Study Tutor" />
        <meta property="og:locale" content="en_AU" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={SITE_TITLE} />
        <meta property="og:description" content={SITE_DESCRIPTION} />
        {siteUrl ? <meta property="og:url" content={siteUrl} /> : null}
        {siteImage ? <meta property="og:image" content={siteImage} /> : null}
        {siteImage ? <meta property="og:image:alt" content="Bible Study Tutor app icon" /> : null}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={SITE_TITLE} />
        <meta name="twitter:description" content={SITE_DESCRIPTION} />
        {siteImage ? <meta name="twitter:image" content={siteImage} /> : null}
        {siteUrl ? <link rel="canonical" href={siteUrl} /> : null}
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="preload" href="/ionicons.ttf" as="font" type="font/ttf" crossOrigin="" />
        <style>{'@font-face{font-family:"ionicons";src:url("/ionicons.ttf") format("truetype");font-display:block;}'}</style>
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Head>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </ConvexAuthProvider>
  );
}
