import { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
}

export default function Card({ children, className = '', hover = true }: CardProps) {
    return (
        <div className={`glass-card p-6 ${hover ? '' : 'hover:border-gray-800/50 hover:shadow-xl'} ${className}`}>
            {children}
        </div>
    );
}
