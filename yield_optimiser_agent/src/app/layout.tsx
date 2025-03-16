import type { Metadata } from "next";
import "./globals.scss";


export const metadata: Metadata = {
  title: "AgenticAI",
  description: "Defi Agent to enable cross chain transfers, add liquidity and wahtnot",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="AppWrapper">
              <div className="AppContainer">
                <div style={{ display: "flex", flex: 1, overflow: "auto" }}>
                  {children}
                </div>
              </div>
            </div>
      </body>
    </html>
  );
}
