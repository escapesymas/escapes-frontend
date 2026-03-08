import React from 'react';
import { UserRank } from '../types';

interface RankBadgeProps {
    rank?: UserRank;
    size?: 'sm' | 'md' | 'lg';
    showTitle?: boolean;
}

export const RankBadge: React.FC<RankBadgeProps> = ({ rank, size = 'md', showTitle = true }) => {
    if (!rank) return null;

    const sizeClasses = {
        sm: 'text-xs p-1',
        md: 'text-sm px-2 py-1',
        lg: 'text-base px-3 py-1.5'
    };

    const iconSizes = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-lg'
    };

    return (
        <div
            className={`inline-flex items-center gap-1.5 rounded-sm font-bold uppercase tracking-wider border ${sizeClasses[size]}`}
            style={{
                backgroundColor: `${rank.color}20`,
                color: rank.color,
                borderColor: `${rank.color}40`
            }}
        >
            <span className={iconSizes[size]}>{rank.icon}</span>
            {showTitle && <span>{rank.title}</span>}
        </div>
    );
};
