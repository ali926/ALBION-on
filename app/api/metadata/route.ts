import { NextRequest, NextResponse } from 'next/server';
import { albionDb } from '@/lib/db/queries';

/**
 * GET /api/metadata
 * Get metadata about available categories, crafting stations, etc.
 */
export async function GET(request: NextRequest) {
    try {
        const categories = albionDb.getCategories();
        const craftingStations = albionDb.getCraftingStations();

        return NextResponse.json({
            success: true,
            data: {
                categories,
                craftingStations,
                tiers: [4, 5, 6, 7, 8],
                enchantments: [0, 1, 2, 3, 4],
            },
        });
    } catch (error) {
        console.error('Error fetching metadata:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch metadata',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
