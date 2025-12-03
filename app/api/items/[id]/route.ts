import { NextRequest, NextResponse } from 'next/server';
import { albionDb } from '@/lib/db/queries';

/**
 * GET /api/items/[id]
 * Get a single item by ID
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const item = albionDb.getItemById(params.id);

        if (!item) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Item not found'
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: item,
        });
    } catch (error) {
        console.error('Error fetching item:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch item',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
