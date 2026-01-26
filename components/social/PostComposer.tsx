import React, { useState, useRef } from 'react';
import { Image, Send, User, Loader2, X } from 'lucide-react';
import { User as UserType } from '../../types';

interface PostComposerProps {
    user: UserType | null;
    onPost: (text: string, image?: File) => Promise<void>;
    onLoginRequest: () => void;
}

export const PostComposer: React.FC<PostComposerProps> = ({ user, onPost, onLoginRequest }) => {
    const [text, setText] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImage(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async () => {
        if ((!text.trim() && !image) || loading) return;

        setLoading(true);
        try {
            await onPost(text, image || undefined);
            setText('');
            removeImage();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-sm mb-6 text-center backdrop-blur-sm">
                <p className="text-zinc-400 text-sm mb-2">Inicia sesión para compartir tu garaje.</p>
                <button onClick={onLoginRequest} className="text-racing-orange font-bold text-xs uppercase hover:underline">
                    Conectar Piloto
                </button>
            </div>
        );
    }

    return (
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-sm mb-6 shadow-xl relative z-20">
            <div className="flex gap-4">
                <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden border border-zinc-700 flex-shrink-0">
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.firstName} className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-5 h-5 text-zinc-500" />
                    )}
                </div>

                <div className="flex-1">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={`¿Qué hay de nuevo, ${user.firstName}?`}
                        className="w-full bg-zinc-950/50 border border-zinc-700/50 text-white rounded-sm p-3 focus:outline-none focus:border-racing-orange min-h-[80px] text-sm resize-none mb-2"
                    />

                    {preview && (
                        <div className="relative mb-3 inline-block">
                            <img src={preview} alt="Preview" className="h-32 rounded-sm border border-zinc-700 object-cover" />
                            <button
                                onClick={removeImage}
                                className="absolute -top-2 -right-2 bg-black text-white rounded-full p-1 border border-zinc-700 hover:bg-red-500 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}

                    <div className="flex justify-between items-center border-t border-zinc-800 pt-3">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-zinc-500 hover:text-cyan-400 transition-colors flex items-center gap-2 text-xs font-bold uppercase"
                        >
                            <Image className="w-4 h-4" />
                            <span className="hidden md:inline">Foto</span>
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageSelect}
                        />

                        <button
                            onClick={handleSubmit}
                            disabled={loading || (!text.trim() && !image)}
                            className="bg-racing-orange hover:bg-orange-600 text-white font-bold uppercase text-xs py-2 px-6 rounded-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Publicar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
