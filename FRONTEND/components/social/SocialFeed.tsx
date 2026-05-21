import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { User as UserType } from '../../types';
import { PostCard } from './PostCard';
import { PostComposer } from './PostComposer';
import { fetchSocialFeed, createSocialPost, toggleLike, sendReply, SocialPostType } from '../../services/socialApi';
import { uploadFile } from '../../services/apiService';

interface SocialFeedProps {
    user: UserType | null;
    onBack: () => void;
    onLoginRequest: () => void;
}

export const SocialFeed: React.FC<SocialFeedProps> = ({ user, onBack, onLoginRequest }) => {
    const [posts, setPosts] = useState<SocialPostType[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadFeed = async (p = 1) => {
        try {
            const data = await fetchSocialFeed(p);
            if (data.length === 0) {
                setHasMore(false);
            } else {
                setPosts(prev => p === 1 ? data : [...prev, ...data]);
            }
        } catch (err) {
            console.error("Feed error:", err);
            setError("Error al cargar el muro.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFeed(1);
    }, []);

    const handleCreatePost = async (text: string, image?: File) => {
        if (!user || user.id === 0 || !user.token) {
            onLoginRequest();
            return;
        }

        try {
            let mediaIds: number[] = [];

            // Upload Image first if exists
            if (image) {
                try {
                    const uploadResult = await uploadFile(image);
                    mediaIds.push(uploadResult.id);
                } catch (e) {
                    console.error("Error subiendo imagen", e);
                    alert("Error al subir la imagen. Inténtalo de nuevo.");
                    return;
                }
            }

            const result = await createSocialPost(user.token, text, mediaIds);

            if (result.success && result.post) {
                // Prepend new post
                setPosts([result.post, ...posts]);
            } else {
                alert(result.error || "No se pudo publicar.");
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión.");
        }
    };

    const handleLike = async (post: SocialPostType) => {
        if (!user || !user.token) {
            onLoginRequest();
            return;
        }
        // Optimistic update handled in PostCard mostly, but we trigger API here
        await toggleLike(user.token, 'social_post', post.id);
    };

    const handleComment = async (postId: number, text: string) => {
        if (!user || !user.token) {
            onLoginRequest();
            return;
        }
        const result = await sendReply(user.token, postId, text);
        if (result.success) {
            // Update comments count locally
            setPosts(prev => prev.map(p =>
                p.id === postId
                    ? { ...p, metrics: { ...p.metrics, comments: p.metrics.comments + 1 } }
                    : p
            ));
        }
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

                {/* Error State */}
                {error && (
                    <div className="bg-red-900/20 border border-red-800 p-4 rounded-sm mb-6 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="text-red-200 text-sm">{error}</span>
                    </div>
                )}

                {/* Feed */}
                {loading && page === 1 ? (
                    <div className="flex flex-col items-center py-10 gap-2">
                        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Sincronizando Muro...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {posts.filter(p => p && p.author).map(post => (
                            <PostCard
                                key={post.id}
                                id={post.id}
                                author={post.author}
                                content={post.content || { text: '' }}
                                metrics={post.metrics || { likes: 0, comments: 0, liked: false }}
                                onLike={() => handleLike(post)}
                                onCommentSubmit={(text) => handleComment(post.id, text)}
                            />
                        ))}

                        {!loading && hasMore && (
                            <div className="py-4 text-center">
                                <button
                                    onClick={() => {
                                        const nextPage = page + 1;
                                        setPage(nextPage);
                                        loadFeed(nextPage);
                                    }}
                                    className="text-racing-orange hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
                                >
                                    Cargar más actividad...
                                </button>
                            </div>
                        )}

                        {!hasMore && posts.length > 0 && (
                            <div className="p-8 text-center bg-zinc-900/30 border border-zinc-800/50 rounded-sm mt-8 border-dashed">
                                <p className="text-zinc-500 text-sm">Has llegado al final del pit lane por hoy. 🏁</p>
                            </div>
                        )}

                        {!loading && posts.length === 0 && !error && (
                            <div className="p-12 text-center">
                                <p className="text-zinc-400 font-bold mb-2">Aún no hay actividad en el muro.</p>
                                <p className="text-zinc-600 text-sm">Sé el primero en publicar algo.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
