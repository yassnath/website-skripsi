import PluginInit from "@/helper/PluginInit";
import "./font.css";
import "./globals.css";

export const metadata = {
  title: "Dashboard Web | CV ANT",
  description: "This is a dashboard website of CV ANT.",
};

export default function RootLayout({ children }) {
  return (
    <html data-scroll-behavior="smooth">
      <body suppressHydrationWarning={true}>
        <PluginInit />
        {children}
      </body>
    </html>
  );
}
