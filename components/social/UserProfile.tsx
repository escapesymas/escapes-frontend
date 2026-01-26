import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, UserPlus, UserCheck, Loader2, MessageSquare, Heart, Users, MapPin, Grid, Camera } from 'lucide-react';
import { User as UserType } from '../../types';
import { getUserProfile, manageFriendship, UserProfileFull } from '../../services/socialApi';
import { PostCard } from './PostCard';
import { RankBadge } from '../RankBadge';
import { Link } from 'react-router-dom';

interface UserProfileProps {
    currentUser: UserType | null;
    targetUserId: number; // For now passed from parent or route param
    onBack: () => void;
    onLoginRequest: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ currentUser, targetUserId, onBack, onLoginRequest }) => {
    const [profile, setProfile] = useState<UserProfileFull | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'activity' | 'friends'>('activity');
    const [friendshipLoading, setFriendshipLoading] = useState(false);

    useEffect(() => {
        loadProfile();
    }, [targetUserId, currentUser?.token]);

    const loadProfile = async () => {
        setLoading(true);
        const data = await getUserProfile(currentUser?.token || null, targetUserId);
        if (data) setProfile(data);
        setLoading(false);
    };

    const handleFriendAction = async (action: 'add' | 'accept' | 'remove') => {
        if (!currentUser || !currentUser.token) return onLoginRequest();

        setFriendshipLoading(true);
        // Logic mapping UI action to API action
        const apiAction = action;
        const res = await manageFriendship(currentUser.token, apiAction, targetUserId);
        setFriendshipLoading(false);

        if (res.success && profile) {
            // Optimistic update
            let newStatus = profile.friendship_status;
            if (action === 'add') newStatus = 'pending';
            if (action === 'accept') newStatus = 'accepted';
            if (action === 'remove') newStatus = 'none';

            setProfile({ ...profile, friendship_status: newStatus as any });
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-racing-orange animate-spin" /></div>;
    if (!profile) return <div className="p-10 text-center text-zinc-500">Perfil no encontrado.</div>;

    const isMe = profile.friendship_status === 'self';

    return (
        <div className="min-h-screen bg-black animate-fade-in pb-20 relative">
            {/* Cover Image */}
            <div className="h-48 md:h-64 bg-zinc-900 w-full relative overflow-hidden">
                {profile.cover ? (
                    <img src={profile.cover} alt="Cover" className="w-full h-full object-cover opacity-60" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-zinc-900 to-zinc-800 flex items-center justify-center">
                        <Camera className="text-zinc-700 w-12 h-12" />
                    </div>
                )}
                <button onClick={onBack} className="absolute top-4 left-4 bg-black/50 p-2 rounded-full text-white hover:bg-black/80 transition-colors backdrop-blur-sm">
                    <ArrowLeft className="w-5 h-5" />
                </button>
            </div>

            {/* Profile Info Header */}
            <div className="container mx-auto px-4 relative -mt-16 z-10">
                <div className="flex flex-col items-center md:items-start md:flex-row gap-6 mb-8">
                    {/* Avatar */}
                    <div className="w-32 h-32 rounded-full border-4 border-black bg-zinc-800 flex items-center justify-center overflow-hidden shadow-2xl relative">
                        {profile.avatar ? <img src={profile.avatar} className="w-full h-full object-cover" /> : <User className="w-12 h-12 text-zinc-500" />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left pt-2 md:pt-16">
                        <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold text-white uppercase italic tracking-wide">{profile.name}</h1>
                            {profile.rank && <RankBadge rank={profile.rank} />}
                        </div>
                        {profile.bio && <p className="text-zinc-400 text-sm max-w-lg mb-4">{profile.bio}</p>}

                        {/* Stats */}
                        <div className="flex items-center justify-center md:justify-start gap-6 text-sm mb-6 bg-zinc-900/50 inline-flex p-3 rounded-sm border border-zinc-800/50 backdrop-blur-sm">
                            <div className="text-center md:text-left">
                                <span className="block font-bold text-white text-lg">{profile.stats.posts}</span>
                                <span className="text-zinc-500 text-xs uppercase font-bold">Posts</span>
                            </div>
                            <div className="w-px h-8 bg-zinc-800"></div>
                            <div className="text-center md:text-left">
                                <span className="block font-bold text-white text-lg">{profile.stats.friends}</span>
                                <span className="text-zinc-500 text-xs uppercase font-bold">Amigos</span>
                            </div>
                            <div className="w-px h-8 bg-zinc-800"></div>
                            <div className="text-center md:text-left">
                                <span className="block font-bold text-white text-lg">{profile.stats.likes_received}</span>
                                <span className="text-zinc-500 text-xs uppercase font-bold">Likes</span>
                            </div>
                        </div>

                        {/* Main Action Button */}
                        <div className="flex justify-center md:justify-start gap-4">
                            {isMe ? (
                                <button className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-sm font-bold uppercase text-xs transition-colors">
                                    Editar Perfil
                                </button>
                            ) : (
                                <>
                                    {profile.friendship_status === 'none' && (
                                        <button
                                            onClick={() => handleFriendAction('add')}
                                            disabled={friendshipLoading}
                                            className="bg-racing-orange hover:bg-orange-600 text-white px-6 py-2 rounded-sm font-bold uppercase text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
                                        >
                                            {friendshipLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                            Agregar a Pits
                                        </button>
                                    )}
                                    {profile.friendship_status === 'pending' && (
                                        <button disabled className="bg-zinc-800 text-zinc-400 px-6 py-2 rounded-sm font-bold uppercase text-xs flex items-center gap-2 cursor-default border border-zinc-700">
                                            <Loader2 className="w-4 h-4" /> Solicitud Enviada
                                        </button>
                                    )}
                                    {profile.friendship_status === 'accepted' && (
                                        <div className="flex gap-2">
                                            <button className="bg-green-900/30 text-green-400 border border-green-800 px-6 py-2 rounded-sm font-bold uppercase text-xs flex items-center gap-2 cursor-default">
                                                <UserCheck className="w-4 h-4" /> Amigos
                                            </button>
                                            {/* Maybe Message Button here */}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-zinc-800 mb-6">
                    <button
                        onClick={() => setActiveTab('activity')}
                        className={`px-6 py-4 text-sm font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'activity' ? 'border-racing-orange text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Actividad
                    </button>
                    <button
                        onClick={() => setActiveTab('friends')}
                        className={`px-6 py-4 text-sm font-bold uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'friends' ? 'border-racing-orange text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Amigos
                    </button>
                </div>

                {/* Content */}
                <div className="max-w-2xl">
                    {activeTab === 'activity' && (
                        <div className="space-y-4">
                            {profile.posts.length > 0 ? (
                                profile.posts.map(post => (
                                    <PostCard
                                        key={post.id}
                                        {...post}
                                        // Reduced props for profile view simplicity/mock
                                        onLike={() => { }}
                                        onComment={() => { }}
                                    />
                                ))
                            ) : (
                                <div className="p-8 text-center bg-zinc-900/30 border border-zinc-800 rounded-sm">
                                    <p className="text-zinc-500 text-sm">Aún no hay actividad reciente.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'friends' && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {profile.friends.length > 0 ? (
                                profile.friends.map(friend => (
                                    <Link key={friend.id} to={`/paddock/user/${friend.id}`} className="bg-zinc-900 border border-zinc-800 p-4 rounded-sm flex items-center gap-3 hover:border-zinc-600 transition-colors group">
                                        <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {friend.avatar ? <img src={friend.avatar} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-zinc-500" />}
                                        </div>
                                        <span className="text-white font-bold text-sm truncate group-hover:text-racing-orange transition-colors">{friend.name}</span>
                                    </Link>
                                ))
                            ) : (
                                <div className="col-span-full p-8 text-center text-zinc-500 text-sm">
                                    Este piloto rueda solo por ahora.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
