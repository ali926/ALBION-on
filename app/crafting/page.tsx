"use client";

import { useState, useEffect } from 'react';
import Card from '../../components/Card';
import recipesData from '../../lib/data/recipes.json';
import { fetchMultipleItemPrices, fetchMarketVolume, calculateMarketDepth } from '../../lib/market';
import { calculateCraftingOutput, CraftingCalculationOutput } from '../../lib/crafting-calculator';
import { getCraftingBonus, hasCraftingBonus } from '../../lib/data/crafting-bonuses';
import itemsData from '../../lib/data/items.json';
import { City, CartItem } from '../../lib/types';

// Helper to generate enchanted ID
const getEnchantedId = (id: string, enchant: number) => {
    if (enchant === 0) return id;
    const item = (itemsData as any[]).find(i => i.id === id);
    if (!item) return id;

    // Resources use _LEVELx@x, Equipment uses @x
    if (item.type === 'Refined Resource' || item.type === 'Resource') {
        return `${id}_LEVEL${enchant}@${enchant}`;
    }
    return `${id}@${enchant}`;
};
import CraftingCart from '../../components/CraftingCart';
import { calculateTransportRisk, TransportRiskOutput, MountType, RiskProfile, MOUNT_DATA, RISK_PROFILES } from '../../lib/transport-calculator';
import DestinyBoardInput from '../../components/DestinyBoardInput';
import { SpecializationLevels, calculateFocusEfficiency, getSpecializationType } from '../../lib/specialization';
import SparklineChart from '../../components/SparklineChart';

// Categories for filter
const CATEGORIES = ['All', 'Weapon', 'Armor', 'Off-Hand', 'Cape', 'Bag', 'Consumable'];
const TIERS = ['All', '4', '5', '6', '7', '8'];
const ENCHANTMENTS = [0, 1, 2, 3, 4];

export default function CraftingPage() {
    const [selectedRecipeId, setSelectedRecipeId] = useState<string>(recipesData[0]?.id || '');
    const [craftCity, setCraftCity] = useState<string>(City.MARTLOCK);
    const [sellCity, setSellCity] = useState<string>(City.CAERLEON);
    const [amount, setAmount] = useState<number>(1);
    const [usageFee, setUsageFee] = useState<number>(500);
    const [loading, setLoading] = useState<boolean>(false);
    const [prices, setPrices] = useState<Map<string, number>>(new Map());
    const [result, setResult] = useState<CraftingCalculationOutput | null>(null);
    const [isPremium, setIsPremium] = useState<boolean>(false);
    const [useFocus, setUseFocus] = useState<boolean>(false);
    const [specialization, setSpecialization] = useState<SpecializationLevels>({
        mastery: 0,
        specialization: 0,
        otherSpecsAverage: 0,
        numberOfOtherItems: 0
    });
    const [baseFocusCost, setBaseFocusCost] = useState<number>(890);

    // Volume Analysis State
    const [volumeAnalysis, setVolumeAnalysis] = useState<{
        dailyVolume: number;
        safeAmount: number;
        marketDepth: 'High' | 'Medium' | 'Low';
        warning?: string;
    } | null>(null);

    // Transport Risk State
    const [mountType, setMountType] = useState<MountType>('Ox');
    const [riskProfile, setRiskProfile] = useState<RiskProfile>('Standard');
    const [riskAnalysis, setRiskAnalysis] = useState<TransportRiskOutput | null>(null);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [tierFilter, setTierFilter] = useState('All');
    const [enchantment, setEnchantment] = useState<number>(0);

    // Filtered Recipes
    const filteredRecipes = recipesData.filter(recipe => {
        const item = itemsData.find(i => i.id === recipe.resultItemId);
        if (!item) return false;

        // Search
        if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;

        // Category
        if (categoryFilter !== 'All') {
            if (categoryFilter === 'Armor' && (item.type.includes('Armor') || item.type.includes('Helmet') || item.type.includes('Boots'))) return true;
            if (categoryFilter === 'Weapon' && item.type === 'Weapon') return true;
            if (categoryFilter === 'Off-Hand' && item.type === 'Off-Hand') return true;
            if (categoryFilter === 'Cape' && item.type === 'Cape') return true;
            if (categoryFilter === 'Bag' && item.type === 'Bag') return true;
            if (categoryFilter === 'Consumable' && item.type === 'Consumable') return true;
            // Strict match for others or fallback
            if (!item.type.includes(categoryFilter) && item.type !== categoryFilter) return false;
        }

        // Tier
        if (tierFilter !== 'All' && item.tier !== Number(tierFilter)) return false;

        return true;
    });

    // Reset selected recipe if it's filtered out
    useEffect(() => {
        if (filteredRecipes.length > 0 && !filteredRecipes.find(r => r.id === selectedRecipeId)) {
            if (!filteredRecipes.find(r => r.id === selectedRecipeId)) {
                setSelectedRecipeId(filteredRecipes[0].id);
            }
        }
    }, [categoryFilter, tierFilter]);

    const selectedRecipe = recipesData.find(r => r.id === selectedRecipeId);

    // Helper to generate enchanted ID
    const getEnchantedId = (id: string, enchant: number) => {
        if (enchant === 0) return id;
        const item = itemsData.find(i => i.id === id);
        if (!item) return id;

        // Resources use _LEVELx@x, Equipment uses @x
        if (item.type === 'Refined Resource' || item.type === 'Resource') {
            return `${id}_LEVEL${enchant}@${enchant}`;
        }
        return `${id}@${enchant}`;
    };

    // Helper to get display name with enchantment
    const getDisplayName = (name: string, enchant: number) => {
        if (enchant === 0) return name;
        return `${name} .${enchant}`;
    };

    const addToCart = () => {
        if (!result || !selectedRecipe) return;

        const newItem: CartItem = {
            id: Date.now().toString(),
            recipeId: selectedRecipe.id,
            itemName: getDisplayName(itemsData.find((i: any) => i.id === selectedRecipe.resultItemId)?.name || selectedRecipe.resultItemId, enchantment),
            amount: amount,
            craftCity: craftCity,
            sellCity: sellCity,
            totalCost: result.totalCost,
            revenue: result.revenue,
            profit: result.profit,
            materials: result.materialsNet.map(m => ({
                itemId: m.itemId,
                amount: m.amount,
                cost: m.cost
            })),
            timestamp: Date.now()
        };

        setCartItems(prev => [...prev, newItem]);
    };

    const removeFromCart = (id: string) => {
        setCartItems(prev => prev.filter(item => item.id !== id));
    };

    const handleFetchPrices = async () => {
        if (!selectedRecipe) return;

        setLoading(true);
        try {
            const allItemIds = [
                ...selectedRecipe.materials.map(m => getEnchantedId(m.itemId, enchantment)),
                getEnchantedId(selectedRecipe.resultItemId, enchantment)
            ];

            const priceData = await fetchMultipleItemPrices(allItemIds);
            const priceMap = new Map<string, number>();
            const blackMarketPriceMap = new Map<string, number>();

            priceData.forEach((cityPrices, itemId) => {
                const isMaterial = selectedRecipe.materials.some(m => getEnchantedId(m.itemId, enchantment) === itemId);
                const targetCity = isMaterial ? craftCity : sellCity;
                const cityPrice = cityPrices.find(p => p.city === targetCity);
                if (cityPrice) {
                    priceMap.set(itemId, cityPrice.sellPriceMin || 0);
                }

                if (!isMaterial) {
                    const caerleonPrice = cityPrices.find(p => p.city === 'Caerleon');
                    if (caerleonPrice) {
                        blackMarketPriceMap.set(itemId, caerleonPrice.sellPriceMin || 0);
                    }
                }
            });

            setPrices(priceMap);
            if (selectedRecipe && sellCity === 'Black Market') {
                const resultId = getEnchantedId(selectedRecipe.resultItemId, enchantment);
                const bmPrice = blackMarketPriceMap.get(resultId);
                if (bmPrice) {
                    setPrices(prev => {
                        const newMap = new Map(prev);
                        newMap.set('BM_' + resultId, bmPrice);
                        return newMap;
                    });
                }
            }

            if (selectedRecipe && sellCity === 'Black Market') {
                const resultId = getEnchantedId(selectedRecipe.resultItemId, enchantment);
                const volumeData = await fetchMarketVolume(resultId, 'Caerleon');
                const depth = calculateMarketDepth(volumeData.dailyVolume, amount);
                setVolumeAnalysis({
                    dailyVolume: volumeData.dailyVolume,
                    safeAmount: depth.sustainableAmount,
                    marketDepth: depth.marketDepth,
                    warning: depth.volumeWarning
                });
            } else {
                setVolumeAnalysis(null);
            }

        } catch (error) {
            console.error('Failed to fetch prices:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCalculate = () => {
        if (!selectedRecipe || prices.size === 0) return;

        const materialPrices: Record<string, number> = {};
        selectedRecipe.materials.forEach(m => {
            const id = getEnchantedId(m.itemId, enchantment);
            materialPrices[m.itemId] = prices.get(id) || 0;
        });

        const resultId = getEnchantedId(selectedRecipe.resultItemId, enchantment);
        const outputPrice = prices.get(resultId) || 0;
        const blackMarketPrice = prices.get('BM_' + resultId);

        const itemType = itemsData.find((i: any) => i.id === selectedRecipe.resultItemId)?.type || '';
        const focusEfficiency = calculateFocusEfficiency(specialization, getSpecializationType(itemType));

        const calculation = calculateCraftingOutput({
            recipe: {
                itemId: selectedRecipe.resultItemId,
                materials: selectedRecipe.materials.map(m => {
                    const item = itemsData.find((i: any) => i.id === m.itemId);
                    // Assume artifacts/runes/souls/relics don't have enchantment levels matching the output
                    const isArtifact = item?.type === 'Artifact' || item?.type === 'Rune' || item?.type === 'Soul' || item?.type === 'Relic';
                    return {
                        itemId: getEnchantedId(m.itemId, isArtifact ? 0 : enchantment),
                        amount: m.amount,
                        isArtifact: isArtifact
                    };
                }),
                baseFocusCost: baseFocusCost
            },
            amount,
            craftCity,
            sellCity: sellCity === 'Black Market' ? 'Caerleon' : sellCity,
            sellToBlackMarket: sellCity === 'Black Market',
            useFocus,
            focusSpecialization: focusEfficiency,
            isPremium,
            usageFee,
            materialPrices,
            outputPrice,
            blackMarketPrice: sellCity === 'Black Market' && blackMarketPrice ? blackMarketPrice : undefined
        });

        setResult(calculation);

        if (sellCity === 'Black Market' && calculation.blackMarketPrice) {
            const riskCalc = calculateTransportRisk({
                cargoValue: calculation.revenue + calculation.totalTax,
                craftCost: calculation.totalCost,
                mountType,
                riskProfile
            });
            setRiskAnalysis(riskCalc);
        } else {
            setRiskAnalysis(null);
        }
    };

    return (
        <div className="max-w-6xl mx-auto slide-in">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2 text-gold">🔨 Crafting Calculator</h1>
                <p className="text-gray-400">Calculate crafting costs and profit margins with live market prices</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Card */}
                <Card>
                    <h2 className="text-xl font-bold mb-4 text-gray-100">Crafting Parameters</h2>

                    <div className="space-y-4">
                        {/* Filters & Recipe Selection */}
                        <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700 space-y-3">
                            {/* Dropdowns */}
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Category</label>
                                    <select
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                        className="select-field text-xs py-1"
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Tier</label>
                                    <select
                                        value={tierFilter}
                                        onChange={(e) => setTierFilter(e.target.value)}
                                        className="select-field text-xs py-1"
                                    >
                                        {TIERS.map(t => <option key={t} value={t}>{t === 'All' ? 'All' : `T${t}`}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Enchantment</label>
                                    <select
                                        value={enchantment}
                                        onChange={(e) => setEnchantment(Number(e.target.value))}
                                        className={`select-field text-xs py-1 font-bold ${enchantment === 0 ? 'text-gray-300' :
                                            enchantment === 1 ? 'text-green-400' :
                                                enchantment === 2 ? 'text-blue-400' :
                                                    enchantment === 3 ? 'text-purple-400' :
                                                        'text-yellow-400'
                                            }`}
                                    >
                                        {ENCHANTMENTS.map(e => <option key={e} value={e}>{e === 0 ? 'Flat' : `.${e}`}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Search & Recipe Combobox */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Search & Select Recipe
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="⚔️ Search items to forge..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setIsDropdownOpen(true);
                                        }}
                                        onFocus={() => setIsDropdownOpen(true)}
                                        className="forged-input pl-10 text-sm"
                                    />
                                    <div className="absolute left-3 top-2.5 text-gold">
                                        ⚔️
                                    </div>
                                    {searchTerm && (
                                        <button
                                            onClick={() => { setSearchTerm(''); setIsDropdownOpen(false); }}
                                            className="absolute right-3 top-2.5 text-gray-500 hover:text-white"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                {/* Dropdown List */}
                                {isDropdownOpen && (
                                    <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                                        {filteredRecipes.length > 0 ? (
                                            filteredRecipes.map((recipe: any) => {
                                                const item = itemsData.find((i: any) => i.id === recipe.resultItemId);
                                                const isSelected = recipe.id === selectedRecipeId;
                                                return (
                                                    <div
                                                        key={recipe.id}
                                                        onClick={() => {
                                                            setSelectedRecipeId(recipe.id);
                                                            setSearchTerm(item?.name || ''); // Set input to name
                                                            setIsDropdownOpen(false);
                                                        }}
                                                        className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-700 flex justify-between items-center ${isSelected ? 'bg-gray-700/50 text-gold' : 'text-gray-300'
                                                            }`}
                                                    >
                                                        <span>{getDisplayName(item?.name || recipe.resultItemId, enchantment)}</span>
                                                        <span className="text-xs text-gray-500">{recipe.craftingStation}</span>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                                No recipes found
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Selected Item Display (if dropdown closed) */}
                                {!isDropdownOpen && selectedRecipe && (
                                    <div
                                        className="mt-2 p-2 bg-gray-800/50 border border-gray-700 rounded flex justify-between items-center cursor-pointer hover:bg-gray-800"
                                        onClick={() => setIsDropdownOpen(true)}
                                    >
                                        <span className="text-gold font-medium">
                                            {(() => {
                                                const item = itemsData.find((i: any) => i.id === selectedRecipe.resultItemId);
                                                return getDisplayName(item?.name || selectedRecipe.resultItemId, enchantment);
                                            })()}
                                        </span>
                                        <span className="text-xs text-gray-500">Click to change</span>
                                    </div>
                                )}
                            </div>
                        </div>


                        {/* Craft City Selection - City Sigils */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-3">
                                \ud83c\udfdb\ufe0f Craft City - Select Your Forge
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {Object.values(City).filter(c => c !== City.BLACK_MARKET).map(c => {
                                    const hasBonus = selectedRecipe ? hasCraftingBonus(selectedRecipe.resultItemId, c) : false;
                                    const isActive = craftCity === c;
                                    const cityClass = c.toLowerCase().replace(' ', '');

                                    return (
                                        <div
                                            key={c}
                                            onClick={() => setCraftCity(c)}
                                            className={`relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${isActive
                                                ? 'border-gold bg-gradient-to-b from-yellow-900/30 to-transparent'
                                                : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                                                }`}
                                        >
                                            <div className={`city-sigil ${cityClass} ${isActive ? 'active' : ''} w-10 h-10 text-xs flex items-center justify-center font-bold`}>
                                                {c.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className={`text-xs font-medium ${isActive ? 'text-gold' : 'text-gray-400'}`}>
                                                {c}
                                            </span>
                                            {hasBonus && (
                                                <div className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                                    +{getCraftingBonus(selectedRecipe.resultItemId, c)}%
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            {selectedRecipe && hasCraftingBonus(selectedRecipe.resultItemId, craftCity) && (
                                <p className="text-xs text-green-400 mt-2 bg-green-900/20 p-2 rounded border border-green-800/50">
                                    ⭐ {craftCity} provides +{getCraftingBonus(selectedRecipe.resultItemId, craftCity)}% production bonus for this item
                                </p>
                            )}
                        </div>

                        {/* Sell City Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Sell City
                            </label>
                            <select
                                value={sellCity}
                                onChange={(e) => setSellCity(e.target.value)}
                                className="select-field"
                            >
                                {Object.values(City).filter(c => c !== City.BLACK_MARKET).map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                                <option value="Black Market">🏴‍☠️ Black Market (Caerleon)</option>
                            </select>
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Amount to Craft
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                                className="input-field"
                                min="1"
                            />
                        </div>

                        {/* Usage Fee */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Usage Fee (%)
                            </label>
                            <input
                                type="number"
                                value={usageFee}
                                onChange={(e) => setUsageFee(Number(e.target.value))}
                                className="input-field"
                                min="0"
                                step="50"
                            />
                        </div>

                        {/* Materials Display - Forgemaster Panel */}
                        {selectedRecipe && (
                            <div className="forged-panel p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-bold text-gold flex items-center gap-2">
                                        ⚒️ Forgemaster Materials
                                    </h3>
                                    <span className="text-xs text-gray-500">Required for craft</span>
                                </div>
                                <div className="space-y-2">
                                    {selectedRecipe.materials.map((m: any) => {
                                        const item = itemsData.find((i: any) => i.id === m.itemId);
                                        return (
                                            <div key={m.itemId} className="flex justify-between items-center py-1.5 px-2 rounded bg-gray-900/40 border-l-2 border-steel-gray hover:border-gold transition-colors">
                                                <span className="text-sm text-gray-300">{item?.name || m.itemId}</span>
                                                <span className="text-sm font-bold numeric text-gold">×{m.amount}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-gray-700 space-y-4">
                            {/* Premium Toggle - Royal Status */}
                            <div className="flex items-center justify-between bg-gradient-to-r from-yellow-900/20 to-transparent p-3 rounded-lg border border-yellow-800/30">
                                <div>
                                    <span className="text-sm font-bold text-yellow-400 flex items-center gap-2">
                                        👑 Premium Status
                                    </span>
                                    <span className="text-xs text-gray-500">-50% tax rate</span>
                                </div>
                                <div
                                    className={`arcane-switch ${isPremium ? 'active' : ''}`}
                                    onClick={() => setIsPremium(!isPremium)}
                                >
                                    <div className="arcane-switch-thumb" />
                                </div>
                            </div>

                            {/* Focus Toggle - Arcane Switch */}
                            <div className="flex items-center justify-between bg-gradient-to-r from-purple-900/20 to-transparent p-3 rounded-lg border border-purple-800/30">
                                <div>
                                    <span className="text-sm font-bold text-purple-400 flex items-center gap-2">
                                        🔮 Use Focus
                                    </span>
                                    <span className="text-xs text-gray-500">Return resources</span>
                                </div>
                                <div
                                    className={`arcane-switch ${useFocus ? 'active' : ''}`}
                                    onClick={() => setUseFocus(!useFocus)}
                                >
                                    <div className="arcane-switch-thumb" />
                                </div>
                            </div>

                            {useFocus && (
                                <div className="mt-4">
                                    <DestinyBoardInput
                                        type={selectedRecipe ? getSpecializationType(itemsData.find((i: any) => i.id === selectedRecipe.resultItemId)?.type || '') : 'armor_weapon'}
                                        values={specialization}
                                        onChange={setSpecialization}
                                    />
                                    <div className="mt-4">
                                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Base Focus Cost</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={baseFocusCost}
                                            onChange={(e) => setBaseFocusCost(Math.max(0, Number(e.target.value)))}
                                            className="w-full bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 text-sm focus:border-purple-500 outline-none"
                                            placeholder="e.g. 890"
                                        />
                                        <p className="text-[10px] text-gray-500 mt-1">Check in-game for base cost</p>
                                    </div>
                                </div>
                            )}

                            {/* Transport Risk Settings (Only when Black Market is selected) */}
                            {sellCity === 'Black Market' && (
                                <div className="mt-4 pt-4 border-t border-gray-700 space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-300">Transport Settings</h3>

                                    {/* Mount Selection */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Transport Mount</label>
                                        <select
                                            value={mountType}
                                            onChange={(e) => setMountType(e.target.value as MountType)}
                                            className="select-field text-sm"
                                        >
                                            {Object.entries(MOUNT_DATA).map(([key, stats]) => (
                                                <option key={key} value={key}>
                                                    {stats.name} - {stats.speed}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-[10px] text-gray-500 mt-1">
                                            Est. Gear Cost: {MOUNT_DATA[mountType].cost.toLocaleString()} 🪙
                                        </p>
                                    </div>

                                    {/* Risk Profile */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Risk Level</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(RISK_PROFILES).map(([key, profile]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => setRiskProfile(key as RiskProfile)}
                                                    className={`p-2 rounded text-xs border ${riskProfile === key
                                                        ? 'bg-red-900/40 border-red-500 text-red-200'
                                                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                                                        }`}
                                                >
                                                    <div className="font-bold">{profile.name}</div>
                                                    <div className="text-[10px] opacity-70">{(profile.survivalRate * 100).toFixed(0)}% Survival</div>
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1">
                                            {RISK_PROFILES[riskProfile].description}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleFetchPrices}
                            disabled={loading}
                            className="btn-secondary w-full"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <span className="loading-spinner mr-2"></span>
                                    Fetching Prices...
                                </span>
                            ) : (
                                'Fetch Market Prices'
                            )}
                        </button>

                        <button
                            onClick={handleCalculate}
                            disabled={prices.size === 0}
                            className="btn-primary w-full"
                        >
                            Calculate Profit
                        </button>
                    </div>
                </Card>

                {/* Results Card */}
                <Card>
                    <h2 className="text-xl font-bold mb-4 text-gray-100">Crafting Analysis</h2>

                    {
                        result ? (
                            <div className="space-y-4">
                                {/* City Bonus Info */}
                                {result.hasSpecialization && (
                                    <div className="bg-green-900/20 border border-green-800 rounded-lg p-3">
                                        <div className="text-xs text-green-400 font-bold mb-1">⭐ City Bonus Active</div>
                                        <div className="text-sm text-green-300">
                                            {craftCity} provides +{result.cityBonus}% production bonus for this item
                                        </div>
                                    </div>
                                )}

                                {/* RRR Display */}
                                <div className="glass-card p-4 bg-blue-900/20 border border-blue-800">
                                    <h3 className="text-sm font-semibold text-blue-300 mb-2">Resource Return Rate</h3>
                                    <div className="text-2xl font-bold text-blue-400">{result.resourceReturnRate.toFixed(1)}%</div>
                                    <div className="text-xs text-blue-300 mt-1">
                                        Production Bonus: {result.productionBonus}%
                                    </div>
                                </div>

                                {/* Material Costs with Returns */}
                                <div className="glass-card p-4 bg-gray-800/30">
                                    <h3 className="text-sm font-semibold text-gray-300 mb-2">Materials (Net Cost)</h3>
                                    <div className="space-y-2">
                                        {result.materialsNet.map((m: any) => {
                                            const item = itemsData.find((i: any) => i.id === m.itemId);
                                            const gross = result.materialsGross.find((g: any) => g.itemId === m.itemId);
                                            const returned = result.materialsReturned.find((r: any) => r.itemId === m.itemId);
                                            return (
                                                <div key={m.itemId} className="text-sm">
                                                    <div className="flex justify-between text-gray-300 font-medium">
                                                        <span>{item?.name || m.itemId}</span>
                                                        <span>{m.cost.toLocaleString()} 🪙</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                                                        <span>Used: {gross?.amount} → {m.amount.toFixed(1)} (returned {returned?.amount.toFixed(1)})</span>
                                                        <span className="text-green-400">-{returned?.value.toLocaleString()} 🪙</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-label">Usage Fee</div>
                                    <div className="stat-value negative">-{result.usageFee.toLocaleString()} 🪙</div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-label">Total Cost</div>
                                    <div className="stat-value neutral">{result.totalCost.toLocaleString()} 🪙</div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-label">Sell Price ({result.recommendSellTo})</div>
                                    <div className="stat-value neutral">{result.sellPrice.toLocaleString()} 🪙</div>
                                </div>

                                {/* Black Market Comparison */}
                                {sellCity === 'Black Market' && result.blackMarketPrice && (
                                    <div className="glass-card p-4 bg-gray-800/30 border border-gray-700">
                                        <h3 className="text-sm font-semibold text-gray-300 mb-2">Market Comparison</h3>
                                        <div className="space-y-3">
                                            {/* Regular Market */}
                                            <div className="bg-gray-900/50 p-3 rounded">
                                                <div className="text-xs text-gray-400 mb-1">Regular Market (Caerleon)</div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-300">Sell Price:</span>
                                                    <span className="text-gray-100">{prices.get(getEnchantedId(selectedRecipe?.resultItemId || '', enchantment))?.toLocaleString() || 0} 🪙</span>
                                                </div>
                                                <div className="flex justify-between text-xs text-red-400">
                                                    <span>- Sales Tax ({isPremium ? '4%' : '8%'}):</span>
                                                    <span>-{((prices.get(getEnchantedId(selectedRecipe?.resultItemId || '', enchantment)) || 0) * (isPremium ? 0.04 : 0.08)).toFixed(0)} 🪙</span>
                                                </div>
                                                <div className="flex justify-between text-xs text-red-400">
                                                    <span>- Setup Fee (2.5%):</span>
                                                    <span>-{((prices.get(getEnchantedId(selectedRecipe?.resultItemId || '', enchantment)) || 0) * 0.025).toFixed(0)} 🪙</span>
                                                </div>
                                                <div className="flex justify-between text-sm font-medium text-gray-200 mt-1 pt-1 border-t border-gray-700">
                                                    <span>Net:</span>
                                                    <span>{((prices.get(getEnchantedId(selectedRecipe?.resultItemId || '', enchantment)) || 0) * (1 - (isPremium ? 0.04 : 0.08) - 0.025)).toFixed(0)} 🪙</span>
                                                </div>
                                            </div>

                                            {/* Black Market */}
                                            <div className="bg-red-900/20 p-3 rounded border border-red-800">
                                                <div className="text-xs text-red-400 mb-1">🏴‍☠️ Black Market (Caerleon)</div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-300">Buy Order:</span>
                                                    <span className="text-gray-100 font-medium">{result.blackMarketPrice.toLocaleString()} 🪙</span>
                                                </div>
                                                <div className="flex justify-between text-xs text-red-400">
                                                    <span>- Sales Tax ({isPremium ? '4%' : '8%'}):</span>
                                                    <span>-{(result.blackMarketPrice * (isPremium ? 0.04 : 0.08)).toFixed(0)} 🪙</span>
                                                </div>
                                                <div className="flex justify-between text-xs text-red-400">
                                                    <span>- Setup Fee (2.5%):</span>
                                                    <span>-{(result.blackMarketPrice * 0.025).toFixed(0)} 🪙</span>
                                                </div>
                                                <div className="flex justify-between text-sm font-medium text-green-300 mt-1 pt-1 border-t border-red-700">
                                                    <span>Net:</span>
                                                    <span>{(result.blackMarketPrice * (1 - (isPremium ? 0.04 : 0.08) - 0.025)).toFixed(0)} 🪙</span>
                                                </div>
                                            </div>

                                            {/* Volume & Sell-Time Analyzer with Sparkline */}
                                            {volumeAnalysis && (
                                                <div className="forged-panel p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="text-sm font-bold text-gold flex items-center gap-2">
                                                            📊 Market Volume Analyzer
                                                        </h4>
                                                        <span className="text-xs text-gray-500">24h demand</span>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                                        <div className="bg-gray-900/40 p-2 rounded">
                                                            <span className="text-xs text-gray-500 block">Daily Volume</span>
                                                            <span className="text-lg font-bold numeric text-white">{volumeAnalysis.dailyVolume.toLocaleString()}</span>
                                                            <span className="text-xs text-gray-400"> units</span>
                                                        </div>
                                                        <div className="bg-gray-900/40 p-2 rounded">
                                                            <span className="text-xs text-gray-500 block">Est. Sell Time</span>
                                                            <span className="text-lg font-bold numeric text-white">{(volumeAnalysis.safeAmount > 0 ? ((amount / volumeAnalysis.dailyVolume) * 24).toFixed(1) : '0')}</span>
                                                            <span className="text-xs text-gray-400"> hours</span>
                                                        </div>
                                                    </div>

                                                    {/* Price Trend Sparkline */}
                                                    <div className="bg-gray-900/40 p-3 rounded border border-gray-700">
                                                        <div className="text-xs text-gray-400 mb-2">7-Day Price Trend</div>
                                                        <SparklineChart
                                                            data={[100, 105, 103, 110, 108, 115, 112]}
                                                            width={240}
                                                            height={40}
                                                            className="w-full"
                                                        />
                                                    </div>

                                                    {volumeAnalysis.warning && (
                                                        <div className="mt-3 text-xs text-yellow-400 bg-yellow-900/20 p-2 rounded border border-yellow-800/50 flex items-start gap-1">
                                                            <span>⚠️</span>
                                                            <span>{volumeAnalysis.warning}</span>
                                                        </div>
                                                    )}
                                                    {!volumeAnalysis.warning && volumeAnalysis.dailyVolume > 0 && (
                                                        <div className="mt-3 text-xs text-green-400 bg-green-900/20 p-2 rounded border border-green-800/50">
                                                            ✅ Safe to craft this amount
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Transport Risk Analysis */}
                                            {riskAnalysis && (
                                                <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                                                    <div className="text-xs text-gray-400 mb-2 font-medium flex justify-between">
                                                        <span>☠️ Transport Risk Analysis</span>
                                                        <span className={riskAnalysis.isRecommended ? "text-green-400" : "text-red-400"}>
                                                            {riskAnalysis.isRecommended ? "Worth it" : "Not worth it"}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-500">Expected Value (EV):</span>
                                                            <span className={`font-bold ${riskAnalysis.expectedValue > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                                {riskAnalysis.expectedValue > 0 ? '+' : ''}{riskAnalysis.expectedValue.toLocaleString()} 🪙
                                                            </span>
                                                        </div>

                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-gray-500">Break-even Survival:</span>
                                                            <span className="text-gray-300">{riskAnalysis.breakEvenRate.toFixed(1)}%</span>
                                                        </div>

                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-gray-500">Risk Adjusted Profit:</span>
                                                            <span className="text-gray-300">
                                                                {(riskAnalysis.expectedValue / amount).toFixed(0)} 🪙/unit
                                                            </span>
                                                        </div>

                                                        {!riskAnalysis.isRecommended && (
                                                            <div className="mt-2 text-xs text-red-300 bg-red-900/20 p-2 rounded border border-red-800/50">
                                                                ⚠️ Risk is too high! Expected value is negative. Use a safer mount or scout.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Recommendation */}
                                            <div className={`p-2 rounded text-sm font-medium ${result.recommendSellTo === 'Black Market' ? 'bg-green-900/30 text-green-300' : 'bg-blue-900/30 text-blue-300'}`}>
                                                💡 Recommendation: Sell to {result.recommendSellTo}
                                                {result.recommendSellTo === 'Black Market' && (
                                                    <div className="text-xs text-green-400 mt-1">
                                                        Higher buy order price makes up for same taxes!
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {result.salesTax > 0 && (
                                    <>
                                        <div className="stat-card">
                                            <div className="stat-label">Sales Tax ({isPremium ? '4%' : '8%'})</div>
                                            <div className="stat-value negative">-{result.salesTax.toFixed(2)} 🪙</div>
                                        </div>
                                        <div className="stat-card">
                                            <div className="stat-label">Setup Fee (2.5%)</div>
                                            <div className="stat-value negative">-{result.setupFee.toFixed(2)} 🪙</div>
                                        </div>
                                    </>
                                )}

                                {useFocus && result.actualFocusCost > 0 && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="stat-card border-purple-500/30 bg-purple-900/10">
                                            <div className="stat-label text-purple-300">Focus Cost</div>
                                            <div className="stat-value text-purple-400">{result.actualFocusCost.toLocaleString()} ⚡</div>
                                            <div className="text-xs text-purple-300 mt-1">{result.focusEfficiency.toFixed(1)}% efficiency</div>
                                        </div>
                                        <div className="stat-card border-green-500/30 bg-green-900/10">
                                            <div className="stat-label text-green-300">Profit per Focus</div>
                                            <div className="stat-value text-green-400">{result.profitPerFocus.toFixed(1)} 🪙/⚡</div>
                                        </div>
                                    </div>
                                )}


                                {/* Royal Treasury - Profit Display */}
                                <div className={`forged-panel ${result.profit > 0 ? 'profit-glow' : 'loss-glow'} p-6`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-gold flex items-center gap-2">
                                            \ud83d\udcb0 Royal Treasury
                                        </h3>
                                        <span className={`text-xs px-2 py-1 rounded-full ${result.profit > 0
                                            ? 'bg-green-900/50 text-green-300 border border-green-700'
                                            : 'bg-red-900/50 text-red-300 border border-red-700'
                                            }`}>
                                            {result.profit > 0 ? '\u2705 Profitable' : '\u274c Loss'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="bg-gray-900/40 p-3 rounded">
                                            <div className="text-xs text-gray-400 mb-1">Craft Cost</div>
                                            <div className="text-lg font-bold numeric text-red-400">-{result.totalCost.toLocaleString()} \ud83e\ude99</div>
                                        </div>
                                        <div className="bg-gray-900/40 p-3 rounded">
                                            <div className="text-xs text-gray-400 mb-1">Sell Price</div>
                                            <div className="text-lg font-bold numeric text-green-400">+{result.sellPrice.toLocaleString()} \ud83e\ude99</div>
                                        </div>
                                    </div>

                                    <div className="border-t-2 border-gold/30 pt-4">
                                        <div className="flex justify-between items-baseline mb-2">
                                            <span className="text-sm text-gray-400">Net Profit</span>
                                            <div className={`text-4xl font-bold numeric ${result.profit > 0 ? 'text-gold profit-flicker' : 'text-red-400'
                                                }`}>
                                                {result.profit > 0 ? '+' : ''}{result.profit.toLocaleString()} \ud83e\ude99
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-500">Return on Investment</span>
                                            <span className={`text-lg font-bold ${result.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {result.roi > 0 ? '+' : ''}{result.roi.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-xs text-gray-500">Profit per Unit</span>
                                            <span className={`text-sm font-bold numeric ${result.profit > 0 ? 'text-gold' : 'text-red-300'}`}>
                                                {(result.profit / amount).toFixed(0)} \ud83e\ude99/unit
                                            </span>
                                        </div>
                                    </div>

                                    {result.recommendSellTo && (
                                        <div className="mt-4 pt-4 border-t border-gray-700">
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                \ud83d\udca1 <span>Best city to sell:</span>
                                                <span className="text-gold font-bold">{result.recommendSellTo}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Visual Profit Breakdown */}
                                <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                                    <h3 className="text-sm font-semibold text-gray-300 mb-3">Profit Breakdown</h3>

                                    {/* Progress Bar */}
                                    <div className="h-4 w-full bg-gray-700 rounded-full overflow-hidden flex mb-2">
                                        {/* Material Cost */}
                                        <div
                                            className="h-full bg-blue-500/70"
                                            style={{ width: `${Math.min(100, (result.totalCost / result.sellPrice) * 100)}%` }}
                                            title={`Cost: ${result.totalCost.toLocaleString()}`}
                                        />
                                        {/* Profit (if positive) */}
                                        {result.profit > 0 && (
                                            <div
                                                className="h-full bg-green-500"
                                                style={{ width: `${(result.profit / result.sellPrice) * 100}%` }}
                                                title={`Profit: ${result.profit.toLocaleString()}`}
                                            />
                                        )}
                                    </div>

                                    {/* Legend */}
                                    <div className="flex justify-between text-xs text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-blue-500/70"></div>
                                            <span>Costs ({((result.totalCost / result.sellPrice) * 100).toFixed(1)}%)</span>
                                        </div>
                                        {result.profit > 0 ? (
                                            <div className="flex items-center gap-1">
                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                <span className="text-green-400">Profit ({((result.profit / result.sellPrice) * 100).toFixed(1)}%)</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1">
                                                <span className="text-red-400">Loss ({((Math.abs(result.profit) / result.sellPrice) * 100).toFixed(1)}%)</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-700">
                                    <button
                                        onClick={addToCart}
                                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-lg"
                                    >
                                        <span>🛒</span>
                                        <span>Add to Cart</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                <span className="text-4xl mb-2">📊</span>
                                <p>Select a recipe and calculate to see results</p>
                            </div>
                        )
                    }
                </Card>
            </div>

            {/* Crafting Cart */}
            <CraftingCart
                items={cartItems}
                onRemove={removeFromCart}
                onClear={() => setCartItems([])}
            />

        </div>
    );
}
