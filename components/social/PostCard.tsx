import React, { useState } from 'react';
import { Heart, MessageSquare, Share2, MoreHorizontal, User } from 'lucide-react';
import { UserRank } from '../../types';
import { RankBadge } from '../RankBadge';

interface PostCardProps {
    id: number;
    author: {
        name: string;
        avatar: string;
        rank?: UserRank;
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
    onLike: () => void;
    onCommentSubmit: (text: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ id, author, content, metrics, onLike, onCommentSubmit }) => {
    const [isLiked, setIsLiked] = useState(metrics.liked);
    const [likesCount, setLikesCount] = useState(metrics.likes);
    const [commentText, setCommentText] = useState('');
    const [showComments, setShowComments] = useState(false);

    const handleLocalLike = () => {
        setIsLiked(!isLiked);
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
        onLike();
    };

    return (
        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-sm mb-4 animate-fade-in group hover:border-zinc-700 transition-colors">
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden border border-zinc-700">
                        {author?.avatar ? (
                            <img
                                src={author.avatar.startsWith('http') ? `/api/proxy?media=${author.avatar.replace('https://backendescapes.com/', '')}` : author.avatar}
                                alt={author.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <User className="w-5 h-5 text-zinc-500" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-sm tracking-wide">{author?.name || 'Anónimo'}</span>
                            {author?.rank && <RankBadge rank={author.rank} size="sm" />}
                        </div>
                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{author?.timeAgo}</span>
                    </div>
                </div>
                <button className="text-zinc-500 hover:text-white transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            <div className="px-4 pb-2">
                {content?.text && <p className="text-zinc-300 text-sm mb-3 leading-relaxed whitespace-pre-wrap">{content.text}</p>}
            </div>

            {content?.image && (
                <div className="w-full aspect-video bg-black overflow-hidden relative">
                    <img
                        src={content.image.startsWith('http') ? `/api/proxy?media=${content.image.replace('https://backendescapes.com/', '')}` : content.image}
                        alt="Post content"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                    />
                </div>
            )}

            {/* Actions */}
            <div className="p-3 flex items-center justify-between border-t border-zinc-800 mt-2">
                <div className="flex items-center gap-6">
                    <button
                        onClick={handleLocalLike}
                        className={`flex items-center gap-2 text-sm font-bold transition-all active:scale-90 ${isLiked ? 'text-rose-500' : 'text-zinc-500 hover:text-rose-500'}`}
                    >
                        <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-500' : ''}`} />
                        <span>{likesCount}</span>
                    </button>

                    <button
                        onClick={() => setShowComments(!showComments)}
                        className={`flex items-center gap-2 text-sm font-bold transition-colors ${showComments ? 'text-racing-orange' : 'text-zinc-500 hover:text-white'}`}
                    >
                        <MessageSquare className="w-5 h-5" />
                        <span>{metrics.comments}</span>
                    </button>
                </div>

                <button className="text-zinc-500 hover:text-cyan-400 transition-colors">
                    <Share2 className="w-5 h-5" />
                </button>
            </div>

            {/* Comment Section */}
            {showComments && (
                <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/50">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Escribe un comentario..."
                            className="flex-grow bg-zinc-800 border border-zinc-700 rounded-sm px-3 py-1.5 text-xs text-white focus:border-racing-orange focus:outline-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && commentText.trim()) {
                                    onCommentSubmit(commentText);
                                    setCommentText('');
                                }
                            }}
                        />
                        <button
                            onClick={() => {
                                if (commentText.trim()) {
                                    onCommentSubmit(commentText);
                                    setCommentText('');
                                }
                            }}
                            className="bg-racing-orange hover:bg-racing-red text-white px-3 py-1 rounded-sm font-bold text-[10px] uppercase transition-colors"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
