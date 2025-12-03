import '../styles/globals.css';
import { ReactNode } from 'react';
import Link from 'next/link';

export const metadata = {
    title: 'Albion Online Tools',
    description: 'Professional Albion Online crafting, refining & flipping calculator'
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body className="min-h-screen">
                {/* Header */}
                <header className="bg-gray-900/80 backdrop-blur-lg border-b border-gray-800 sticky top-0 z-50">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <Link href="/" className="flex items-center space-x-3 group">
                                <div className="w-10 h-10 bg-gradient-to-br from-yellow-600 to-yellow-500 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
                                    <span className="text-gray-900 font-bold text-xl">A</span>
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-100">Albion Tools</h1>
                                    <p className="text-xs text-gray-400">Crafting • Refining • Flipping</p>
                                </div>
                            </Link>

                            {/* Navigation */}
                            <nav className="hidden md:flex space-x-1">
                                <NavLink href="/refining" label="Refining" icon="⚒️" />
                                <NavLink href="/crafting" label="Crafting" icon="🔨" />
                                <NavLink href="/flipping" label="Flipping" icon="💰" />
                                <NavLink href="/black-market" label="Black Market" icon="🏴‍☠️" />
                            </nav>

                            {/* Mobile Menu Button */}
                            <button className="md:hidden btn-secondary py-2 px-4">
                                Menu
                            </button>
                        </div>

                        {/* Mobile Navigation */}
                        <nav className="md:hidden mt-4 flex flex-col space-y-2">
                            <NavLink href="/refining" label="Refining" icon="⚒️" mobile />
                            <NavLink href="/crafting" label="Crafting" icon="🔨" mobile />
                            <NavLink href="/flipping" label="Flipping" icon="💰" mobile />
                            <NavLink href="/black-market" label="Black Market" icon="🏴‍☠️" mobile />
                        </nav>
                    </div>
                </header>

                {/* Main Content */}
                <main className="container mx-auto px-4 py-8">
                    {children}
                </main>

                {/* Footer */}
                <footer className="bg-gray-900/50 border-t border-gray-800 mt-16">
                    <div className="container mx-auto px-4 py-6">
                        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
                            <p>© 2024 Albion Tools. Data from Albion Online Data Project.</p>
                            <div className="flex space-x-4 mt-4 md:mt-0">
                                <a href="https://www.albion-online-data.com/" target="_blank" rel="noopener noreferrer"
                                    className="hover:text-yellow-500 transition-colors">
                                    Data API
                                </a>
                                <a href="https://albiononline.com" target="_blank" rel="noopener noreferrer"
                                    className="hover:text-yellow-500 transition-colors">
                                    Official Site
                                </a>
                            </div>
                        </div>
                    </div>
                </footer>
            </body>
        </html>
    );
}

function NavLink({ href, label, icon, mobile = false }: { href: string; label: string; icon: string; mobile?: boolean }) {
    const baseClasses = mobile
        ? "flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        : "flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors";

    return (
        <Link href={href} className={baseClasses}>
            <span>{icon}</span>
            <span className="font-medium">{label}</span>
        </Link>
    );
}
