"use client";

import { useState } from 'react';
import { BlackMarketFlipOpportunity } from '../lib/types';
import { scanTopOpportunities, ScanProgress } from '../lib/black-market-scanner';
import { City } from '../lib/types';

interface OpportunityScannerProps {
    isPremium: boolean;
    onSelectOpportunity?: (opportunity: BlackMarketFlipOpportunity) => void;
}

export default function OpportunityScanner({ isPremium, onSelectOpportunity }: OpportunityScannerProps) {
    const [scanning, setScanning] = useState(false);
    const [opportunities, setOpportunities] = useState<BlackMarketFlipOpportunity[]>([]);
    const [selectedLocations, setSelectedLocations] = useState<string[]>([City.CAERLEON]);
    const [limit, setLimit] = useState(20);
    const [sortBy, setSortBy] = useState<'profit' | 'margin' | 'volume'>('profit');

    const handleScan = async () => {
        setScanning(true);
        try {
            const results = await scanTopOpportunities(limit, isPremium, selectedLocations);
            setOpportunities(results);
        } catch (error) {
            console.error('Scan failed:', error);
        } finally {
            setScanning(false);
        }
    };

    const toggleLocation = (city: string) => {
        setSelectedLocations(prev =>
            prev.includes(city)
                ? prev.filter(c => c !== city)
                : [...prev, city]
        );
    };

    const sortedOpportunities = [...opportunities].sort((a, b) => {
        switch (sortBy) {
            case 'profit':
                return b.riskAdjustedProfit - a.riskAdjustedProfit;
            case 'margin':
                return b.profitMargin - a.profitMargin;
            case 'volume':
                return b.dailyVolume - a.dailyVolume;
            default:
                return 0;
        }
    });

    return (
        <div className="glass-card p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-100">🔍 Opportunity Scanner</h2>
            <p className="text-sm text-gray-400 mb-4">
                Scan popular items for profitable Black Market flips
            </p>

            {/* Settings */}
            <div className="space-y-4 mb-6">
                {/* Buy Locations */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Buy From (Select Cities)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {Object.values(City).filter(c => c !== City.BLACK_MARKET).map(city => (
                            <button
                                key={city}
                                onClick={() => toggleLocation(city)}
                                className={`px-3 py-2 rounded text-sm border ${selectedLocations.includes(city)
                                        ? 'bg-gold/20 border-gold text-gold'
                                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                                    }`}
                            >
                                {city}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Limit */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Max Results
                    </label>
                    <select
                        value={limit}
                        onChange={(e) => setLimit(Number(e.target.value))}
                        className="select-field"
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>

                {/* Scan Button */}
                <button
                    onClick={handleScan}
                    disabled={scanning || selectedLocations.length === 0}
                    className="btn-primary w-full"
                >
                    {scanning ? (
                        <span className="flex items-center justify-center">
                            <span className="loading-spinner mr-2"></span>
                            Scanning...
                        </span>
                    ) : (
                        `Scan for Opportunities`
                    )}
                </button>
            </div>

            {/* Results */}
            {opportunities.length > 0 && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-200">
                            Found {opportunities.length} Opportunities
                        </h3>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="select-field text-sm"
                        >
                            <option value="profit">Sort by Profit</option>
                            <option value="margin">Sort by Margin</option>
                            <option value="volume">Sort by Volume</option>
                        </select>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                        {sortedOpportunities.map((opp, index) => (
                            <div
                                key={`${opp.itemId}-${opp.buyCity}`}
                                className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gold transition-colors cursor-pointer"
                                onClick={() => onSelectOpportunity?.(opp)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-medium text-gray-100">{opp.itemName}</div>
                                        <div className="text-xs text-gray-500">
                                            Buy from {opp.buyCity} → Sell to Black Market
                                        </div>
                                    </div>
                                    <div className={`text-lg font-bold ${opp.riskAdjustedProfit > 0 ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        +{opp.riskAdjustedProfit.toLocaleString()} 🪙
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div>
                                        <span className="text-gray-500">Margin:</span>
                                        <span className="text-gray-300 ml-1">{opp.profitMargin.toFixed(1)}%</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Volume:</span>
                                        <span className="text-gray-300 ml-1">{opp.dailyVolume.toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Risk:</span>
                                        <span className={`ml-1 ${opp.transportRisk.riskLevel === 'Safe' ? 'text-green-400' :
                                                opp.transportRisk.riskLevel === 'Standard' ? 'text-yellow-400' :
                                                    opp.transportRisk.riskLevel === 'Risky' ? 'text-orange-400' :
                                                        'text-red-400'
                                            }`}>
                                            {opp.transportRisk.riskLevel}
                                        </span>
                                    </div>
                                </div>

                                {!opp.isRecommended && (
                                    <div className="mt-2 text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded">
                                        ⚠️ High risk - not recommended
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!scanning && opportunities.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🔍</div>
                    <p>Click "Scan for Opportunities" to find profitable flips</p>
                </div>
            )}
        </div>
    );
}
