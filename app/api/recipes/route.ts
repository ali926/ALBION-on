import { NextRequest, NextResponse } from 'next/server';
import { albionDb } from '@/lib/db/queries';

/**
 * GET /api/recipes
 * Query parameters:
 * - category: Filter by item category
 * - tier: Filter by tier (4-8)
 * - craftingStation: Filter by crafting station
 * - limit: Number of results (default: 100)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;

        const filters = {
            category: searchParams.get('category') || undefined,
            tier: searchParams.get('tier') ? parseInt(searchParams.get('tier')!) : undefined,
            craftingStation: searchParams.get('craftingStation') || undefined,
            limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
            offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
        };

        const recipes = albionDb.getRecipes(filters);

        return NextResponse.json({
            success: true,
            count: recipes.length,
            data: recipes,
        });
    } catch (error) {
        console.error('Error fetching recipes:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch recipes',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
