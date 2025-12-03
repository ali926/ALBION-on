export default function HomePage() {
    return (
        <div className="max-w-4xl mx-auto slide-in">
            <div className="text-center mb-12">
                <h1 className="text-5xl font-bold mb-4 text-gold">
                    Welcome to Albion Tools
                </h1>
                <p className="text-xl text-gray-400">
                    Professional calculators for refining, crafting, and market flipping
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Refining Card */}
                <a href="/refining" className="glass-card p-6 hover:scale-105 transform transition-all duration-200 block">
                    <div className="text-5xl mb-4">⚒️</div>
                    <h2 className="text-2xl font-bold mb-2 text-gray-100">Refining</h2>
                    <p className="text-sm text-gray-400">
                        Calculate refining costs with return rates and nutrition bonuses
                    </p>
                </a>

                {/* Crafting Card */}
                <a href="/crafting" className="glass-card p-6 hover:scale-105 transform transition-all duration-200 block">
                    <div className="text-5xl mb-4">🔨</div>
                    <h2 className="text-2xl font-bold mb-2 text-gray-100">Crafting</h2>
                    <p className="text-sm text-gray-400">
                        Analyze crafting profitability with live market prices
                    </p>
                </a>

                {/* Flipping Card */}
                <a href="/flipping" className="glass-card p-6 hover:scale-105 transform transition-all duration-200 block">
                    <div className="text-5xl mb-4">💰</div>
                    <h2 className="text-2xl font-bold mb-2 text-gray-100">Flipping</h2>
                    <p className="text-sm text-gray-400">
                        Find profitable buy/sell opportunities across cities
                    </p>
                </a>

                {/* Black Market Card */}
                <a href="/black-market" className="glass-card p-6 hover:scale-105 transform transition-all duration-200 block border-2 border-red-900/50">
                    <div className="text-5xl mb-4">🏴‍☠️</div>
                    <h2 className="text-2xl font-bold mb-2 text-gray-100">Black Market</h2>
                    <p className="text-sm text-gray-400">
                        Calculate profits from selling to the Black Market
                    </p>
                </a>
            </div>

            <div className="mt-16 glass-card p-8">
                <h3 className="text-2xl font-bold mb-4 text-gray-100">Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                    <div className="flex items-start space-x-3">
                        <span className="text-green-400">✓</span>
                        <span>Live market prices from Albion Data Project</span>
                    </div>
                    <div className="flex items-start space-x-3">
                        <span className="text-green-400">✓</span>
                        <span>Accurate tax calculations based on game formulas</span>
                    </div>
                    <div className="flex items-start space-x-3">
                        <span className="text-green-400">✓</span>
                        <span>Return rate and nutrition factor support</span>
                    </div>
                    <div className="flex items-start space-x-3">
                        <span className="text-green-400">✓</span>
                        <span>Cross-city arbitrage analysis</span>
                    </div>
                    <div className="flex items-start space-x-3">
                        <span className="text-green-400">✓</span>
                        <span>Profit margins with marketplace tax included</span>
                    </div>
                    <div className="flex items-start space-x-3">
                        <span className="text-green-400">✓</span>
                        <span>Fast and lightweight design</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
