import "./globals.css";

export const metadata = {
  title: "LocalLens - Neighborhood Intelligence Platform",
  description: "Get data-driven insights into local neighborhoods. Explore rent trends, crime rates, business openings, and community events all in one place.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="business">
      <body className="antialiased">{children}</body>
    </html>
  );
}

