/**
 * Compatibility layer to transform database types to legacy JSON format
 * This allows existing code to work with the new database without changes
 */

import { Item as DbItem, Recipe as DbRecipe } from './db/queries';

// Legacy JSON format interfaces
export interface LegacyItem {
    id: string;
    name: string;
    tier: number;
    type: string;
    baseValue?: number;
}

export interface LegacyRecipe {
    id: string;
    resultItemId: string;
    materials: Array<{
        itemId: string;
        amount: number;
    }>;
    batchSize?: number;
}

/**
 * Convert database Item to legacy JSON format
 */
export function dbItemToLegacy(item: DbItem): LegacyItem {
    return {
        id: item.id,
        name: item.name,
        tier: item.tier,
        type: item.category, // Map category to type
        baseValue: item.baseValue,
    };
}

/**
 * Convert database Recipe to legacy JSON format
 */
export function dbRecipeToLegacy(recipe: DbRecipe): LegacyRecipe {
    return {
        id: recipe.id,
        resultItemId: recipe.resultItemId,
        materials: recipe.materials.map(m => ({
            itemId: m.itemId,
            amount: m.amount,
        })),
        batchSize: recipe.batchSize,
    };
}

/**
 * Convert array of database Items to legacy format
 */
export function dbItemsToLegacy(items: DbItem[]): LegacyItem[] {
    return items.map(dbItemToLegacy);
}

/**
 * Convert array of database Recipes to legacy format
 */
export function dbRecipesToLegacy(recipes: DbRecipe[]): LegacyRecipe[] {
    return recipes.map(dbRecipeToLegacy);
}
