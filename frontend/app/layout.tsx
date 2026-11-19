import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export const metadata: Metadata = {
  title: "DeepDTA | Drug-Target Binding Affinity Prediction",
  description:
    "Predict drug-protein binding affinity (pKd / Kd) using a dual-branch CNN trained on the Davis kinase inhibitor dataset. Built with PyTorch and RDKit.",
  keywords: ["DeepDTA", "drug-target affinity", "binding affinity", "SMILES", "bioinformatics", "PyTorch", "RDKit"],
  authors: [{ name: "Team G1542" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="flex h-screen overflow-hidden bg-background text-fg antialiased">
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-6xl px-6 py-6 pb-16">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
