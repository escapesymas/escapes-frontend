import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { User as UserType } from '../../types';
import { PostCard } from './PostCard';
import { PostComposer } from './PostComposer';

interface SocialFeedProps {
    user: UserType | null;
    onBack: () => void;
    onLoginRequest: () => void;
}

// Temporary Mock Data Interface
interface SocialPost {
    id: number;
    author: {
        id: number;
        name: string;
        avatar: string;
        rank: any;
        timeAgo: string;
    };
    content: {
        text: string;
        image?: string;
    };
    metrics: {
        likes: number;
        comments: number;
        liked: boolean;
    };
}

export const SocialFeed: React.FC<SocialFeedProps> = ({ user, onBack, onLoginRequest }) => {
    const [posts, setPosts] = useState<SocialPost[]>([]);
    const [loading, setLoading] = useState(true);

    // Initial Mock Load
    useEffect(() => {
        // Simulate API fetch delay
        setTimeout(() => {
            setPosts([
                {
                    id: 1,
                    author: {
                        id: 101,
                        name: "Marc Moto",
                        avatar: "",
                        rank: { level: 5, title: 'Pro Racer', color: '#F97316', icon: '🏆' },
                        timeAgo: "Hace 2h"
                    },
                    content: {
                        text: "¡Acabo de instalar el Akrapovic en mi MT-07! 🚀 El sonido es brutal.",
                        image: "https://images.unsplash.com/photo-1568772585407-9366f95166b9?q=80&w=1200&auto=format&fit=crop"
                    },
                    metrics: { likes: 24, comments: 5, liked: false }
                },
                {
                    id: 2,
                    author: {
                        id: 102,
                        name: "Laura Racing",
                        avatar: "",
                        rank: { level: 3, title: 'Entusiasta', color: '#34D399', icon: '🔥' },
                        timeAgo: "Hace 5h"
                    },
                    content: {
                        text: "¿Alguien va al circuito de Jerez este fin de semana? Estaré probando nuevos frenos Brembo.",
                    },
                    metrics: { likes: 12, comments: 8, liked: true }
                }
            ]);
            setLoading(false);
        }, 1000);
    }, []);

    const handleCreatePost = async (text: string, image?: File) => {
        // Optimistic Update
        const newPost: SocialPost = {
            id: Date.now(),
            author: {
                id: user?.id || 0,
                name: user?.firstName || 'Usuario',
                avatar: user?.avatarUrl || '',
                rank: null, // Should fetch real rank
                timeAgo: "Ahora"
            },
            content: {
                text: text,
                image: image ? URL.createObjectURL(image) : undefined
            },
            metrics: { likes: 0, comments: 0, liked: false }
        };

        setPosts([newPost, ...posts]);
        // Here we would call API
    };

    return (
        <div className="min-h-screen bg-black animate-fade-in pb-20 pt-8 relative overflow-hidden">

            {/* Background Ambience */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-3xl"></div>
            </div>

            <div className="container mx-auto px-4 max-w-2xl relative z-10">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6 sticky top-0 bg-black/80 backdrop-blur-md p-4 -mx-4 z-50 border-b border-zinc-800">
                    <button onClick={onBack} className="text-zinc-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold text-white uppercase italic flex items-center gap-2">
                        The Pit Lane <Sparkles className="w-4 h-4 text-cyan-400" />
                    </h1>
                </div>

                {/* Composer */}
                <PostComposer user={user} onPost={handleCreatePost} onLoginRequest={onLoginRequest} />

                {/* Feed */}
                {loading ? (
                    <div className="flex flex-col items-center py-10 gap-2">
                        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Sincronizando Muro...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {posts.map(post => (
                            <PostCard
                                key={post.id}
                                {...post}
                                onLike={() => { }}
                                onComment={() => { }}
                            />
                        ))}

                        <div className="p-8 text-center bg-zinc-900/30 border border-zinc-800/50 rounded-sm mt-8 border-dashed">
                            <p className="text-zinc-500 text-sm">Has llegado al final del pit lane por hoy. 🏁</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
