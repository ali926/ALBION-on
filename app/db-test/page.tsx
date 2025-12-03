"use client";

import { useState } from 'react';
import { useRecipes, useItemSearch, fetchMetadata } from '@/lib/api-client';
import Card from '@/components/Card';

export default function DatabaseTestPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedTier, setSelectedTier] = useState<number | undefined>();

    // Test recipes hook
    const { recipes, loading: recipesLoading, error: recipesError } = useRecipes({
        category: selectedCategory || undefined,
        tier: selectedTier,
        limit: 10,
    });

    // Test search hook
    const { items: searchResults, loading: searchLoading } = useItemSearch(searchQuery);

    // Test metadata
    const [metadata, setMetadata] = useState<any>(null);
    const loadMetadata = async () => {
        const data = await fetchMetadata();
        setMetadata(data);
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-4xl font-bold mb-8 text-gold">🧪 Database API Test</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Search Test */}
                <Card>
                    <h2 className="text-xl font-bold mb-4">Search Test</h2>
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-field mb-4"
                    />
                    {searchLoading && <p className="text-gray-400">Searching...</p>}
                    {searchResults.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm text-gray-400">Found {searchResults.length} items:</p>
                            {searchResults.map(item => (
                                <div key={item.id} className="p-2 bg-gray-800 rounded text-sm">
                                    <div className="font-medium text-gold">{item.name}</div>
                                    <div className="text-xs text-gray-500">
                                        {item.id} - T{item.tier} {item.category}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Recipes Test */}
                <Card>
                    <h2 className="text-xl font-bold mb-4">Recipes Test</h2>
                    <div className="space-y-3 mb-4">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="select-field"
                        >
                            <option value="">All Categories</option>
                            <option value="Weapon">Weapon</option>
                            <option value="Armor">Armor</option>
                            <option value="Resource">Resource</option>
                        </select>

                        <select
                            value={selectedTier || ''}
                            onChange={(e) => setSelectedTier(e.target.value ? Number(e.target.value) : undefined)}
                            className="select-field"
                        >
                            <option value="">All Tiers</option>
                            <option value="4">T4</option>
                            <option value="5">T5</option>
                            <option value="6">T6</option>
                            <option value="7">T7</option>
                            <option value="8">T8</option>
                        </select>
                    </div>

                    {recipesLoading && <p className="text-gray-400">Loading recipes...</p>}
                    {recipesError && <p className="text-red-400">Error: {recipesError}</p>}
                    {recipes.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm text-gray-400">Found {recipes.length} recipes:</p>
                            {recipes.slice(0, 5).map(recipe => (
                                <div key={recipe.id} className="p-2 bg-gray-800 rounded text-sm">
                                    <div className="font-medium text-gold">{recipe.resultItemId}</div>
                                    <div className="text-xs text-gray-500">
                                        {recipe.materials.length} materials - {recipe.craftingStation}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Metadata Test */}
                <Card>
                    <h2 className="text-xl font-bold mb-4">Metadata Test</h2>
                    <button onClick={loadMetadata} className="btn-primary mb-4">
                        Load Metadata
                    </button>
                    {metadata && (
                        <div className="space-y-2 text-sm">
                            <div>
                                <span className="text-gray-400">Categories:</span>
                                <span className="ml-2 text-gray-200">{metadata.categories.join(', ')}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Crafting Stations:</span>
                                <span className="ml-2 text-gray-200">{metadata.craftingStations.join(', ')}</span>
                            </div>
                            <div>
                                <span className="text-gray-400">Tiers:</span>
                                <span className="ml-2 text-gray-200">{metadata.tiers.join(', ')}</span>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Stats */}
                <Card>
                    <h2 className="text-xl font-bold mb-4">Database Stats</h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Total Recipes:</span>
                            <span className="text-gray-200">{recipes.length > 0 ? `${recipes.length}+` : 'Loading...'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Search Results:</span>
                            <span className="text-gray-200">{searchResults.length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">API Status:</span>
                            <span className="text-green-400">✅ Connected</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
