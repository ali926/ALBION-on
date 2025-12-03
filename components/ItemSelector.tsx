import { useState, useMemo } from 'react';
import { Item } from '../lib/types';

interface ItemSelectorProps {
    items: Item[];
    selectedItemId: string;
    onSelect: (itemId: string) => void;
    label?: string;
    showTierFilter?: boolean;
    showTypeFilter?: boolean;
}

export default function ItemSelector({
    items,
    selectedItemId,
    onSelect,
    label = "Select Item",
    showTierFilter = true,
    showTypeFilter = true
}: ItemSelectorProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [tierFilter, setTierFilter] = useState<number | null>(null);
    const [typeFilter, setTypeFilter] = useState<string | null>(null);

    // Get unique tiers and types
    const tiers = useMemo(() => {
        const uniqueTiers = [...new Set(items.map(i => i.tier))];
        return uniqueTiers.sort((a, b) => a - b);
    }, [items]);

    const types = useMemo(() => {
        const uniqueTypes = [...new Set(items.map(i => i.type))];
        return uniqueTypes.sort();
    }, [items]);

    // Filter items based on search and filters
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.id.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTier = tierFilter === null || item.tier === tierFilter;
            const matchesType = typeFilter === null || item.type === typeFilter;

            return matchesSearch && matchesTier && matchesType;
        });
    }, [items, searchQuery, tierFilter, typeFilter]);

    return (
        <div className="space-y-3">
            {label && <label className="block text-sm font-medium text-gray-300">{label}</label>}

            {/* Search Input */}
            <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field"
            />

            {/* Filters */}
            <div className="flex gap-3">
                {showTierFilter && (
                    <select
                        value={tierFilter ?? ''}
                        onChange={(e) => setTierFilter(e.target.value ? Number(e.target.value) : null)}
                        className="select-field flex-1"
                    >
                        <option value="">All Tiers</option>
                        {tiers.map(tier => (
                            <option key={tier} value={tier}>Tier {tier}</option>
                        ))}
                    </select>
                )}

                {showTypeFilter && (
                    <select
                        value={typeFilter ?? ''}
                        onChange={(e) => setTypeFilter(e.target.value || null)}
                        className="select-field flex-1"
                    >
                        <option value="">All Types</option>
                        {types.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Item Selection */}
            <select
                value={selectedItemId}
                onChange={(e) => onSelect(e.target.value)}
                className="select-field"
            >
                {filteredItems.length === 0 ? (
                    <option value="">No items found</option>
                ) : (
                    filteredItems.map(item => (
                        <option key={item.id} value={item.id}>
                            {item.name} (T{item.tier}{item.enchantment ? `.${item.enchantment}` : ''})
                        </option>
                    ))
                )}
            </select>

            {filteredItems.length === 0 && searchQuery && (
                <p className="text-sm text-gray-500">No items match your search criteria</p>
            )}
        </div>
    );
}
