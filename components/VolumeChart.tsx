"use client";

import { useMemo } from 'react';

interface VolumeDataPoint {
    item_count: number;
    avg_price: number;
    timestamp: string;
}

interface VolumeChartProps {
    data: VolumeDataPoint[];
    height?: number;
}

export default function VolumeChart({ data, height = 200 }: VolumeChartProps) {
    const processedData = useMemo(() => {
        if (!data || data.length === 0) return [];

        // Sort by timestamp
        const sorted = [...data].sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        return sorted;
    }, [data]);

    if (processedData.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                No volume data available
            </div>
        );
    }

    // Calculate scales
    const maxVolume = Math.max(...processedData.map(d => d.item_count));
    const maxPrice = Math.max(...processedData.map(d => d.avg_price));
    const minPrice = Math.min(...processedData.map(d => d.avg_price));

    // Add some padding to scales
    const volumeScale = maxVolume * 1.1;
    const priceRange = maxPrice - minPrice;
    const priceMinScale = Math.max(0, minPrice - priceRange * 0.1);
    const priceMaxScale = maxPrice + priceRange * 0.1;
    const priceScaleRange = priceMaxScale - priceMinScale;

    // Dimensions
    const padding = { top: 20, right: 40, bottom: 20, left: 40 };
    const width = 100; // Use percentages for width

    // Generate path for price line
    const getX = (index: number) => (index / (processedData.length - 1)) * 100;
    const getYPrice = (price: number) => 100 - ((price - priceMinScale) / priceScaleRange) * 100;
    const getYVolume = (volume: number) => 100 - (volume / volumeScale) * 100;

    const pricePath = processedData.map((d, i) =>
        `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getYPrice(d.avg_price)}`
    ).join(' ');

    return (
        <div className="w-full" style={{ height: `${height}px` }}>
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="overflow-visible">
                {/* Grid lines */}
                <line x1="0" y1="25" x2="100" y2="25" stroke="#374151" strokeWidth="0.5" strokeDasharray="2" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="#374151" strokeWidth="0.5" strokeDasharray="2" />
                <line x1="0" y1="75" x2="100" y2="75" stroke="#374151" strokeWidth="0.5" strokeDasharray="2" />

                {/* Volume Bars */}
                {processedData.map((d, i) => {
                    const barHeight = (d.item_count / volumeScale) * 100;
                    return (
                        <rect
                            key={`vol-${i}`}
                            x={getX(i) - (50 / processedData.length) * 0.8}
                            y={100 - barHeight}
                            width={(100 / processedData.length) * 0.8}
                            height={barHeight}
                            fill="#3b82f6"
                            opacity="0.3"
                        >
                            <title>Volume: {d.item_count}</title>
                        </rect>
                    );
                })}

                {/* Price Line */}
                <path
                    d={pricePath}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                />

                {/* Data Points */}
                {processedData.map((d, i) => (
                    <circle
                        key={`pt-${i}`}
                        cx={getX(i)}
                        cy={getYPrice(d.avg_price)}
                        r="1.5"
                        fill="#fbbf24"
                        vectorEffect="non-scaling-stroke"
                        className="hover:r-2 transition-all cursor-crosshair"
                    >
                        <title>
                            Date: {new Date(d.timestamp).toLocaleDateString()}
                            &#10;Price: {d.avg_price.toLocaleString()}
                            &#10;Volume: {d.item_count}
                        </title>
                    </circle>
                ))}
            </svg>

            {/* Legend / Axis Labels */}
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <div>
                    <span className="text-blue-400">■ Volume</span>
                </div>
                <div>
                    <span className="text-yellow-400">● Price</span>
                </div>
            </div>
        </div>
    );
}
