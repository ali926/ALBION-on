import { NextRequest, NextResponse } from 'next/server';
import { albionDb } from '@/lib/db/queries';

/**
 * GET /api/search
 * Search items by name with fuzzy matching
 * Query parameters:
 * - q: Search query (required)
 * - limit: Number of results (default: 20)
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q');

        if (!query) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Search query is required'
                },
                { status: 400 }
            );
        }

        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
        const items = albionDb.searchItems(query, limit);

        return NextResponse.json({
            success: true,
            query,
            count: items.length,
            data: items,
        });
    } catch (error) {
        console.error('Error searching items:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to search items',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
