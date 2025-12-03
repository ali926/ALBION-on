import { NextRequest, NextResponse } from 'next/server';
import { albionDb } from '@/lib/db/queries';

/**
 * GET /api/items
 * Query parameters:
 * - category: Filter by category
 * - tier: Filter by tier (4-8)
 * - search: Search by name or ID
 * - craftable: Filter craftable items only (true/false)
 * - limit: Number of results (default: 100)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;

        const filters = {
            category: searchParams.get('category') || undefined,
            tier: searchParams.get('tier') ? parseInt(searchParams.get('tier')!) : undefined,
            search: searchParams.get('search') || undefined,
            craftable: searchParams.get('craftable') === 'true',
            limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
            offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
        };

        const items = albionDb.getItems(filters);

        return NextResponse.json({
            success: true,
            count: items.length,
            data: items,
        });
    } catch (error) {
        console.error('Error fetching items:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch items',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
