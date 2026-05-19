import { Inter } from "next/font/google";
import "./globals.css";
import PageLayout from "@/components/PageLayout";
import { AuthProvider } from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Finance & Performance Management - CV Clicco Niroga",
  description: "Advanced financial and monitoring system for multi-channel e-commerce.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} text-white antialiased bg-[#0B0F19]`}>
        <AuthProvider>
          <PageLayout>
            {children}
          </PageLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
