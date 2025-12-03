"use client";

import { FlipFilters } from '../lib/types';
import { City } from '../lib/types';

interface FilterPanelProps {
    filters: FlipFilters;
    onChange: (filters: FlipFilters) => void;
}

const CITIES = [
    City.CAERLEON,
    City.BRIDGEWATCH,
    City.LYMHURST,
    City.MARTLOCK,
    City.FORT_STERLING,
    City.THETFORD,
    City.BLACK_MARKET
];

const TIERS = [4, 5, 6, 7, 8];
const ENCHANTMENTS = [0, 1, 2, 3, 4];

export default function FilterPanel({ filters, onChange }: FilterPanelProps) {
    const updateFilter = (key: keyof FlipFilters, value: any) => {
        onChange({ ...filters, [key]: value });
    };

    const toggleArrayItem = (key: keyof FlipFilters, item: any) => {
        const array = filters[key] as any[];
        const newArray = array.includes(item)
            ? array.filter(i => i !== item)
            : [...array, item];
        updateFilter(key, newArray);
    };

    return (
        <div className="space-y-6">
            {/* Location Filters */}
            <div>
                <h3 className="text-sm font-bold text-gray-300 mb-3">Buy Locations</h3>
                <div className="space-y-2">
                    {CITIES.filter(c => c !== City.BLACK_MARKET).map(city => (
                        <label key={city} className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={filters.buyLocations.includes(city)}
                                onChange={() => toggleArrayItem('buyLocations', city)}
                                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-300">{city}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Tier Filter */}
            <div>
                <h3 className="text-sm font-bold text-gray-300 mb-3">Tiers</h3>
                <div className="flex flex-wrap gap-2">
                    {TIERS.map(tier => (
                        <button
                            key={tier}
                            onClick={() => toggleArrayItem('tiers', tier)}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${filters.tiers.includes(tier)
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            T{tier}
                        </button>
                    ))}
                </div>
            </div>

            {/* Enchantment Filter */}
            <div>
                <h3 className="text-sm font-bold text-gray-300 mb-3">Enchantments</h3>
                <div className="flex flex-wrap gap-2">
                    {ENCHANTMENTS.map(enchant => (
                        <button
                            key={enchant}
                            onClick={() => toggleArrayItem('enchantments', enchant)}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${filters.enchantments.includes(enchant)
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            .{enchant}
                        </button>
                    ))}
                </div>
            </div>

            {/* Profit Filters */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-300">Profit Filters</h3>

                <div>
                    <label className="text-xs text-gray-400 block mb-1">
                        Min Profit: {filters.minProfit.toLocaleString()} 🪙
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="1000000"
                        step="10000"
                        value={filters.minProfit}
                        onChange={(e) => updateFilter('minProfit', Number(e.target.value))}
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="text-xs text-gray-400 block mb-1">
                        Min Margin: {filters.minMargin.toFixed(1)}%
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={filters.minMargin}
                        onChange={(e) => updateFilter('minMargin', Number(e.target.value))}
                        className="w-full"
                    />
                </div>

                <div>
                    <label className="text-xs text-gray-400 block mb-1">
                        Max Investment: {filters.maxInvestment === 999999999 ? 'Unlimited' : filters.maxInvestment.toLocaleString() + ' 🪙'}
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="10000000"
                        step="100000"
                        value={filters.maxInvestment === 999999999 ? 10000000 : filters.maxInvestment}
                        onChange={(e) => {
                            const val = Number(e.target.value);
                            updateFilter('maxInvestment', val === 10000000 ? 999999999 : val);
                        }}
                        className="w-full"
                    />
                </div>
            </div>

            {/* Order Age Filters */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-300">Order Freshness</h3>

                <div>
                    <label className="text-xs text-gray-400 block mb-1">
                        Max Buy Order Age: {filters.maxBuyAge} min
                    </label>
                    <input
                        type="range"
                        min="5"
                        max="180"
                        step="5"
                        value={filters.maxBuyAge}
                        onChange={(e) => updateFilter('maxBuyAge', Number(e.target.value))}
                        className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        {filters.maxBuyAge <= 15 ? '🟢 Fresh' : filters.maxBuyAge <= 30 ? '🟡 Moderate' : '🔴 Stale'}
                    </p>
                </div>

                <div>
                    <label className="text-xs text-gray-400 block mb-1">
                        Max Sell Order Age: {filters.maxSellAge} min
                    </label>
                    <input
                        type="range"
                        min="5"
                        max="45"
                        step="5"
                        value={filters.maxSellAge}
                        onChange={(e) => updateFilter('maxSellAge', Number(e.target.value))}
                        className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        {filters.maxSellAge <= 15 ? '🟢 Fresh' : filters.maxSellAge <= 30 ? '🟡 Moderate' : '🔴 Stale'}
                    </p>
                </div>
            </div>

            {/* Upgrade Flip Filters */}
            <div className="space-y-4 pt-4 border-t border-gray-700">
                <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-bold text-gray-300">Show Upgrade Flips</span>
                    <div
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${filters.showUpgrades ? 'bg-green-600' : 'bg-gray-600'
                            }`}
                        onClick={() => updateFilter('showUpgrades', !filters.showUpgrades)}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${filters.showUpgrades ? 'translate-x-6' : ''
                            }`} />
                    </div>
                </label>

                {filters.showUpgrades && (
                    <>
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 mb-2">Upgrade From</h4>
                            <div className="flex flex-wrap gap-2">
                                {[0, 1, 2, 3].map(enchant => (
                                    <button
                                        key={enchant}
                                        onClick={() => toggleArrayItem('upgradeFrom', enchant)}
                                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${filters.upgradeFrom.includes(enchant)
                                                ? 'bg-green-600 text-white'
                                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                            }`}
                                    >
                                        .{enchant}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-gray-400 mb-2">Upgrade To</h4>
                            <div className="flex flex-wrap gap-2">
                                {[1, 2, 3, 4].map(enchant => (
                                    <button
                                        key={enchant}
                                        onClick={() => toggleArrayItem('upgradeTo', enchant)}
                                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${filters.upgradeTo.includes(enchant)
                                                ? 'bg-green-600 text-white'
                                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                            }`}
                                    >
                                        .{enchant}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-gray-400 block mb-1">
                                Max Rune Count: {filters.maxRuneCount === 999 ? 'Unlimited' : filters.maxRuneCount}
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="20"
                                step="1"
                                value={filters.maxRuneCount === 999 ? 20 : filters.maxRuneCount}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    updateFilter('maxRuneCount', val === 20 ? 999 : val);
                                }}
                                className="w-full"
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Display Filters */}
            <div className="space-y-2 pt-4 border-t border-gray-700">
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={filters.hideDuplicates}
                        onChange={(e) => updateFilter('hideDuplicates', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500"
                    />
                    <span className="text-sm text-gray-300">Hide Duplicates</span>
                </label>

                <div>
                    <label className="text-xs text-gray-400 block mb-1">
                        Min Quantity: {filters.minQuantity}
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="100"
                        step="1"
                        value={filters.minQuantity}
                        onChange={(e) => updateFilter('minQuantity', Number(e.target.value))}
                        className="w-full"
                    />
                </div>
            </div>

            {/* Reset Button */}
            <button
                onClick={() => onChange({
                    buyLocations: [City.CAERLEON],
                    sellLocations: [City.BLACK_MARKET],
                    tiers: [6, 7, 8],
                    enchantments: [0, 1, 2, 3, 4],
                    qualities: [1],
                    categories: [],
                    minProfit: 50000,
                    minMargin: 10,
                    maxInvestment: 999999999,
                    maxBuyAge: 60,
                    maxSellAge: 30,
                    showUpgrades: false,
                    upgradeFrom: [0],
                    upgradeTo: [1, 2, 3, 4],
                    maxRuneCount: 999,
                    hideMissingMats: false,
                    hideConsumed: true,
                    hideDuplicates: true,
                    minQuantity: 1
                })}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
            >
                Reset Filters
            </button>
        </div>
    );
}
