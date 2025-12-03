import React, { useState } from 'react';

interface TooltipProps {
    content: string;
    children: React.ReactNode;
}

export default function Tooltip({ content, children }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className="absolute z-50 w-64 p-2 mt-2 -ml-2 text-xs text-white bg-gray-900 rounded-lg shadow-xl border border-gray-700 bottom-full mb-2 left-1/2 transform -translate-x-1/2">
                    {content}
                    <div className="absolute w-2 h-2 bg-gray-900 border-r border-b border-gray-700 transform rotate-45 left-1/2 -ml-1 -bottom-1"></div>
                </div>
            )}
        </div>
    );
}
