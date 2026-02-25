import { Playfair_Display, Source_Sans_3 } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-playfair',
  display: 'swap',
});

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-source-sans',
  display: 'swap',
});

export const metadata = {
  title: 'Declaração de Aptidão Agrícola — ITBI Rural | Porto Velho/RO',
  description: 'Formulário de Declaração de Aptidão Agrícola para fins de apuração de ITBI sobre imóvel rural — Prefeitura Municipal de Porto Velho, Secretaria Municipal de Economia.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={`${playfair.variable} ${sourceSans.variable}`}>
        {children}
      </body>
    </html>
  );
}
