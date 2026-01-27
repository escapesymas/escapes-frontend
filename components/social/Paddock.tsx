import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    MessageSquare, Clock, Hash, ChevronRight, ArrowLeft, Send,
    User, Loader2, PlusCircle, AlertCircle, CheckCircle,
    Trash2, Heart, Share2, Search
} from 'lucide-react';
import { User as UserType } from '../../types';
import {
    fetchPaddockCategories, fetchPaddockThreads, createPaddockThread,
    fetchPaddockThread, sendReply, toggleLike, deletePaddockThread,
    PaddockCategory, PaddockThread
} from '../../services/socialApi'; // Correct path to services
import { RichTextEditor } from '../RichTextEditor'; // Assuming this is reusable
import { SEO } from '../SEO';
import { RankBadge } from '../RankBadge';

interface PaddockProps {
    user: UserType | null;
    onBack: () => void;
    onLoginRequest: () => void;
}

export const Paddock: React.FC<PaddockProps> = ({ user, onBack, onLoginRequest }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    // View State: 'categories' | 'threads' | 'thread_detail' | 'create_thread'
    const view = searchParams.get('view') || 'categories';
    const categoryId = searchParams.get('cat');
    const threadId = searchParams.get('thread');

    // Data State
    const [categories, setCategories] = useState<PaddockCategory[]>([]);
    const [threads, setThreads] = useState<PaddockThread[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<PaddockCategory | null>(null);
    const [selectedThread, setSelectedThread] = useState<PaddockThread | null>(null);
    const [replies, setReplies] = useState<any[]>([]); // Using any for now or define ThreadReply type

    // UI State
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Inputs
    const [newThreadTitle, setNewThreadTitle] = useState('');
    const [newThreadContent, setNewThreadContent] = useState('');
    const [replyContent, setReplyContent] = useState('');

    // --- EFFECTS ---

    // Load Categories on Mount
    useEffect(() => {
        loadCategories();
    }, []);

    // Sync View with URL
    useEffect(() => {
        const sync = async () => {
            if (view === 'threads' && categoryId) {
                setLoading(true);
                const catId = parseInt(categoryId);
                // Ensure category is selected
                if (!selectedCategory || selectedCategory.id !== catId) {
                    const cats = categories.length ? categories : await fetchPaddockCategories();
                    const found = cats.find(c => c.id === catId);
                    if (found) setSelectedCategory(found);
                }
                const data = await fetchPaddockThreads(catId);
                setThreads(data);
                setLoading(false);
            } else if (view === 'thread_detail' && threadId) {
                setLoading(true);
                const tId = parseInt(threadId);
                const result = await fetchPaddockThread(tId);
                if (result) {
                    setSelectedThread(result.thread);
                    setReplies(result.replies);
                }
                setLoading(false);
            }
        };
        sync();
    }, [view, categoryId, threadId, categories.length]); // Dependencies

    // --- ACTIONS ---

    const loadCategories = async () => {
        setLoading(true);
        const data = await fetchPaddockCategories();
        setCategories(data);
        setLoading(false);
    };

    const navigateTo = (newView: string, params: Record<string, string> = {}) => {
        const newParams = new URLSearchParams();
        newParams.set('view', newView);
        Object.entries(params).forEach(([k, v]) => newParams.set(k, v));
        setSearchParams(newParams);
    };

    const handleCreateThread = async () => {
        if (!user || !user.token) return onLoginRequest();
        if (!newThreadTitle.trim() || !newThreadContent.trim()) {
            setErrorMsg("Por favor completa todos los campos.");
            return;
        }

        setIsSubmitting(true);
        const result = await createPaddockThread(user.token, parseInt(categoryId!), newThreadTitle, newThreadContent);
        setIsSubmitting(false);

        if (result.success) {
            setNewThreadTitle('');
            setNewThreadContent('');
            setSuccessMsg("¡Tema creado con éxito!");
            setTimeout(() => setSuccessMsg(null), 3000);
            navigateTo('threads', { cat: categoryId! });
        } else {
            setErrorMsg(result.error || "Error al crear el tema.");
        }
    };

    const handleReply = async () => {
        if (!user || !user.token) return onLoginRequest();
        if (!selectedThread || !replyContent.trim()) return;

        setIsSubmitting(true);
        const result = await sendReply(user.token, selectedThread.id, replyContent);
        setIsSubmitting(false);

        if (result.success) {
            setReplyContent('');
            // Refresh replies
            const updated = await fetchPaddockThread(selectedThread.id);
            if (updated) setReplies(updated.replies);
            setSuccessMsg("Respuesta publicada +5 XP");
            setTimeout(() => setSuccessMsg(null), 3000);
        } else {
            setErrorMsg(result.error || "Error al responder.");
        }
    };

    const handleDeleteThread = async () => {
        if (!user || !user.token || !selectedThread) return;
        if (!window.confirm("¿Estás seguro de eliminar este tema?")) return;

        const result = await deletePaddockThread(user.token, selectedThread.id);
        if (result.success) {
            navigateTo('threads', { cat: String(selectedCategory?.id) });
        } else {
            setErrorMsg(result.error || "Error al eliminar");
        }
    };

    // --- RENDER HELPERS ---

    const getPageTitle = () => {
        if (view === 'categories') return 'Paddock - Foro';
        if (selectedCategory && view === 'threads') return `${selectedCategory.title} | Paddock`;
        if (selectedThread && view === 'thread_detail') return `${selectedThread.title}`;
        return 'Paddock';
    };

    return (
        <div className="min-h-screen bg-black animate-fade-in pb-20 pt-8">
            <SEO title={getPageTitle()} description="Foro de motos y mecánica" />

            <div className="container mx-auto px-4 max-w-6xl">
                {/* Navigation / Breadcrumbs */}
                <div className="flex items-center gap-2 mb-8 text-sm text-zinc-500 font-medium">
                    <button onClick={() => navigateTo('categories')} className="hover:text-racing-orange transition-colors flex items-center gap-1">
                        PADDOCK
                    </button>
                    {(view === 'threads' || view === 'create_thread' || view === 'thread_detail') && selectedCategory && (
                        <>
                            <ChevronRight className="w-4 h-4" />
                            <button onClick={() => navigateTo('threads', { cat: String(selectedCategory.id) })} className="hover:text-white transition-colors">
                                {selectedCategory.title}
                            </button>
                        </>
                    )}
                    {view === 'thread_detail' && selectedThread && (
                        <>
                            <ChevronRight className="w-4 h-4" />
                            <span className="text-zinc-300 truncate max-w-[200px]">{selectedThread.title}</span>
                        </>
                    )}
                </div>

                {/* Back Button for non-root views */}
                {view !== 'categories' && (
                    <button
                        onClick={() => {
                            if (view === 'thread_detail' || view === 'create_thread') navigateTo('threads', { cat: categoryId! });
                            else navigateTo('categories');
                        }}
                        className="mb-6 flex items-center gap-2 text-zinc-400 hover:text-white text-xs uppercase font-bold transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Volver
                    </button>
                )}

                {/* Alerts */}
                {errorMsg && (
                    <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-lg mb-6 flex items-center gap-3 text-red-200 animate-slide-in">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{errorMsg}</span>
                        <button onClick={() => setErrorMsg(null)} className="ml-auto hover:text-white"><Trash2 className="w-4 h-4" /></button>
                    </div>
                )}
                {successMsg && (
                    <div className="fixed top-24 right-4 z-50 bg-green-500/10 border border-green-500/50 backdrop-blur-md text-green-200 px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-slide-in-right">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="font-bold">{successMsg}</span>
                    </div>
                )}

                {/* --- VIEW: CATEGORIES --- */}
                {view === 'categories' && (
                    <div className="animate-fade-in">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter mb-2">
                                    THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-racing-orange to-red-600">PADDOCK</span>
                                </h1>
                                <p className="text-zinc-400 max-w-xl">
                                    El corazón de la comunidad. Comparte conocimientos, organiza rutas y discute sobre mecánica.
                                </p>
                            </div>
                            {/* Stats or Search bar could go here */}
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-racing-orange animate-spin" /></div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {categories.map(cat => (
                                    <div
                                        key={cat.id}
                                        onClick={() => { setSelectedCategory(cat); navigateTo('threads', { cat: String(cat.id) }); }}
                                        className="group bg-zinc-900/50 border border-zinc-800 hover:border-racing-orange/50 p-6 rounded-xl cursor-pointer transition-all duration-300 hover:bg-zinc-900 relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12 scale-150">
                                            <MessageSquare className="w-32 h-32 text-racing-orange" />
                                        </div>

                                        <div className="relative z-10">
                                            <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center mb-4 group-hover:bg-racing-orange transition-colors shadow-lg shadow-black/50">
                                                <MessageSquare className="w-6 h-6 text-zinc-400 group-hover:text-white" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white uppercase italic mb-2 group-hover:text-racing-orange transition-colors">{cat.title}</h3>
                                            <p className="text-zinc-500 text-sm mb-4 min-h-[40px]">{cat.description}</p>
                                            <div className="flex items-center gap-4 text-xs font-mono text-zinc-600">
                                                <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {cat.count || 0} temas</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* --- VIEW: THREAD LIST --- */}
                {view === 'threads' && (
                    <div className="animate-fade-in space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/30 p-6 rounded-xl border border-zinc-800/50">
                            <div>
                                <h1 className="text-3xl font-bold text-white uppercase italic mb-1">{selectedCategory?.title}</h1>
                                <p className="text-zinc-400 text-sm max-w-2xl">{selectedCategory?.description}</p>
                            </div>
                            <button
                                onClick={() => user ? navigateTo('create_thread', { cat: categoryId! }) : onLoginRequest()}
                                className="bg-racing-orange hover:bg-orange-600 text-white font-bold uppercase text-sm py-3 px-6 rounded-lg shadow-lg shadow-orange-900/20 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <PlusCircle className="w-5 h-5" /> Nuevo Tema
                            </button>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-racing-orange animate-spin" /></div>
                        ) : threads.length === 0 ? (
                            <div className="text-center py-24 bg-zinc-900/30 border border-zinc-800 rounded-xl border-dashed">
                                <MessageSquare className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                                <h3 className="text-white font-bold text-lg mb-2">Está muy tranquilo por aquí...</h3>
                                <p className="text-zinc-500 mb-6">Sé el primero en arrancar motores en esta categoría.</p>
                                <button
                                    onClick={() => user ? navigateTo('create_thread', { cat: categoryId! }) : onLoginRequest()}
                                    className="text-racing-orange hover:text-white font-bold uppercase text-sm transition-colors"
                                >
                                    Crear tema ahora &rarr;
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {threads.map(thread => (
                                    <div
                                        key={thread.id}
                                        onClick={() => { setSelectedThread(thread); navigateTo('thread_detail', { cat: categoryId!, thread: String(thread.id) }); }}
                                        className="group bg-zinc-900 border border-zinc-800 hover:border-racing-orange/50 p-4 rounded-lg cursor-pointer transition-all hover:bg-zinc-800/80 flex items-center gap-4"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                            {thread.author?.avatar ? (
                                                <img src={thread.author.avatar} alt={thread.author.name} className="w-full h-full object-cover rounded-full" />
                                            ) : (
                                                <User className="w-5 h-5 text-zinc-500" />
                                            )}
                                        </div>

                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                {thread.is_pinned && <span className="bg-zinc-700 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Fijado</span>}
                                                <h3 className="text-white font-bold text-base truncate group-hover:text-racing-orange transition-colors">{thread.title}</h3>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-zinc-500">
                                                <span className="text-zinc-400 font-medium">Por {thread.author?.name || 'Anónimo'}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(thread.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 text-zinc-500 text-sm font-mono flex-shrink-0 pr-4">
                                            <div className="flex items-center gap-1" title="Respuestas">
                                                <MessageSquare className="w-4 h-4" /> {thread.metrics?.replies || 0}
                                            </div>
                                            <div className="flex items-center gap-1" title="Me gusta">
                                                <Heart className="w-4 h-4" /> {thread.metrics?.likes || 0}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* --- VIEW: CREATE THREAD --- */}
                {view === 'create_thread' && (
                    <div className="max-w-4xl mx-auto animate-fade-in bg-zinc-900 border border-zinc-800 p-8 rounded-xl shadow-xl">
                        <h2 className="text-2xl font-bold text-white uppercase italic mb-8 border-l-4 border-racing-orange pl-4">Nuevo Tema</h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-zinc-400 text-xs font-bold uppercase mb-2">Título</label>
                                <input
                                    value={newThreadTitle}
                                    onChange={e => setNewThreadTitle(e.target.value)}
                                    placeholder="Ej: Opiniones sobre escape SC Project estruendoso..."
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-white placeholder-zinc-600 focus:border-racing-orange focus:ring-1 focus:ring-racing-orange/50 transition-all outline-none font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-zinc-400 text-xs font-bold uppercase mb-2">Contenido</label>
                                <RichTextEditor
                                    value={newThreadContent}
                                    onChange={setNewThreadContent}
                                    className="bg-zinc-950 min-h-[300px]"
                                    placeholder="Explica tu tema con detalle..."
                                />
                            </div>

                            <button
                                onClick={handleCreateThread}
                                disabled={isSubmitting}
                                className="w-full bg-racing-orange hover:bg-orange-600 text-white font-bold uppercase py-4 rounded-lg shadow-lg shadow-orange-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
                                Publicar Tema
                            </button>
                        </div>
                    </div>
                )}

                {/* --- VIEW: THREAD DETAIL --- */}
                {view === 'thread_detail' && selectedThread && (
                    <div className="max-w-5xl mx-auto animate-fade-in grid grid-cols-1 lg:grid-cols-4 gap-6">

                        {/* Main Content */}
                        <div className="lg:col-span-3 space-y-6">

                            {/* Original Post */}
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                                <div className="p-6 md:p-8 bg-zinc-950/30 border-b border-zinc-800">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-full bg-zinc-800 overflow-hidden border-2 border-zinc-700">
                                            {selectedThread.author.avatar ? (
                                                <img src={selectedThread.author.avatar} alt={selectedThread.author.name} className="w-full h-full object-cover" />
                                            ) : <User className="w-6 h-6 text-zinc-500 m-auto mt-2" />}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold text-lg">{selectedThread.author.name}</h3>
                                            <p className="text-zinc-500 text-xs flex items-center gap-2">
                                                <Clock className="w-3 h-3" /> {new Date(selectedThread.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <h1 className="text-2xl md:text-3xl font-black text-white italic uppercase mb-6 leading-tight">{selectedThread.title}</h1>

                                    <div className="prose prose-invert prose-orange max-w-none text-zinc-300" dangerouslySetInnerHTML={{ __html: selectedThread.content }} />
                                </div>

                                {/* Actions Bar */}
                                <div className="p-4 bg-zinc-950 flex justify-between items-center text-sm">
                                    <div className="flex gap-4">
                                        <button className="flex items-center gap-2 text-zinc-500 hover:text-racing-orange transition-colors font-bold uppercase text-xs">
                                            <Heart className="w-4 h-4" /> {selectedThread.metrics.likes} Likes
                                        </button>
                                        <button className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors font-bold uppercase text-xs">
                                            <Share2 className="w-4 h-4" /> Compartir
                                        </button>
                                    </div>
                                    {user?.id === selectedThread.author.id && (
                                        <button onClick={handleDeleteThread} className="text-red-500 hover:text-red-400 font-bold uppercase text-xs flex items-center gap-1">
                                            <Trash2 className="w-4 h-4" /> Eliminar
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Replies */}
                            <div className="space-y-4">
                                <h3 className="text-white font-bold uppercase text-sm border-b border-zinc-800 pb-2">Respuestas ({replies.length})</h3>
                                {replies.map(reply => (
                                    <div key={reply.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg flex gap-4">
                                        <div className="flex-shrink-0 text-center">
                                            <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden mb-1 mx-auto">
                                                {reply.authorAvatar ? <img src={reply.authorAvatar} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-zinc-500 m-auto mt-2" />}
                                            </div>
                                            {reply.authorRank && <RankBadge rank={reply.authorRank} size="sm" />}
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className="text-white font-bold block text-sm">{reply.author}</span>
                                                    <span className="text-zinc-600 text-xs block">{reply.date}</span>
                                                </div>
                                            </div>
                                            <div className="text-zinc-300 text-sm prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: reply.content }} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Reply Input */}
                            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                                <h3 className="text-white font-bold mb-4">Tu Respuesta</h3>
                                {user ? (
                                    <div className="space-y-4">
                                        <RichTextEditor value={replyContent} onChange={setReplyContent} className="bg-zinc-950" />
                                        <div className="flex justify-end">
                                            <button
                                                onClick={handleReply}
                                                disabled={isSubmitting}
                                                className="bg-racing-orange text-white font-bold uppercase px-6 py-2 rounded-lg flex items-center gap-2"
                                            >
                                                {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4" />}
                                                Responder
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-6 bg-zinc-950/50 rounded-lg">
                                        <p className="text-zinc-500 mb-2">Debes estar identificado para responder.</p>
                                        <button onClick={onLoginRequest} className="text-racing-orange font-bold uppercase">Iniciar Sesión</button>
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                                <h4 className="text-white font-bold uppercase italic text-sm mb-4">Reglas del Paddock</h4>
                                <ul className="space-y-3 text-sm text-zinc-400">
                                    <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> Respeto mutuo en pista.</li>
                                    <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> No spam ni publicidad.</li>
                                    <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> Usa el buscador antes de postear.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
