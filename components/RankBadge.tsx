import React from 'react';
import { Award, Zap, Trophy, Crown, Star, Flame } from 'lucide-react';
import { UserRank } from '../types';

interface RankBadgeProps {
    rank: UserRank;
    showProgress?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export const RankBadge: React.FC<RankBadgeProps> = ({ rank, showProgress = false, size = 'md' }) => {
    const getRankIcon = (level: number) => {
        switch (level) {
            case 1: return <Award className="w-3 h-3" />;
            case 2: return <Zap className="w-3 h-3" />;
            case 3: return <Star className="w-3 h-3" />;
            case 4: return <Trophy className="w-3 h-3" />;
            case 5: return <Flame className="w-3 h-3" />;
            case 6: return <Crown className="w-3 h-3" />;
            default: return <Award className="w-3 h-3" />;
        }
    };

    const sizeClasses = {
        sm: 'text-[10px] px-1.5 py-0.5',
        md: 'text-xs px-2 py-1',
        lg: 'text-sm px-3 py-1.5'
    };

    const progress = rank.xpToNext > 0 ? (rank.xp / (rank.xp + rank.xpToNext)) * 100 : 100;

    return (
        <div className="inline-flex flex-col gap-1">
            <div
                className={`inline-flex items-center gap-1 rounded-sm font-bold uppercase border ${sizeClasses[size]}`}
                style={{
                    backgroundColor: `${rank.color}20`,
                    borderColor: `${rank.color}80`,
                    color: rank.color
                }}
                title={`Nivel ${rank.level}: ${rank.title} (${rank.xp} XP${rank.xpToNext > 0 ? ` - ${rank.xpToNext} XP para siguiente nivel` : ''})`}
            >
                {getRankIcon(rank.level)}
                <span>{rank.icon} {rank.title}</span>
            </div>

            {showProgress && rank.xpToNext > 0 && (
                <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
                    <div
                        className="h-full transition-all duration-300"
                        style={{
                            width: `${progress}%`,
                            backgroundColor: rank.color
                        }}
                    />
                </div>
            )}
        </div>
    );
};
