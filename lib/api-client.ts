/**
 * Client-side hooks for accessing the Albion database API
 */

import { useState, useEffect } from 'react';
import { Item, Recipe, ItemFilters, RecipeFilters } from '@/lib/db/queries';

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    count?: number;
    error?: string;
    message?: string;
}

/**
 * Fetch items from the API
 */
export async function fetchItems(filters?: ItemFilters): Promise<Item[]> {
    const params = new URLSearchParams();

    if (filters?.category) params.append('category', filters.category);
    if (filters?.tier) params.append('tier', filters.tier.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.craftable) params.append('craftable', 'true');
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await fetch(`/api/items?${params.toString()}`);
    const result: ApiResponse<Item[]> = await response.json();

    if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch items');
    }

    return result.data;
}

/**
 * Fetch a single item by ID
 */
export async function fetchItem(id: string): Promise<Item> {
    const response = await fetch(`/api/items/${encodeURIComponent(id)}`);
    const result: ApiResponse<Item> = await response.json();

    if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch item');
    }

    return result.data;
}

/**
 * Fetch recipes from the API
 */
export async function fetchRecipes(filters?: RecipeFilters): Promise<Recipe[]> {
    const params = new URLSearchParams();

    if (filters?.category) params.append('category', filters.category);
    if (filters?.tier) params.append('tier', filters.tier.toString());
    if (filters?.craftingStation) params.append('craftingStation', filters.craftingStation);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await fetch(`/api/recipes?${params.toString()}`);
    const result: ApiResponse<Recipe[]> = await response.json();

    if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch recipes');
    }

    return result.data;
}

/**
 * Fetch a single recipe by ID or item ID
 */
export async function fetchRecipe(id: string): Promise<Recipe> {
    const response = await fetch(`/api/recipes/${encodeURIComponent(id)}`);
    const result: ApiResponse<Recipe> = await response.json();

    if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch recipe');
    }

    return result.data;
}

/**
 * Search items by name
 */
export async function searchItems(query: string, limit: number = 20): Promise<Item[]> {
    const params = new URLSearchParams();
    params.append('q', query);
    params.append('limit', limit.toString());

    const response = await fetch(`/api/search?${params.toString()}`);
    const result: ApiResponse<Item[]> = await response.json();

    if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to search items');
    }

    return result.data;
}

/**
 * Fetch metadata (categories, crafting stations, etc.)
 */
export async function fetchMetadata(): Promise<{
    categories: string[];
    craftingStations: string[];
    tiers: number[];
    enchantments: number[];
}> {
    const response = await fetch('/api/metadata');
    const result: ApiResponse<{
        categories: string[];
        craftingStations: string[];
        tiers: number[];
        enchantments: number[];
    }> = await response.json();

    if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch metadata');
    }

    return result.data;
}

/**
 * React hook to fetch items
 */
export function useItems(filters?: ItemFilters) {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setLoading(true);
                setError(null);
                const data = await fetchItems(filters);
                if (!cancelled) {
                    setItems(data);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Unknown error');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, [JSON.stringify(filters)]);

    return { items, loading, error };
}

/**
 * React hook to fetch recipes
 */
export function useRecipes(filters?: RecipeFilters) {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setLoading(true);
                setError(null);
                const data = await fetchRecipes(filters);
                if (!cancelled) {
                    setRecipes(data);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Unknown error');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, [JSON.stringify(filters)]);

    return { recipes, loading, error };
}

/**
 * React hook for item search
 */
export function useItemSearch(query: string, limit: number = 20) {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!query || query.length < 2) {
            setItems([]);
            return;
        }

        let cancelled = false;
        const timeoutId = setTimeout(async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await searchItems(query, limit);
                if (!cancelled) {
                    setItems(data);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Unknown error');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }, 300); // Debounce

        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
        };
    }, [query, limit]);

    return { items, loading, error };
}
