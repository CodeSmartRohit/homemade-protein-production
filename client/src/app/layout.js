import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Providers from "@/app/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata = {
  title: "HOMEMADE Protein | Fresh Organic Meals",
  description: "Fresh, healthy, high-protein meals delivered to your door.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${playfair.variable} font-sans bg-amber-950 text-amber-50 antialiased min-h-screen flex flex-col`}
      >
        <div className="fixed inset-0 pointer-events-none opacity-20 mix-blend-overlay bg-[url('/noise.png')] z-0"></div>
        <div className="relative z-10 flex-1 flex flex-col pt-24">
          <Providers>
            <Navbar />
            <main className="flex-1 w-full">
              {children}
            </main>
            <Footer />
          </Providers>
          <Toaster 
            position="top-right" 
            toastOptions={{
              className: '!bg-amber-900 !text-amber-50 !border !border-amber-800',
            }}
          />
        </div>
      </body>
    </html>
  );
}
