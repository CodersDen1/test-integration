import type { Metadata, Viewport } from "next";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ayla, under the moonlight",
  description: "A little universe, made just for you. A moonlit letter to Ayla.",
  robots: { index: false, follow: false },
  icons: { icon: "/moon.svg" },
};
export const viewport: Viewport = {
  width: "device-width", initialScale: 1, themeColor: "#100e1c", colorScheme: "dark",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Extensions may inject body attributes (for example cz-shortcut-listen).
  // Suppression is shallow: application descendants still receive hydration checks.
  return <html lang="en"><body suppressHydrationWarning>{children}</body></html>;
}
