import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    MessageSquare, Clock, Hash, ChevronRight, ArrowLeft, Send,
    User, Loader2, PlusCircle, AlertCircle, CheckCircle,
    Trash2, Heart, Share2, Search, RefreshCw, Lock
} from 'lucide-react';
import { User as UserType } from '../../types';
import {
    fetchPaddockCategories, fetchPaddockThreads, createPaddockThread,
    fetchPaddockThread, sendReply, toggleLike, deletePaddockThread,
    PaddockCategory, PaddockThread, SPAIN_PROVINCES
} from '../../services/socialApi'; // Correct path to services
import { RichTextEditor } from '../RichTextEditor'; // Assuming this is reusable
import { SEO } from '../SEO';
import { RankBadge } from '../RankBadge';
import { autoLinkHtml, registerDynamicKeywords } from '../../utils/autoLinker';
import { fetchProducts, fetchProductsByIds } from '../../services/apiService';
import { ProductCard } from '../ProductCard';

const CategoryFolder: React.FC<{ 
    category: PaddockCategory; 
    onSelect: (c: PaddockCategory) => void;
    depth?: number;
}> = ({ category, onSelect, depth = 0 }) => {
    const isTop = depth === 0;
    
    if (isTop) {
        return (
            <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm hover:border-racing-orange/30 transition-all flex flex-col h-full">
                <div 
                    className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center group cursor-pointer bg-gradient-to-br from-white to-gray-50 dark:from-zinc-900 dark:to-black/40" 
                    onClick={() => onSelect(category)}
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-400 group-hover:text-racing-orange transition-colors">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase italic text-zinc-900 dark:text-white group-hover:text-racing-orange transition-colors tracking-tight">
                                {category.title}
                            </h3>
                            <p className="text-zinc-500 text-xs mt-1 font-medium">{category.description}</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-racing-orange transition-all transform group-hover:translate-x-1" />
                </div>
                
                {category.children && category.children.length > 0 && (
                    <div className="p-2 space-y-1 bg-gray-50/30 dark:bg-black/10 flex-grow">
                        {category.children.map(child => (
                            <CategoryFolder key={child.id} category={child} onSelect={onSelect} depth={depth + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="mb-1">
            <button 
                onClick={() => onSelect(category)}
                className="w-full flex items-center justify-between p-3 hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all text-left group border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 shadow-sm hover:shadow-md"
            >
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-zinc-300 dark:bg-zinc-700 rounded-full group-hover:bg-racing-orange transition-colors"></div>
                    <div>
                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-racing-orange transition-colors uppercase italic tracking-wide">
                            {category.title}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-zinc-400 font-medium">{category.description}</span>
                            <span className="text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter">
                                {category.count} hilos
                            </span>
                        </div>
                    </div>
                </div>
                <PlusCircle className="w-4 h-4 text-zinc-300 group-hover:text-racing-orange group-hover:rotate-90 transition-all opacity-0 group-hover:opacity-100" />
            </button>
            
            {category.children && category.children.length > 0 && (
                <div className="ml-5 pl-4 border-l border-zinc-200 dark:border-zinc-800 mt-1 mb-2 space-y-1">
                    {category.children.map(subChild => (
                        <CategoryFolder key={subChild.id} category={subChild} onSelect={onSelect} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

interface PaddockProps {
    user: UserType | null;
    onBack: () => void;
    onLoginRequest: () => void;
    onAddToCart?: (product: any) => void;
}

export const Paddock: React.FC<PaddockProps> = ({ user, onBack, onLoginRequest, onAddToCart }) => {
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
    const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Product Tagging States
    const [isTagModalOpen, setIsTagModalOpen] = useState(false);
    const [tagTarget, setTagTarget] = useState<'thread' | 'reply'>('thread');
    const [tagSearchQuery, setTagSearchQuery] = useState('');
    const [tagSearchResults, setTagSearchResults] = useState<any[]>([]);
    const [loadingTagSearch, setLoadingTagSearch] = useState(false);
    const [taggedProductsMap, setTaggedProductsMap] = useState<Record<number, any>>({});

    // Inputs
    const [newThreadTitle, setNewThreadTitle] = useState('');
    const [newThreadContent, setNewThreadContent] = useState('');
    const [replyContent, setReplyContent] = useState('');

    // Contextual matching engine for recommending catalog products inside threads
    const loadRecommendedProducts = async () => {
        if (!selectedThread) return;
        setLoadingProducts(true);
        try {
            // Fetch catalog products page 1
            const result = await fetchProducts("", undefined, 1, 30);
            const allProducts = result.products || [];
            
            // Scan thread title and content for keywords to filter
            const textToScan = `${selectedThread.title || ''} ${selectedThread.content || ''}`.toLowerCase();
            
            // Filter products whose brand, category name, title or tags matches
            const matched = allProducts.filter(p => {
                if (!p) return false;
                const titleWords = p.title?.toLowerCase().split(/\s+/) || [];
                const titleMatch = titleWords.some(word => word.length > 3 && textToScan.includes(word));
                const brandMatch = p.brand && textToScan.includes(p.brand.toLowerCase());
                const categoryMatch = p.category && textToScan.includes(p.category.toLowerCase());
                return titleMatch || brandMatch || categoryMatch;
            });
            
            // Limit to 3 recommended products
            setRecommendedProducts(matched.slice(0, 3));
        } catch (err) {
            console.error("Error loading forum products:", err);
        } finally {
            setLoadingProducts(false);
        }
    };

    // Contextual product loader hook
    useEffect(() => {
        if (view === 'thread_detail' && selectedThread) {
            loadRecommendedProducts();
        } else {
            setRecommendedProducts([]);
        }
    }, [view, selectedThread?.id]);

    // Scans thread content and replies for tagged shortcodes and resolves them from WooCommerce catalog
    const loadTaggedProducts = async (thread: PaddockThread, threadReplies: any[]) => {
        if (!thread) return;
        const ids = new Set<number>();
        const productRegex = /\[product-(\d+)\]/g;
        
        let match;
        // Scan thread content
        if (thread.content) {
            while ((match = productRegex.exec(thread.content)) !== null) {
                ids.add(parseInt(match[1]));
            }
        }
        
        // Scan replies
        threadReplies.forEach(reply => {
            if (reply.content) {
                // reset regex index
                productRegex.lastIndex = 0;
                while ((match = productRegex.exec(reply.content)) !== null) {
                    ids.add(parseInt(match[1]));
                }
            }
        });
        
        if (ids.size === 0) {
            setTaggedProductsMap({});
            return;
        }
        
        try {
            const productIdsArray = Array.from(ids);
            const fetched = await fetchProductsByIds(productIdsArray);
            
            const map: Record<number, any> = {};
            fetched.forEach(p => {
                if (p) map[p.id] = p;
            });
            setTaggedProductsMap(map);
        } catch (err) {
            console.error("Error loading tagged products:", err);
        }
    };

    // Live search catalog for tagging modal
    const handleTagSearch = async (query: string) => {
        setTagSearchQuery(query);
        if (query.trim().length < 2) {
            setTagSearchResults([]);
            return;
        }
        setLoadingTagSearch(true);
        try {
            const res = await fetchProducts(query, undefined, 1, 10);
            setTagSearchResults(res.products || []);
        } catch (err) {
            console.error("Error searching products to tag:", err);
        } finally {
            setLoadingTagSearch(false);
        }
    };

    // Inserts the selected shortcode token into the corresponding editor input
    const handleSelectTagProduct = (product: any) => {
        if (!product) return;
        const token = ` [product-${product.id}] `;
        if (tagTarget === 'thread') {
            setNewThreadContent(prev => prev + token);
        } else {
            setReplyContent(prev => prev + token);
        }
        setIsTagModalOpen(false);
        setTagSearchQuery('');
        setTagSearchResults([]);
    };

    const openTagModal = (target: 'thread' | 'reply') => {
        setTagTarget(target);
        setIsTagModalOpen(true);
    };

    // --- EFFECTS ---

    // Load Categories and SEO Keywords on Mount
    useEffect(() => {
        loadCategories();
        
        const loadSeoKeywords = async () => {
            try {
                const res = await fetch('/api/seo/autolinks');
                if (res.ok) {
                    const mapping = await res.json();
                    const list = Object.entries(mapping).map(([keyword, url]: any) => ({ keyword, url, active: 1 }));
                    registerDynamicKeywords(list);
                }
            } catch (e) {
                console.error("Error al cargar SEO keywords dinámicos:", e);
            }
        };
        loadSeoKeywords();
    }, []);

    const findCategoryById = (cats: PaddockCategory[], id: number): PaddockCategory | undefined => {
        for (const cat of cats) {
            if (cat.id === id) return cat;
            if (cat.children) {
                const found = findCategoryById(cat.children, id);
                if (found) return found;
            }
        }
        return undefined;
    };

    const handleRefreshSync = async () => {
        if (view === 'threads' && categoryId) {
            setLoading(true);
            const catId = parseInt(categoryId);
            // Ensure category is selected
            if (!selectedCategory || selectedCategory.id !== catId) {
                const cats = categories.length ? categories : await fetchPaddockCategories();
                const found = findCategoryById(cats, catId);
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
                loadTaggedProducts(result.thread, result.replies);
            }
            setLoading(false);
        }
    };

    // Sync View with URL
    useEffect(() => {
        handleRefreshSync();
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
        if (!user || !user.token) {
            onLoginRequest();
            return;
        }
        if (!selectedCategory || !newThreadTitle || !newThreadContent) return;

        setIsSubmitting(true);
        const result = await createPaddockThread(user.token, selectedCategory.id, newThreadTitle, newThreadContent);
        setIsSubmitting(false);

        if (result.success) {
            setNewThreadTitle('');
            setNewThreadContent('');
            setSuccessMsg("¡Hilo publicado con éxito!");
            navigateTo('thread_detail', { cat: String(selectedCategory.id), thread: String(result.id) });
            setTimeout(() => setSuccessMsg(null), 3000);
        } else {
            setErrorMsg(result.error || "Error al publicar");
        }
    };

    const handleReply = async () => {
        if (!user || !user.token) {
            onLoginRequest();
            return;
        }
        if (!selectedThread || !replyContent) return;

        setIsSubmitting(true);
        const result = await sendReply(user.token, selectedThread.id, replyContent);
        setIsSubmitting(false);

        if (result.success) {
            setReplyContent('');
            const updated = await fetchPaddockThread(selectedThread.id);
            if (updated) {
                setReplies(updated.replies);
                loadTaggedProducts(selectedThread, updated.replies);
            }
            setSuccessMsg("Respuesta enviada");
            setTimeout(() => setSuccessMsg(null), 3000);
        } else {
            setErrorMsg(result.error || "Error al responder");
        }
    };

    const handleLike = async (type: 'social_post' | 'paddock_thread', id: number) => {
        if (!user || !user.token) {
            onLoginRequest();
            return;
        }
        const res = await toggleLike(user.token, type, id);
        if (res.success && type === 'paddock_thread' && selectedThread) {
            setSelectedThread({
                ...selectedThread,
                metrics: { ...selectedThread.metrics, likes: res.liked ? selectedThread.metrics.likes + 1 : selectedThread.metrics.likes - 1 }
            });
        }
    };

    const handleDeleteThread = async () => {
        if (!user || !user.token || !selectedThread) return;
        if (!window.confirm("¿Seguro que quieres eliminar este hilo?")) return;

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
        if (selectedCategory && view === 'threads') return `${selectedCategory?.title || 'Categoría'} | Paddock`;
        if (selectedThread && view === 'thread_detail') return `${selectedThread?.title || 'Tema'}`;
        return 'Paddock';
    };

    // Build JSON-LD structured data dynamically for SEO
    const getJsonLd = () => {
        const baseUrl = 'https://escapesymas.com';
        
        if (view === 'categories') {
            return [
                {
                    "@context": "https://schema.org",
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                        {
                            "@type": "ListItem",
                            "position": 1,
                            "name": "Inicio",
                            "item": `${baseUrl}/`
                        },
                        {
                            "@type": "ListItem",
                            "position": 2,
                            "name": "Paddock Foro",
                            "item": `${baseUrl}/paddock`
                        }
                    ]
                },
                {
                    "@context": "https://schema.org",
                    "@type": "CollectionPage",
                    "name": "Paddock - Foro de Motos",
                    "description": "El corazón de la comunidad motera. Comparte conocimientos, organiza rutas, quedadas y discute sobre mecánica.",
                    "url": `${baseUrl}/paddock`
                }
            ];
        }

        if (view === 'threads' && selectedCategory) {
            return [
                {
                    "@context": "https://schema.org",
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                        {
                            "@type": "ListItem",
                            "position": 1,
                            "name": "Inicio",
                            "item": `${baseUrl}/`
                        },
                        {
                            "@type": "ListItem",
                            "position": 2,
                            "name": "Paddock Foro",
                            "item": `${baseUrl}/paddock`
                        },
                        {
                            "@type": "ListItem",
                            "position": 3,
                            "name": selectedCategory.title,
                            "item": `${baseUrl}/paddock?view=threads&cat=${selectedCategory.id}`
                        }
                    ]
                },
                {
                    "@context": "https://schema.org",
                    "@type": "CollectionPage",
                    "name": `${selectedCategory.title} | Paddock`,
                    "description": selectedCategory.description,
                    "url": `${baseUrl}/paddock?view=threads&cat=${selectedCategory.id}`
                }
            ];
        }

        if (view === 'thread_detail' && selectedThread) {
            const threadUrl = `${baseUrl}/paddock?view=thread_detail&cat=${categoryId}&thread=${selectedThread.id}`;
            const cleanBody = selectedThread.content?.replace(/<[^>]*>/g, '').trim().substring(0, 300) || '';
            
            const comments = replies.map((reply, idx) => ({
                "@type": "Comment",
                "text": reply.content?.replace(/<[^>]*>/g, '').trim() || '',
                "dateCreated": reply.created_at || reply.date || new Date().toISOString(),
                "position": idx + 1,
                "author": {
                    "@type": "Person",
                    "name": reply.author || 'Piloto'
                }
            }));

            return [
                {
                    "@context": "https://schema.org",
                    "@type": "BreadcrumbList",
                    "itemListElement": [
                        {
                            "@type": "ListItem",
                            "position": 1,
                            "name": "Inicio",
                            "item": `${baseUrl}/`
                        },
                        {
                            "@type": "ListItem",
                            "position": 2,
                            "name": "Paddock Foro",
                            "item": `${baseUrl}/paddock`
                        },
                        {
                            "@type": "ListItem",
                            "position": 3,
                            "name": selectedCategory?.title || "Categoría",
                            "item": `${baseUrl}/paddock?view=threads&cat=${categoryId}`
                        },
                        {
                            "@type": "ListItem",
                            "position": 4,
                            "name": selectedThread.title,
                            "item": threadUrl
                        }
                    ]
                },
                {
                    "@context": "https://schema.org",
                    "@type": "DiscussionForumPosting",
                    "mainEntityOfPage": threadUrl,
                    "headline": selectedThread.title,
                    "articleBody": cleanBody,
                    "datePublished": selectedThread.created_at || new Date().toISOString(),
                    "author": {
                        "@type": "Person",
                        "name": selectedThread.author?.name || 'Piloto Anónimo'
                    },
                    "interactionStatistic": {
                        "@type": "InteractionCounter",
                        "interactionType": "https://schema.org/CommentAction",
                        "userInteractionCount": replies.length
                    },
                    "comment": comments
                }
            ];
        }

        return undefined;
    };

    const renderPostContent = (content: string) => {
        if (!content) return null;

        // 1. Apply auto-linking for SEO brands/keywords
        let linked = autoLinkHtml(content);

        // 2. Parse tagged products [product-123] and inject inline preview components
        const parts = linked.split(/(\[product-\d+\])/g);
        
        return (
            <div className="space-y-4 text-zinc-800 dark:text-zinc-300 leading-relaxed text-sm md:text-base break-words">
                {parts.map((part, index) => {
                    const match = part.match(/\[product-(\d+)\]/);
                    if (match) {
                        const pid = parseInt(match[1]);
                        const product = taggedProductsMap[pid];
                        if (product) {
                            return (
                                <div key={index} className="my-6 p-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-xl border border-zinc-150 dark:border-zinc-850 flex items-center justify-between gap-4 max-w-md shadow-sm transition-all hover:shadow-md hover:border-racing-orange/30">
                                    <div className="flex items-center gap-3">
                                        <div className="w-14 h-14 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden flex-shrink-0">
                                            <img src={product.image} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white line-clamp-1">{product.title}</h4>
                                            <span className="text-xs text-racing-orange font-bold font-mono">{product.price}€</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => onAddToCart?.(product)}
                                        className="bg-zinc-900 dark:bg-zinc-800 hover:bg-racing-orange dark:hover:bg-racing-orange text-white text-xs font-bold uppercase py-2 px-3 rounded-lg transition-colors flex-shrink-0"
                                    >
                                        Añadir
                                    </button>
                                </div>
                            );
                        }
                        return null; // Don't render raw shortcode if not loaded yet
                    }

                    // Otherwise, render HTML safely with our auto-links
                    return (
                        <span 
                            key={index} 
                            dangerouslySetInnerHTML={{ __html: part }} 
                        />
                    );
                })}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black animate-fade-in pb-20 pt-8">
            <SEO 
                title={getPageTitle()} 
                description={view === 'thread_detail' && selectedThread ? selectedThread.content?.replace(/<[^>]*>/g, '').trim().substring(0, 155) : "Foro de motos y mecánica"} 
                jsonLd={getJsonLd()}
            />

            <div className="container mx-auto px-4 max-w-6xl">
                {/* Navigation / Breadcrumbs */}
                <div className="flex items-center gap-2 mb-8 text-sm text-zinc-500 font-medium">
                    <button onClick={() => navigateTo('categories')} className="hover:text-racing-orange transition-colors flex items-center gap-1">
                        PADDOCK
                    </button>
                    {(view === 'threads' || view === 'create_thread' || view === 'thread_detail') && selectedCategory && (
                        <>
                            <ChevronRight className="w-4 h-4" />
                            <button onClick={() => navigateTo('threads', { cat: String(selectedCategory.id) })} className="hover:text-zinc-900 dark:hover:text-white transition-colors">
                                {selectedCategory.title}
                            </button>
                        </>
                    )}
                    {view === 'thread_detail' && selectedThread && (
                        <>
                            <ChevronRight className="w-4 h-4" />
                            <span className="text-zinc-900 dark:text-zinc-300 truncate max-w-[200px]">{selectedThread.title}</span>
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
                        className="mb-6 flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-racing-orange dark:hover:text-white text-xs uppercase font-bold transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Volver
                    </button>
                )}

                {/* Alerts */}
                {errorMsg && (
                    <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-lg mb-6 flex items-center gap-3 text-red-600 dark:text-red-200 animate-slide-in">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{errorMsg}</span>
                        <button onClick={() => setErrorMsg(null)} className="ml-auto hover:text-red-900 dark:hover:text-white"><Trash2 className="w-4 h-4" /></button>
                    </div>
                )}
                {successMsg && (
                    <div className="fixed top-24 right-4 z-50 bg-green-500/10 border border-green-500/50 backdrop-blur-md text-green-600 dark:text-green-200 px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-slide-in-right">
                        <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
                        <span className="font-bold">{successMsg}</span>
                    </div>
                )}

                {/* --- VIEW: CATEGORIES --- */}
                {view === 'categories' && (
                    <div className="animate-fade-in">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4 w-full">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white italic uppercase tracking-tighter mb-2 flex items-center gap-4">
                                    THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-racing-orange to-red-600">PADDOCK</span>
                                    <button
                                        onClick={() => loadCategories()}
                                        className="p-2 text-zinc-500 hover:text-racing-orange transition-colors"
                                        title="Sincronizar"
                                    >
                                        <RefreshCw className={`w-6 h-6 ${loading ? 'animate-spin text-racing-orange' : ''}`} />
                                    </button>
                                </h1>
                                <p className="text-zinc-600 dark:text-zinc-400 max-w-xl">
                                    El corazón de la comunidad. Comparte conocimientos, organiza rutas y discute sobre mecánica.
                                </p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="w-10 h-10 text-racing-orange animate-spin" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {categories.map(cat => (
                                    <CategoryFolder 
                                        key={cat.id} 
                                        category={cat} 
                                        onSelect={(c) => {
                                            const titleLower = c.title.toLowerCase();
                                            const isRoutes = titleLower.includes('rita') || titleLower.includes('ruta') || titleLower.includes('quedada');
                                            if (isRoutes) {
                                                navigateTo('provinces');
                                            } else {
                                                setSelectedCategory(c);
                                                navigateTo('threads', { cat: String(c.id) });
                                            }
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* --- VIEW: PROVINCES (HIERARCHY) --- */}
                {view === 'provinces' && (
                    <div className="animate-fade-in">
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white uppercase italic mb-6 border-l-4 border-racing-orange pl-4">Selecciona tu Zona</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {SPAIN_PROVINCES.map(province => (
                                <button
                                    key={province}
                                    onClick={() => {
                                        const flatCats = (cats: PaddockCategory[]): PaddockCategory[] => {
                                            let res: PaddockCategory[] = [];
                                            cats.forEach(c => {
                                                res.push(c);
                                                if (c.children) res = res.concat(flatCats(c.children));
                                            });
                                            return res;
                                        };
                                        const routeCat = flatCats(categories).find(c => c.title.toLowerCase().includes('ruta') || c.title.toLowerCase().includes('quedada'));
                                        if (routeCat) {
                                            setSelectedCategory(routeCat);
                                            navigateTo('threads', { cat: String(routeCat.id), province: province });
                                        } else {
                                            alert("No se encontró la categoría de Rutas en el sistema.");
                                        }
                                    }}
                                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 p-4 rounded-lg text-left text-zinc-700 dark:text-zinc-300 hover:text-racing-orange dark:hover:text-white transition-colors text-sm font-medium flex items-center justify-between group shadow-sm dark:shadow-none"
                                >
                                    {province}
                                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 text-racing-orange transition-opacity" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- VIEW: THREAD LIST --- */}
                {view === 'threads' && (
                    <div className="animate-fade-in space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-zinc-900/30 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800/50 shadow-sm dark:shadow-none">
                            <div>
                                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white uppercase italic mb-1">{selectedCategory?.title}</h1>
                                <p className="text-zinc-600 dark:text-zinc-400 text-sm max-w-2xl">{selectedCategory?.description}</p>
                            </div>

                            {selectedCategory?.title.toLowerCase().includes('venta') && (
                                <div className="bg-yellow-500/10 border border-yellow-500/50 p-3 rounded-lg flex items-center gap-3 text-yellow-700 dark:text-yellow-200 w-full md:w-auto mt-4 md:mt-0">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-xs font-bold">SOLO MOTOS COMPLETAS. Prohibido recambios.</span>
                                </div>
                            )}

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
                            <div className="text-center py-24 bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl border-dashed">
                                <MessageSquare className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                                <h3 className="text-zinc-900 dark:text-white font-bold text-lg mb-2">Está muy tranquilo por aquí...</h3>
                                <p className="text-zinc-500 mb-6">Sé el primero en arrancar motores en esta categoría.</p>
                                <button
                                    onClick={() => user ? navigateTo('create_thread', { cat: categoryId! }) : onLoginRequest()}
                                    className="text-racing-orange hover:text-orange-600 font-bold uppercase text-sm transition-colors"
                                >
                                    Crear tema ahora &rarr;
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {threads.filter(t => t && t.author).map(thread => (
                                    <div
                                        key={thread.id}
                                        onClick={() => { setSelectedThread(thread); navigateTo('thread_detail', { cat: categoryId!, thread: String(thread.id) }); }}
                                        className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-racing-orange/50 p-4 rounded-lg cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-zinc-800/80 flex items-center gap-4 shadow-sm dark:shadow-none"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform overflow-hidden">
                                            {thread.author?.avatar ? (
                                                <img src={thread.author.avatar} alt={thread.author?.name} className="w-full h-full object-cover rounded-full" />
                                            ) : (
                                                <User className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                                            )}
                                        </div>

                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                {(thread.isPinned || thread.is_pinned) ? <span className="bg-[#ff4d00]/10 border border-[#ff4d00]/30 text-[#ff4d00] text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Fijado</span> : null}
                                                {(thread.isClosed || thread.is_closed) ? <span className="bg-zinc-200 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Lock className="w-3 h-3" /> Cerrado</span> : null}
                                                <h3 className="text-zinc-900 dark:text-white font-bold text-base truncate group-hover:text-racing-orange transition-colors">{thread.title || 'Sin Título'}</h3>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-zinc-500">
                                                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Por {thread.author?.name || 'Anónimo'}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {thread.created_at ? new Date(thread.created_at).toLocaleDateString() : '---'}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 text-zinc-400 dark:text-zinc-500 text-sm font-mono flex-shrink-0 pr-4">
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
                    <div className="max-w-4xl mx-auto animate-fade-in bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-xl shadow-xl">
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white uppercase italic mb-8 border-l-4 border-racing-orange pl-4">Nuevo Tema</h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase mb-2">Título</label>
                                <input
                                    value={newThreadTitle}
                                    onChange={e => setNewThreadTitle(e.target.value)}
                                    placeholder="Ej: Opiniones sobre escape SC Project estruendoso..."
                                    className="w-full bg-gray-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:border-racing-orange focus:ring-1 focus:ring-racing-orange/50 transition-all outline-none font-bold"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase">Contenido</label>
                                    <button 
                                        type="button"
                                        onClick={() => openTagModal('thread')} 
                                        className="text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-racing-orange hover:text-white text-zinc-600 dark:text-zinc-300 font-bold px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
                                    >
                                        <Hash className="w-3.5 h-3.5 text-racing-orange group-hover:text-white" /> Etiquetar Producto
                                    </button>
                                </div>
                                <RichTextEditor
                                    value={newThreadContent}
                                    onChange={setNewThreadContent}
                                    className="bg-gray-50 dark:bg-zinc-950 min-h-[300px]"
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
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm dark:shadow-none">
                                <div className="p-6 md:p-8 bg-gray-50/50 dark:bg-zinc-950/30 border-b border-zinc-200 dark:border-zinc-800">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden border-2 border-zinc-300 dark:border-zinc-700">
                                            {selectedThread.author?.avatar ? (
                                                <img src={selectedThread.author.avatar} alt={selectedThread.author?.name} className="w-full h-full object-cover" />
                                            ) : <User className="w-6 h-6 text-zinc-400 dark:text-zinc-500 m-auto mt-2" />}
                                        </div>
                                        <div>
                                            <h3 className="text-zinc-900 dark:text-white font-bold text-lg">{selectedThread.author?.name || 'Piloto Anónimo'}</h3>
                                            <p className="text-zinc-500 text-xs flex items-center gap-2">
                                                <Clock className="w-3 h-3" /> {selectedThread.created_at ? new Date(selectedThread.created_at).toLocaleDateString() : '---'}
                                            </p>
                                        </div>
                                    </div>

                                    <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white italic uppercase mb-6 leading-tight">{selectedThread.title}</h1>

                                    {renderPostContent(selectedThread.content)}

                                    {recommendedProducts.length > 0 && (
                                        <div className="mt-8 pt-6 border-t border-zinc-150 dark:border-zinc-800/80 animate-fade-in">
                                            <h4 className="text-xs font-black uppercase italic text-racing-orange tracking-wider mb-4 flex items-center gap-2">
                                                <span className="w-1.5 h-3 bg-racing-orange inline-block transform -skew-x-12"></span>
                                                Piezas recomendadas compatibles para este debate
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                {recommendedProducts.map(product => (
                                                    <div key={product.id} className="transform hover:-translate-y-1 transition-all duration-300">
                                                        <ProductCard
                                                            product={product}
                                                            onAddToCart={() => onAddToCart?.(product)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Actions Bar */}
                                <div className="p-4 bg-gray-50 dark:bg-zinc-950 flex justify-between items-center text-sm">
                                    <div className="flex gap-4">
                                        <button className="flex items-center gap-2 text-zinc-500 hover:text-racing-orange transition-colors font-bold uppercase text-xs">
                                            <Heart className="w-4 h-4" /> {selectedThread.metrics?.likes || 0} Likes
                                        </button>
                                        <button className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors font-bold uppercase text-xs">
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
                                <h3 className="text-zinc-900 dark:text-white font-bold uppercase text-sm border-b border-zinc-200 dark:border-zinc-800 pb-2">Respuestas ({replies.length})</h3>
                                {replies.map(reply => (
                                    <div key={reply.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-lg flex gap-4 shadow-sm dark:shadow-none">
                                        <div className="flex-shrink-0 text-center">
                                            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden mb-1 mx-auto">
                                                {reply.authorAvatar ? <img src={reply.authorAvatar} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-zinc-400 dark:text-zinc-500 m-auto mt-2" />}
                                            </div>
                                            {reply.authorRank && <RankBadge rank={reply.authorRank} size="sm" />}
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className="text-zinc-900 dark:text-white font-bold block text-sm">{reply.author}</span>
                                                    <span className="text-zinc-500 dark:text-zinc-600 text-xs block">{reply.date}</span>
                                                </div>
                                            </div>
                                            {renderPostContent(reply.content)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Reply Input */}
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl shadow-sm dark:shadow-none">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-zinc-900 dark:text-white font-bold">Tu Respuesta</h3>
                                    {user && (
                                        <button 
                                            type="button"
                                            onClick={() => openTagModal('reply')} 
                                            className="text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-racing-orange hover:text-white text-zinc-600 dark:text-zinc-300 font-bold px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
                                        >
                                            <Hash className="w-3.5 h-3.5 text-racing-orange group-hover:text-white" /> Etiquetar Producto
                                        </button>
                                    )}
                                </div>
                                {user ? (
                                    <div className="space-y-4">
                                        <RichTextEditor value={replyContent} onChange={setReplyContent} className="bg-gray-50 dark:bg-zinc-950" />
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
                                    <div className="text-center py-6 bg-gray-50 dark:bg-zinc-950/50 rounded-lg">
                                        <p className="text-zinc-500 mb-2">Debes estar identificado para responder.</p>
                                        <button onClick={onLoginRequest} className="text-racing-orange font-bold uppercase">Iniciar Sesión</button>
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl shadow-sm dark:shadow-none">
                                <h4 className="text-zinc-900 dark:text-white font-bold uppercase italic text-sm mb-4">Reglas del Paddock</h4>
                                <ul className="space-y-3 text-sm text-zinc-500 dark:text-zinc-400">
                                    <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> Respeto mutuo en pista.</li>
                                    <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> No spam ni publicidad.</li>
                                    <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> Usa el buscador antes de postear.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Tag Product Search Modal */}
            {isTagModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-scale-in">
                        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-gray-50 dark:bg-zinc-950/50">
                            <div>
                                <h3 className="text-lg font-black uppercase italic text-zinc-900 dark:text-white">Etiquetar Producto</h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">Inserta un enlace visual dinámico en tu publicación</p>
                            </div>
                            <button 
                                onClick={() => { setIsTagModalOpen(false); setTagSearchQuery(''); setTagSearchResults([]); }}
                                className="text-zinc-400 hover:text-zinc-650 dark:hover:text-white font-bold p-1"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-3.5 w-5 h-5 text-zinc-400" />
                                <input
                                    type="text"
                                    value={tagSearchQuery}
                                    onChange={(e) => handleTagSearch(e.target.value)}
                                    placeholder="Buscar por marca, modelo o escape..."
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3.5 pl-12 pr-4 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:border-racing-orange focus:ring-1 focus:ring-racing-orange/50 transition-all outline-none font-bold"
                                    autoFocus
                                />
                            </div>

                            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                {loadingTagSearch ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
                                        <Loader2 className="w-8 h-8 text-racing-orange animate-spin mb-2" />
                                        <span className="text-xs font-medium uppercase tracking-wider">Buscando en el catálogo...</span>
                                    </div>
                                ) : tagSearchResults.length > 0 ? (
                                    tagSearchResults.map(product => (
                                        <div 
                                            key={product.id}
                                            onClick={() => handleSelectTagProduct(product)}
                                            className="p-3 border border-zinc-200 dark:border-zinc-800/80 hover:border-racing-orange dark:hover:border-racing-orange rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20 hover:bg-zinc-100 dark:hover:bg-zinc-900/30 transition-all flex items-center justify-between cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 overflow-hidden flex-shrink-0">
                                                    <img src={product.image} className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-racing-orange transition-colors line-clamp-1">{product.title}</h4>
                                                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold">{product.price}€</span>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-black uppercase text-racing-orange opacity-0 group-hover:opacity-100 transition-opacity">
                                                Insertar +
                                            </span>
                                        </div>
                                    ))
                                ) : tagSearchQuery.trim().length >= 2 ? (
                                    <div className="text-center py-8 text-zinc-500">
                                        No se encontraron productos que coincidan.
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-zinc-400 text-xs font-bold uppercase tracking-wider">
                                        Escribe al menos 2 letras para buscar...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
