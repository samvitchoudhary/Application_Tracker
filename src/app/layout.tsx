import type { Metadata } from "next";
import { Hanken_Grotesk, Rubik } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Job Tracker",
  description: "Track job applications in one place",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${rubik.variable} ${hankenGrotesk.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
