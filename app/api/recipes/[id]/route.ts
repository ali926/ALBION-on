import { NextRequest, NextResponse } from 'next/server';
import { albionDb } from '@/lib/db/queries';

/**
 * GET /api/recipes/[id]
 * Get a single recipe by recipe ID or item ID
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Try to get recipe by recipe ID first
        let recipe = albionDb.getRecipeById(params.id);

        // If not found, try by item ID
        if (!recipe) {
            recipe = albionDb.getRecipeByItemId(params.id);
        }

        if (!recipe) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Recipe not found'
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: recipe,
        });
    } catch (error) {
        console.error('Error fetching recipe:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch recipe',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
