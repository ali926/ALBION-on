import { getDatabase } from './connection';

export interface Item {
    id: string;
    name: string;
    tier: number;
    enchantment: number;
    category: string;
    subcategory: string | null;
    craftingStation: string | null;
    baseValue: number;
    itemPower: number | null;
    weight: number | null;
    stackSize: number;
    isArtifact: boolean;
    isTradeable: boolean;
    description: string | null;
    iconPath: string | null;
}

export interface Recipe {
    id: string;
    resultItemId: string;
    craftingStation: string;
    batchSize: number;
    baseFocusCost: number;
    craftingTime: number | null;
    requiredFame: number;
    materials: RecipeMaterial[];
}

export interface RecipeMaterial {
    itemId: string;
    amount: number;
    isArtifactMaterial: boolean;
}

export interface CityBonus {
    city: string;
    itemCategory: string;
    bonusPercentage: number;
}

export interface FocusCost {
    itemId: string;
    tier: number;
    enchantment: number;
    baseFocusCost: number;
}

export interface ItemFilters {
    category?: string;
    tier?: number;
    search?: string;
    craftable?: boolean;
    enchantment?: number;
    limit?: number;
    offset?: number;
}

export interface RecipeFilters {
    category?: string;
    tier?: number;
    craftingStation?: string;
    limit?: number;
    offset?: number;
}

/**
 * Database query class for Albion Online data
 */
export class AlbionDatabase {
    private db = getDatabase();

    /**
     * Get all items with optional filters
     */
    getItems(filters?: ItemFilters): Item[] {
        let query = 'SELECT * FROM items WHERE 1=1';
        const params: any[] = [];

        if (filters?.category) {
            query += ' AND category = ?';
            params.push(filters.category);
        }

        if (filters?.tier) {
            query += ' AND tier = ?';
            params.push(filters.tier);
        }

        if (filters?.enchantment !== undefined) {
            query += ' AND enchantment = ?';
            params.push(filters.enchantment);
        }

        if (filters?.search) {
            query += ' AND (name LIKE ? OR id LIKE ?)';
            const searchPattern = `%${filters.search}%`;
            params.push(searchPattern, searchPattern);
        }

        if (filters?.craftable) {
            query += ' AND id IN (SELECT DISTINCT result_item_id FROM recipes)';
        }

        query += ' ORDER BY tier, name';

        if (filters?.limit) {
            query += ' LIMIT ?';
            params.push(filters.limit);

            if (filters?.offset) {
                query += ' OFFSET ?';
                params.push(filters.offset);
            }
        }

        const rows = this.db.prepare(query).all(...params);
        return rows.map(this.mapRowToItem);
    }

    /**
     * Get single item by ID
     */
    getItemById(id: string): Item | null {
        const row = this.db.prepare('SELECT * FROM items WHERE id = ?').get(id);
        return row ? this.mapRowToItem(row) : null;
    }

    /**
     * Get recipe by result item ID
     */
    getRecipeByItemId(itemId: string): Recipe | null {
        const recipeRow = this.db.prepare(`
            SELECT * FROM recipes WHERE result_item_id = ?
        `).get(itemId) as any;

        if (!recipeRow) return null;

        const materialRows = this.db.prepare(`
            SELECT material_item_id as itemId, amount, is_artifact_material as isArtifactMaterial
            FROM recipe_materials
            WHERE recipe_id = ?
        `).all(recipeRow.id) as any[];

        return this.mapRowToRecipe(recipeRow, materialRows);
    }

    /**
     * Get recipe by recipe ID
     */
    getRecipeById(recipeId: string): Recipe | null {
        const recipeRow = this.db.prepare(`
            SELECT * FROM recipes WHERE id = ?
        `).get(recipeId) as any;

        if (!recipeRow) return null;

        const materialRows = this.db.prepare(`
            SELECT material_item_id as itemId, amount, is_artifact_material as isArtifactMaterial
            FROM recipe_materials
            WHERE recipe_id = ?
        `).all(recipeRow.id) as any[];

        return this.mapRowToRecipe(recipeRow, materialRows);
    }

    /**
     * Get all recipes with filters
     */
    getRecipes(filters?: RecipeFilters): Recipe[] {
        let query = `
            SELECT r.* FROM recipes r
            JOIN items i ON r.result_item_id = i.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (filters?.category) {
            query += ' AND i.category = ?';
            params.push(filters.category);
        }

        if (filters?.tier) {
            query += ' AND i.tier = ?';
            params.push(filters.tier);
        }

        if (filters?.craftingStation) {
            query += ' AND r.crafting_station = ?';
            params.push(filters.craftingStation);
        }

        query += ' ORDER BY i.tier, i.name';

        if (filters?.limit) {
            query += ' LIMIT ?';
            params.push(filters.limit);

            if (filters?.offset) {
                query += ' OFFSET ?';
                params.push(filters.offset);
            }
        }

        const recipeRows = this.db.prepare(query).all(...params) as any[];

        // Load materials for each recipe
        return recipeRows.map((recipeRow: any) => {
            const materialRows = this.db.prepare(`
                SELECT material_item_id as itemId, amount, is_artifact_material as isArtifactMaterial
                FROM recipe_materials
                WHERE recipe_id = ?
            `).all(recipeRow.id) as any[];

            return this.mapRowToRecipe(recipeRow, materialRows);
        });
    }

    /**
     * Get crafting bonus for city and item
     */
    getCraftingBonus(itemId: string, city: string): number {
        const item = this.db.prepare('SELECT category FROM items WHERE id = ?').get(itemId) as { category: string } | undefined;
        if (!item) return 0;

        const bonus = this.db.prepare(`
            SELECT bonus_percentage FROM city_bonuses
            WHERE city = ? AND item_category = ?
        `).get(city, item.category) as { bonus_percentage: number } | undefined;

        return bonus?.bonus_percentage || 0;
    }

    /**
     * Check if city has bonus for item
     */
    hasCraftingBonus(itemId: string, city: string): boolean {
        return this.getCraftingBonus(itemId, city) > 0;
    }

    /**
     * Get focus cost for item
     */
    getFocusCost(itemId: string, tier: number, enchantment: number = 0): number {
        const cost = this.db.prepare(`
            SELECT base_focus_cost FROM focus_costs
            WHERE item_id = ? AND tier = ? AND enchantment = ?
        `).get(itemId, tier, enchantment) as { base_focus_cost: number } | undefined;

        return cost?.base_focus_cost || 0;
    }

    /**
     * Get all unique categories
     */
    getCategories(): string[] {
        const rows = this.db.prepare('SELECT DISTINCT category FROM items ORDER BY category').all() as { category: string }[];
        return rows.map(r => r.category);
    }

    /**
     * Get all unique crafting stations
     */
    getCraftingStations(): string[] {
        const rows = this.db.prepare('SELECT DISTINCT crafting_station FROM recipes WHERE crafting_station IS NOT NULL ORDER BY crafting_station').all() as { crafting_station: string }[];
        return rows.map(r => r.crafting_station);
    }

    /**
     * Search items by name (fuzzy search)
     */
    searchItems(searchTerm: string, limit: number = 20): Item[] {
        const pattern = `%${searchTerm}%`;
        const rows = this.db.prepare(`
            SELECT * FROM items 
            WHERE name LIKE ? OR id LIKE ?
            ORDER BY 
                CASE 
                    WHEN name LIKE ? THEN 1
                    WHEN name LIKE ? THEN 2
                    ELSE 3
                END,
                tier, name
            LIMIT ?
        `).all(pattern, pattern, `${searchTerm}%`, pattern, limit);

        return rows.map(this.mapRowToItem);
    }

    // Helper methods to map database rows to TypeScript interfaces
    private mapRowToItem(row: any): Item {
        return {
            id: row.id,
            name: row.name,
            tier: row.tier,
            enchantment: row.enchantment || 0,
            category: row.category,
            subcategory: row.subcategory,
            craftingStation: row.crafting_station,
            baseValue: row.base_value || 0,
            itemPower: row.item_power,
            weight: row.weight,
            stackSize: row.stack_size || 1,
            isArtifact: Boolean(row.is_artifact),
            isTradeable: Boolean(row.is_tradeable),
            description: row.description,
            iconPath: row.icon_path,
        };
    }

    private mapRowToRecipe(recipeRow: any, materialRows: any[]): Recipe {
        return {
            id: recipeRow.id,
            resultItemId: recipeRow.result_item_id,
            craftingStation: recipeRow.crafting_station,
            batchSize: recipeRow.batch_size || 1,
            baseFocusCost: recipeRow.base_focus_cost || 0,
            craftingTime: recipeRow.crafting_time,
            requiredFame: recipeRow.required_fame || 0,
            materials: materialRows.map(m => ({
                itemId: m.itemId,
                amount: m.amount,
                isArtifactMaterial: Boolean(m.isArtifactMaterial),
            })),
        };
    }
}

// Export singleton instance
export const albionDb = new AlbionDatabase();
