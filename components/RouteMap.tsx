"use client";

import { useState } from 'react';
import { City } from '../lib/types';

interface RouteMapProps {
    selectedCity: string;
    onSelectCity: (city: string) => void;
}

export default function RouteMap({ selectedCity, onSelectCity }: RouteMapProps) {
    const [hoveredCity, setHoveredCity] = useState<string | null>(null);

    // Map configuration
    const width = 400;
    const height = 400;
    const center = { x: width / 2, y: height / 2 };
    const radius = 140;

    // City positions (pentagon arrangement)
    const cities = [
        { name: City.MARTLOCK, angle: -90, color: '#3b82f6' }, // Top (North is actually Lymhurst in game, but for visual balance)
        // Actually let's try to match game geography roughly
        // Lymhurst (SE), Bridgewatch (S), Martlock (SW), Thetford (NW), Fort Sterling (NE)
        // Caerleon (Center)

        { name: City.FORT_STERLING, angle: -50, color: '#f0fdf4' }, // NE
        { name: City.LYMHURST, angle: 30, color: '#bbf7d0' }, // SE
        { name: City.BRIDGEWATCH, angle: 110, color: '#fde68a' }, // S
        { name: City.MARTLOCK, angle: 190, color: '#93c5fd' }, // SW
        { name: City.THETFORD, angle: 270, color: '#d8b4fe' }, // NW
    ];

    const getPosition = (angle: number, r: number) => {
        const rad = (angle * Math.PI) / 180;
        return {
            x: center.x + r * Math.cos(rad),
            y: center.y + r * Math.sin(rad)
        };
    };

    return (
        <div className="relative w-full aspect-square max-w-md mx-auto">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full drop-shadow-lg">
                {/* Background Zones */}
                <circle cx={center.x} cy={center.y} r={radius + 40} fill="#1f2937" opacity="0.5" />

                {/* Red Zone Ring */}
                <circle cx={center.x} cy={center.y} r={80} fill="#7f1d1d" opacity="0.2" stroke="#ef4444" strokeWidth="1" strokeDasharray="4" />

                {/* Connections */}
                {cities.map((city) => {
                    const pos = getPosition(city.angle, radius);
                    const isSelected = selectedCity === city.name;
                    const isHovered = hoveredCity === city.name;

                    return (
                        <g key={`route-${city.name}`}>
                            {/* Route Line */}
                            <line
                                x1={pos.x}
                                y1={pos.y}
                                x2={center.x}
                                y2={center.y}
                                stroke={isSelected || isHovered ? city.color : '#4b5563'}
                                strokeWidth={isSelected ? 4 : 2}
                                strokeDasharray="5"
                                className="transition-all duration-300"
                            />

                            {/* Red Zone Marker on Route */}
                            <circle
                                cx={center.x + (pos.x - center.x) * 0.4}
                                cy={center.y + (pos.y - center.y) * 0.4}
                                r={isSelected ? 6 : 4}
                                fill="#ef4444"
                                className="animate-pulse"
                            >
                                <title>Red Zone Entry</title>
                            </circle>
                        </g>
                    );
                })}

                {/* Caerleon (Center) */}
                <g transform={`translate(${center.x}, ${center.y})`}>
                    <circle r={25} fill="#111827" stroke="#ef4444" strokeWidth="3" />
                    <text
                        textAnchor="middle"
                        dy="4"
                        fill="#ef4444"
                        fontSize="10"
                        fontWeight="bold"
                    >
                        BM
                    </text>
                    <text
                        textAnchor="middle"
                        dy="20"
                        fill="#9ca3af"
                        fontSize="8"
                    >
                        Caerleon
                    </text>
                </g>

                {/* Royal Cities */}
                {cities.map((city) => {
                    const pos = getPosition(city.angle, radius);
                    const isSelected = selectedCity === city.name;

                    return (
                        <g
                            key={city.name}
                            transform={`translate(${pos.x}, ${pos.y})`}
                            onClick={() => onSelectCity(city.name)}
                            onMouseEnter={() => setHoveredCity(city.name)}
                            onMouseLeave={() => setHoveredCity(null)}
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                        >
                            <circle
                                r={20}
                                fill="#1f2937"
                                stroke={city.color}
                                strokeWidth={isSelected ? 3 : 1}
                                className="transition-all duration-300"
                            />
                            <text
                                textAnchor="middle"
                                dy="4"
                                fill={city.color}
                                fontSize="10"
                                fontWeight="bold"
                            >
                                {city.name.substring(0, 2).toUpperCase()}
                            </text>

                            {/* Tooltip-like label */}
                            <text
                                textAnchor="middle"
                                dy="35"
                                fill={isSelected ? city.color : '#9ca3af'}
                                fontSize="10"
                                fontWeight={isSelected ? 'bold' : 'normal'}
                            >
                                {city.name}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 text-[10px] text-gray-400 bg-gray-900/80 p-2 rounded-lg backdrop-blur-sm">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full border border-blue-400 bg-gray-800"></div>
                    <span>Safe Zone</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span>Red Zone (PvP)</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full border border-red-500 bg-gray-900"></div>
                    <span>Black Market</span>
                </div>
            </div>
        </div>
    );
}
