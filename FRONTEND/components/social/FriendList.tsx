import React, { useState, useEffect } from 'react';
import { User, UserPlus, UserCheck, UserMinus, Search, Loader2 } from 'lucide-react';
import { User as UserType } from '../../types';
import { manageFriendship, searchUsers } from '../../services/socialApi';
import { Link } from 'react-router-dom';

interface FriendListProps {
    currentUser: UserType | null;
    friends: { id: number; name: string; avatar: string }[];
    onFriendAction: () => void; // Callback to reload parent
}

export const FriendList: React.FC<FriendListProps> = ({ currentUser, friends, onFriendAction }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ id: number; name: string; avatar: string }[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        const results = await searchUsers(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
    };

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative">
                <input
                    type="text"
                    placeholder="Buscar pilotos por nombre..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-sm py-3 pl-10 pr-4 focus:border-racing-orange focus:outline-none"
                />
                <Search className="absolute left-3 top-3.5 w-5 h-5 text-zinc-500" />
            </form>

            {/* Search Results */}
            {searchResults.length > 0 && (
                <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-sm animate-fade-in mb-6">
                    <h3 className="text-zinc-500 text-xs font-bold uppercase mb-3">Resultados de búsqueda</h3>
                    <div className="space-y-2">
                        {searchResults.map(user => (
                            <Link key={user.id} to={`/paddock/user/${user.id}`} className="flex items-center justify-between p-2 hover:bg-zinc-800 rounded-sm transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden">
                                        {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <User className="w-full h-full p-1.5 text-zinc-400" />}
                                    </div>
                                    <span className="text-white font-bold">{user.name}</span>
                                </div>
                                <UserPlus className="w-4 h-4 text-zinc-500 hover:text-racing-orange" />
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Friends Grid */}
            {friends.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {friends.map(friend => (
                        <Link key={friend.id} to={`/paddock/user/${friend.id}`} className="bg-zinc-900 border border-zinc-800 p-4 rounded-sm flex items-center gap-3 hover:border-zinc-600 transition-colors group">
                            <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                {friend.avatar ? <img src={friend.avatar} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-zinc-500" />}
                            </div>
                            <span className="text-white font-bold text-sm truncate group-hover:text-racing-orange transition-colors">{friend.name}</span>
                        </Link>
                    ))}
                </div>
            ) : (
                !searchResults.length && (
                    <div className="text-center py-10 border border-dashed border-zinc-800 rounded-sm">
                        <p className="text-zinc-500 text-sm">Tu lista de pits está vacía. ¡Busca otros pilotos!</p>
                    </div>
                )
            )}
        </div>
    );
};
