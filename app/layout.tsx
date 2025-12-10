import type { Metadata } from "next";
import { Inter, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/shared/components/navbar/Navbar";
import Footer from "@/shared/components/Footer/Footer";
const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
}); 

export const metadata: Metadata = {
  title: "Jet Prompt Optimizer",
  description: "Optimize your prompts with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${sourceSerif.variable} ${jetBrainsMono.variable} antialiased`}
      >
        <Navbar />
        {children}
        <Footer/>
      </body>
    </html>
  );
}
