import './globals.css'; // Assuming Tailwind base styles are here
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Clinical Patient Portal',
  description: 'Securely view your clinical AI summaries',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 min-h-screen flex flex-col`}>
        {/* Simple Global Navbar */}
        <nav className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center text-blue-600 font-bold text-xl">
            🏥 ClinicAI Portal
          </div>
        </nav>
        
        {/* Main Content */}
        <main className="flex-grow">
          {children}
        </main>
      </body>
    </html>
  );
}