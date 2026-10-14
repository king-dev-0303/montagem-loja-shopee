import type { Metadata } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/shell";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vitrine Pronta - montagem da loja Shopee",
  description: "Painel de montagem de loja na Shopee: perfil, envio, catálogo com preços e tarifas, estúdio de fotos, importação por planilha e decoração da vitrine.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${jakarta.variable} ${bricolage.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <TooltipProvider>
          <Shell>{children}</Shell>
          <Toaster position="bottom-right" theme="light" richColors closeButton />
        </TooltipProvider>
      </body>
    </html>
  );
}
