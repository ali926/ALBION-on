"use client";

import { useState, useEffect } from 'react';
import Card from '../../components/Card';
import { fetchItemPrices } from '../../lib/market';
import { City, Item } from '../../lib/types';
import { getAllBlackMarketItems } from '../../lib/item-generator';

const CITIES = Object.values(City).filter(c => c !== City.BLACK_MARKET);
const TIERS = [3, 4, 5, 6, 7, 8];
const ENCHANTMENTS = [0, 1, 2, 3, 4];

interface FlipOpportunity {
    item: Item;
    buyCity: string;
    sellCity: string;
    buyPrice: number;
    sellPrice: number;
    profit: number;
    margin: number;
    volume: number;
}

export default function FlippingPage() {
    // Filters
    const [tierFilter, setTierFilter] = useState<number | 'All'>('All');
    const [enchantFilter, setEnchantFilter] = useState<number | 'All'>('All');
    const [buyCityFilter, setBuyCityFilter] = useState<string>('All');
    const [sellCityFilter, setSellCityFilter] = useState<string>('All');
    const [minMargin, setMinMargin] = useState<number>(10);
    const [minProfit, setMinProfit] = useState<number>(1000);

    // Search
    const [searchTerm, setSearchTerm] = useState('');

    // Data
    const [opportunities, setOpportunities] = useState<FlipOpportunity[]>([]);
    const [loading, setLoading] = useState(false);
    const [isPremium, setIsPremium] = useState(false);

    // Scan for opportunities
    const handleScan = async () => {
        setLoading(true);
        try {
            const items = getAllBlackMarketItems();
            const filteredItems = items.filter(item => {
                if (tierFilter !== 'All' && item.tier !== tierFilter) return false;
                if (enchantFilter !== 'All' && item.enchantment !== enchantFilter) return false;
                if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                return true;
            }).slice(0, 20); // Limit to 20 items for performance

            const opportunities: FlipOpportunity[] = [];

            for (const item of filteredItems) {
                const prices = await fetchItemPrices(item.id, CITIES);

                // Find best buy and sell prices
                for (const buyPrice of prices) {
                    for (const sellPrice of prices) {
                        if (buyPrice.city === sellPrice.city) continue;
                        if (buyCityFilter !== 'All' && buyPrice.city !== buyCityFilter) continue;
                        if (sellCityFilter !== 'All' && sellPrice.city !== sellCityFilter) continue;

                        const buy = buyPrice.sellPriceMin || 0;
                        const sell = sellPrice.sellPriceMin || 0;

                        if (buy === 0 || sell === 0) continue;

                        // Calculate profit with taxes
                        const salesTax = sell * (isPremium ? 0.04 : 0.08);
                        const setupFee = sell * 0.025;
                        const netSell = sell - salesTax - setupFee;
                        const profit = netSell - buy;
                        const margin = (profit / buy) * 100;

                        if (margin >= minMargin && profit >= minProfit) {
                            opportunities.push({
                                item,
                                buyCity: buyPrice.city,
                                sellCity: sellPrice.city,
                                buyPrice: buy,
                                sellPrice: netSell,
                                profit,
                                margin,
                                volume: 0 // Would need real volume data
                            });
                        }
                    }
                }
            }

            // Sort by profit descending
            opportunities.sort((a, b) => b.profit - a.profit);
            setOpportunities(opportunities.slice(0, 50));

        } catch (error) {
            console.error('Scan failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto slide-in pb-12">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                    <span className="text-gold">💰</span>
                    <span className="bg-gradient-to-r from-gold via-yellow-400 to-gold bg-clip-text text-transparent">
                        Market Arbitrage Scanner
                    </span>
                </h1>
                <p className="text-gray-400">
                    Find the best cross-city flipping opportunities with real-time market data
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Filters Panel */}
                <Card>
                    <h2 className="text-xl font-bold mb-4 text-gold flex items-center gap-2">
                        🔍 Scanner Filters
                    </h2>

                    <div className="space-y-4">
                        {/* Search */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                                ⚔️ Item Search
                            </label>
                            <input
                                type="text"
                                placeholder="Search items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="forged-input"
                            />
                        </div>

                        {/* Tier & Enchantment */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Tier</label>
                                <select
                                    value={tierFilter}
                                    onChange={(e) => setTierFilter(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                                    className="select-field text-sm"
                                >
                                    <option value="All">All</option>
                                    {TIERS.map(t => <option key={t} value={t}>T{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Enchant</label>
                                <select
                                    value={enchantFilter}
                                    onChange={(e) => setEnchantFilter(e.target.value === 'All' ? 'All' : Number(e.target.value))}
                                    className="select-field text-sm"
                                >
                                    <option value="All">All</option>
                                    {ENCHANTMENTS.map(e => <option key={e} value={e}>{e === 0 ? 'Flat' : `.${e}`}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Buy/Sell Cities */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Buy From</label>
                                <select
                                    value={buyCityFilter}
                                    onChange={(e) => setBuyCityFilter(e.target.value)}
                                    className="select-field text-sm"
                                >
                                    <option value="All">Any City</option>
                                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Sell To</label>
                                <select
                                    value={sellCityFilter}
                                    onChange={(e) => setSellCityFilter(e.target.value)}
                                    className="select-field text-sm"
                                >
                                    <option value="All">Any City</option>
                                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Profit Thresholds */}
                        <div className="forged-panel p-4">
                            <h3 className="text-sm font-bold text-gold mb-3 flex items-center gap-2">
                                💎 Profit Filters
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Min Margin %</label>
                                    <input
                                        type="number"
                                        value={minMargin}
                                        onChange={(e) => setMinMargin(Number(e.target.value))}
                                        className="input-field text-sm"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Min Profit 🪙</label>
                                    <input
                                        type="number"
                                        value={minProfit}
                                        onChange={(e) => setMinProfit(Number(e.target.value))}
                                        className="input-field text-sm"
                                        min="0"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Premium Toggle */}
                        <div className="flex items-center justify-between bg-gradient-to-r from-yellow-900/20 to-transparent p-3 rounded-lg border border-yellow-800/30">
                            <div>
                                <span className="text-sm font-bold text-yellow-400 flex items-center gap-2">
                                    👑 Premium
                                </span>
                                <span className="text-xs text-gray-500">-50% tax</span>
                            </div>
                            <div
                                className={`arcane-switch ${isPremium ? 'active' : ''}`}
                                onClick={() => setIsPremium(!isPremium)}
                            >
                                <div className="arcane-switch-thumb" />
                            </div>
                        </div>

                        {/* Scan Button */}
                        <button
                            onClick={handleScan}
                            disabled={loading}
                            className="forged-button w-full"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="loading-spinner"></span>
                                    Scanning Markets...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    🔍 Scan for Opportunities
                                </span>
                            )}
                        </button>
                    </div>
                </Card>

                {/* Opportunities List */}
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <h2 className="text-xl font-bold mb-4 text-gold flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                📊 Best Deals
                            </span>
                            <span className="text-sm text-gray-400 font-normal">
                                {opportunities.length} opportunities
                            </span>
                        </h2>

                        {opportunities.length > 0 ? (
                            <div className="space-y-3">
                                {opportunities.map((opp, idx) => (
                                    <div
                                        key={idx}
                                        className={`forged-panel ${opp.margin > 20 ? 'profit-glow' : ''} p-4 hover:scale-[1.02] transition-transform cursor-pointer`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="text-lg font-bold text-gold">{opp.item.name}</div>
                                                <div className="text-xs text-gray-500">ID: {opp.item.id}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold numeric text-gold profit-flicker">
                                                    +{opp.profit.toLocaleString()} 🪙
                                                </div>
                                                <div className={`text-sm font-bold ${opp.margin > 20 ? 'text-green-400' : 'text-yellow-400'}`}>
                                                    {opp.margin.toFixed(1)}% margin
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="bg-red-900/20 p-2 rounded border border-red-800/50">
                                                <div className="text-xs text-red-400 mb-1">Buy from {opp.buyCity}</div>
                                                <div className="text-lg font-bold numeric text-white">
                                                    {opp.buyPrice.toLocaleString()} 🪙
                                                </div>
                                            </div>
                                            <div className="bg-green-900/20 p-2 rounded border border-green-800/50">
                                                <div className="text-xs text-green-400 mb-1">Sell to {opp.sellCity}</div>
                                                <div className="text-lg font-bold numeric text-white">
                                                    {opp.sellPrice.toLocaleString()} 🪙
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <div className="text-6xl mb-4">🔍</div>
                                <p className="text-lg font-medium mb-2">No Opportunities Found</p>
                                <p className="text-sm">Adjust your filters and click "Scan for Opportunities"</p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
