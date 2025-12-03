"use client";

import { useState } from 'react';
import { fetchItemPrices } from '../lib/market';

interface MaterialPrices {
    [tier: number]: {
        rune: number;
        soul: number;
        relic: number;
    };
}

interface UpgradeMaterialsPanelProps {
    prices: MaterialPrices;
    onChange: (prices: MaterialPrices) => void;
}

const TIERS = [4, 5, 6, 7, 8];

export default function UpgradeMaterialsPanel({ prices, onChange }: UpgradeMaterialsPanelProps) {
    const [loading, setLoading] = useState(false);
    const [loadLocation, setLoadLocation] = useState('Caerleon');

    const updatePrice = (tier: number, type: 'rune' | 'soul' | 'relic', value: number) => {
        onChange({
            ...prices,
            [tier]: {
                ...prices[tier],
                [type]: value
            }
        });
    };

    const loadFromMarket = async () => {
        setLoading(true);
        try {
            // Fetch prices for all upgrade materials
            const materialIds: string[] = [];
            TIERS.forEach(tier => {
                materialIds.push(`T${tier}_RUNE`, `T${tier}_SOUL`, `T${tier}_RELIC`);
            });

            const results = await Promise.all(
                materialIds.map(id => fetchItemPrices(id, [loadLocation]))
            );

            const newPrices: MaterialPrices = {};
            TIERS.forEach(tier => {
                const runeData = results.find(r => r[0]?.itemId === `T${tier}_RUNE`);
                const soulData = results.find(r => r[0]?.itemId === `T${tier}_SOUL`);
                const relicData = results.find(r => r[0]?.itemId === `T${tier}_RELIC`);

                newPrices[tier] = {
                    rune: runeData?.[0]?.sellPriceMin || 0,
                    soul: soulData?.[0]?.sellPriceMin || 0,
                    relic: relicData?.[0]?.sellPriceMin || 0
                };
            });

            onChange(newPrices);
        } catch (error) {
            console.error('Failed to load material prices:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-300">Upgrade Material Prices</h3>
                <div className="flex items-center space-x-2">
                    <select
                        value={loadLocation}
                        onChange={(e) => setLoadLocation(e.target.value)}
                        className="text-xs bg-gray-800 border border-gray-700 text-white rounded px-2 py-1"
                    >
                        <option value="Caerleon">Caerleon</option>
                        <option value="Bridgewatch">Bridgewatch</option>
                        <option value="Lymhurst">Lymhurst</option>
                        <option value="Martlock">Martlock</option>
                        <option value="Fort Sterling">Fort Sterling</option>
                        <option value="Thetford">Thetford</option>
                    </select>
                    <button
                        onClick={loadFromMarket}
                        disabled={loading}
                        className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Load Prices'}
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                {TIERS.map(tier => (
                    <div key={tier} className="bg-gray-800/50 rounded-lg p-3">
                        <h4 className="text-xs font-bold text-gray-400 mb-2">Tier {tier}</h4>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Rune</label>
                                <input
                                    type="number"
                                    value={prices[tier]?.rune || 0}
                                    onChange={(e) => updatePrice(tier, 'rune', Number(e.target.value))}
                                    className="w-full bg-gray-900 border border-gray-700 text-white rounded px-2 py-1 text-xs"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Soul</label>
                                <input
                                    type="number"
                                    value={prices[tier]?.soul || 0}
                                    onChange={(e) => updatePrice(tier, 'soul', Number(e.target.value))}
                                    className="w-full bg-gray-900 border border-gray-700 text-white rounded px-2 py-1 text-xs"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Relic</label>
                                <input
                                    type="number"
                                    value={prices[tier]?.relic || 0}
                                    onChange={(e) => updatePrice(tier, 'relic', Number(e.target.value))}
                                    className="w-full bg-gray-900 border border-gray-700 text-white rounded px-2 py-1 text-xs"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-300">
                    💡 <strong>Tip:</strong> Use "Sell Order" prices (instant buy) for accurate upgrade flip calculations.
                </p>
            </div>
        </div>
    );
}
