import React from 'react';

export const ProductSkeleton = () => {
    return (
        <div className="bg-racing-carbon border border-zinc-900 rounded-sm overflow-hidden flex flex-col h-full animate-pulse">
            <div className="aspect-square bg-zinc-900 w-full" />
            <div className="p-4 flex flex-col flex-grow">
                <div className="h-3 bg-zinc-900 rounded w-1/3 mb-2" />
                <div className="h-4 bg-zinc-900 rounded w-3/4 mb-4" />

                <div className="mt-auto pt-4 flex items-end justify-between border-t border-zinc-900">
                    <div className="flex flex-col gap-1 w-1/2">
                        <div className="h-3 bg-zinc-900 rounded w-1/2" />
                        <div className="h-6 bg-zinc-900 rounded w-3/4" />
                    </div>
                    <div className="w-10 h-10 bg-zinc-900 rounded-sm" />
                </div>
            </div>
        </div>
    );
};
