import { useState, useMemo } from 'react';
import { CartItem } from '../lib/types';
import itemsData from '../lib/data/items.json';

interface CraftingCartProps {
    items: CartItem[];
    onRemove: (id: string) => void;
    onClear: () => void;
}

export default function CraftingCart({ items, onRemove, onClear }: CraftingCartProps) {
    const [activeTab, setActiveTab] = useState<'items' | 'shopping'>('items');

    // Calculate totals
    const totals = useMemo(() => {
        return items.reduce((acc, item) => ({
            cost: acc.cost + item.totalCost,
            revenue: acc.revenue + item.revenue,
            profit: acc.profit + item.profit
        }), { cost: 0, revenue: 0, profit: 0 });
    }, [items]);

    // Aggregate shopping list
    const shoppingList = useMemo(() => {
        const list: Record<string, { amount: number; cost: number; name: string }> = {};

        items.forEach(item => {
            item.materials.forEach(mat => {
                if (!list[mat.itemId]) {
                    const itemData = itemsData.find((i: any) => i.id === mat.itemId);
                    list[mat.itemId] = {
                        amount: 0,
                        cost: 0,
                        name: itemData?.name || mat.itemId
                    };
                }
                list[mat.itemId].amount += mat.amount;
                list[mat.itemId].cost += mat.cost;
            });
        });

        return Object.entries(list).sort(([, a], [, b]) => b.cost - a.cost);

    }, [items]);

    if (items.length === 0) {
        return null;
    }

    return (
        <div className="bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 p-6 mt-8 slide-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white flex items-center">
                    <span className="mr-2">🛒</span> Crafting Cart
                    <span className="ml-3 text-sm font-normal bg-gray-800 text-gray-400 px-2 py-1 rounded-full">
                        {items.length} items
                    </span>
                </h2>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setActiveTab('items')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'items'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        Items
                    </button>
                    <button
                        onClick={() => setActiveTab('shopping')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'shopping'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        Shopping List
                    </button>
                    <button
                        onClick={onClear}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-900/50 transition-colors ml-4"
                    >
                        Clear All
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <div className="text-gray-400 text-xs mb-1">Total Investment</div>
                    <div className="text-xl font-bold text-white">{totals.cost.toLocaleString()} 🪙</div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <div className="text-gray-400 text-xs mb-1">Total Revenue</div>
                    <div className="text-xl font-bold text-white">{totals.revenue.toLocaleString()} 🪙</div>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <div className="text-gray-400 text-xs mb-1">Total Profit</div>
                    <div className={`text-xl font-bold ${totals.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {totals.profit > 0 ? '+' : ''}{totals.profit.toLocaleString()} 🪙
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="bg-gray-800/30 rounded-lg border border-gray-700 overflow-hidden">
                {activeTab === 'items' ? (
                    <div className="divide-y divide-gray-700">
                        {items.map((item) => (
                            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-700/30 transition-colors">
                                <div className="flex-grow">
                                    <div className="flex items-center space-x-3">
                                        <span className="font-bold text-gray-200">{item.itemName}</span>
                                        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">x{item.amount}</span>
                                        <span className="text-xs text-gray-500">{item.craftCity} → {item.sellCity}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Cost: {item.totalCost.toLocaleString()} | Rev: {item.revenue.toLocaleString()}
                                    </div>
                                </div>
                                <div className="text-right flex items-center space-x-4">
                                    <div className={`font-mono font-bold ${item.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {item.profit > 0 ? '+' : ''}{item.profit.toLocaleString()} 🪙
                                    </div>
                                    <button
                                        onClick={() => onRemove(item.id)}
                                        className="text-gray-500 hover:text-red-400 transition-colors p-2"
                                        title="Remove from cart"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-4">
                        <div className="grid grid-cols-12 text-xs text-gray-500 uppercase font-bold mb-3 px-2">
                            <div className="col-span-6">Material</div>
                            <div className="col-span-3 text-right">Amount Needed</div>
                            <div className="col-span-3 text-right">Est. Cost</div>
                        </div>
                        <div className="space-y-1">
                            {shoppingList.map(([id, data]) => (
                                <div key={id} className="grid grid-cols-12 items-center p-2 hover:bg-gray-700/30 rounded transition-colors text-sm">
                                    <div className="col-span-6 font-medium text-gray-300">{data.name}</div>
                                    <div className="col-span-3 text-right text-gray-400">{data.amount.toLocaleString()}</div>
                                    <div className="col-span-3 text-right text-gray-300">{data.cost.toLocaleString()} 🪙</div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-700 flex justify-end">
                            <div className="text-right">
                                <div className="text-xs text-gray-500">Total Material Cost</div>
                                <div className="text-lg font-bold text-white">
                                    {shoppingList.reduce((sum, [_, d]) => sum + d.cost, 0).toLocaleString()} 🪙
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
