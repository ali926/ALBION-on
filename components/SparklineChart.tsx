import React from 'react';

interface SparklineChartProps {
    data: number[];
    width?: number;
    height?: number;
    color?: string;
    className?: string;
}

export default function SparklineChart({
    data,
    width = 100,
    height = 30,
    color,
    className = ''
}: SparklineChartProps) {
    if (!data || data.length === 0) {
        return <div className={`${className}`} style={{ width, height }} />;
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // Determine trend
    const trend = data[data.length - 1] > data[0] ? 'up' : 'down';
    const defaultColor = trend === 'up' ? '#D7A74F' : '#D54C4C'; // gold or red
    const strokeColor = color || defaultColor;

    // Create SVG path
    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
    });

    const pathD = `M ${points.join(' L ')}`;

    return (
        <svg
            width={width}
            height={height}
            className={className}
            style={{ display: 'block' }}
        >
            <path
                d={pathD}
                fill="none"
                stroke={strokeColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Gradient fill under line */}
            <defs>
                <linearGradient id={`gradient-${Math.random()}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path
                d={`${pathD} L ${width},${height} L 0,${height} Z`}
                fill={`url(#gradient-${Math.random()})`}
            />
        </svg>
    );
}
