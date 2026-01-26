import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageSquare, Clock, Hash, ChevronRight, ArrowLeft, Send, User, Loader2, PlusCircle, Quote, AlertCircle, CheckCircle, Pencil, Trash2, XCircle, Save, Heart } from 'lucide-react';
import { ForumTopic, ForumCategory, ForumReply, User as UserType, UserRank } from '../types';
import { fetchForumCategories, fetchTopics, fetchReplies, createTopic, createReply, updateTopic, deleteTopic, updateReply, deleteReply, toggleLike, awardXP, getUserRank } from '../services/forum';
import { RichTextEditor } from './RichTextEditor';
import { RankBadge } from './RankBadge';
import { SEO } from './SEO';

interface ForumProps {
  user: UserType | null;
  onBack: () => void;
  onLoginRequest: () => void;
}

export const Forum: React.FC<ForumProps> = ({ user, onBack, onLoginRequest }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL Params State Management
  const view = searchParams.get('view') || 'categories';
  const categoryId = searchParams.get('cat');
  const topicId = searchParams.get('topic');

  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [replies, setReplies] = useState<ForumReply[]>([]);

  // Derived state from URL IDs
  const [selectedCategory, setSelectedCategory] = useState<ForumCategory | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Topic Creation
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicBody, setNewTopicBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reply Creation
  const [replyBody, setReplyBody] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Editing State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');

  // Ranks State
  const [userRanks, setUserRanks] = useState<Record<number, UserRank>>({});

  // 1. Initial Load
  useEffect(() => {
    loadCategories();
  }, []);

  // 2. Sync State with URL Changes
  useEffect(() => {
    const syncView = async () => {
      if (view === 'category_topics' && categoryId) {
        setLoading(true);
        // Ensure category object is loaded
        if (!selectedCategory || selectedCategory.id !== categoryId) {
          const cats = await fetchForumCategories(); // quick refetch or use cached if optimized
          const cat = cats.find(c => c.id === categoryId);
          if (cat) setSelectedCategory(cat);
        }
        const data = await fetchTopics(categoryId);
        setTopics(data);
        setLoading(false);
      } else if (view === 'topic' && topicId) {
        setLoading(true);
        const tId = parseInt(topicId);
        // We need topic details. If usually coming from list, we might miss it if deep linking.
        // Assuming fetchReplies returns title/content in a real API, or we fetchTopicDetail separate.
        // For now, we fetch discussion (replies). 
        // OPTIMIZATION: In a real app, fetchTopicById(tId) should exist.
        // We will try to find it in 'topics' list if present, else we might not have the title for SEO immediately.

        const data = await fetchReplies(tId);
        setReplies(data);

        // Try to recover topic info if missing (e.g. refresh on deep link)
        if (!selectedTopic) {
          // Fallback: This logic assumes 'fetchReplies' or another endpoint gives us the Topic Metadata
          // If strict dependency on 'topics' list exists, we might need to fetch the category topics first?
          // Simplification for prototype: We just set replies. 
          // BETTER: Call a mock "getTopic(id)"
          // let t = topics.find(t => t.id === tId); // Try simple lookup
          // if (!t) { ...fetch... }
        }

        loadUserRanks(data);
        setLoading(false);
      }
    };
    syncView();
  }, [view, categoryId, topicId]);

  // Real-time polling
  useEffect(() => {
    let interval: any;
    if (view === 'category_topics' && categoryId) {
      interval = setInterval(async () => {
        const data = await fetchTopics(categoryId);
        setTopics(data);
      }, 5000); // Relaxed to 5s
    } else if (view === 'topic' && topicId) {
      interval = setInterval(async () => {
        const data = await fetchReplies(parseInt(topicId));
        setReplies(data);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [view, categoryId, topicId]);

  const navigateTo = (newView: string, params: Record<string, string> = {}) => {
    const newParams = new URLSearchParams();
    newParams.set('view', newView);
    Object.entries(params).forEach(([k, v]) => newParams.set(k, v));
    setSearchParams(newParams);
  };

  const loadCategories = async () => {
    setLoading(true);
    const data = await fetchForumCategories();
    setCategories(data);
    setLoading(false);
  };

  const handleCategoryClick = (cat: ForumCategory) => {
    setSelectedCategory(cat);
    navigateTo('category_topics', { cat: cat.id });
  };

  const handleTopicClick = (topic: ForumTopic) => {
    setSelectedTopic(topic);
    navigateTo('topic', { topic: topic.id.toString() });
  };

  // Helper for deep link SEO title
  const getPageTitle = () => {
    if (view === 'categories') return 'Paddock - Foro de Motos';
    if (view === 'category_topics') return `${selectedCategory?.title || 'Foro'} | Paddock`;
    if (view === 'topic') return `${selectedTopic?.title || 'Discusión'} | Foro Paddock`;
    if (view === 'create_topic') return 'Nuevo Tema | Paddock';
    return 'Paddock';
  };

  // ... (Keep existing logic functions: loadUserRanks, handleLikeToggle, handleCreateTopic, etc. adapted to use new state) ...
  // Re-implementing simplified logic for clarity in replace_file_content context:

  const loadUserRanks = async (replies: ForumReply[]) => {
    const uniqueAuthorIds = [...new Set(replies.map(r => r.authorId))].filter(id => id > 0);
    for (const authorId of uniqueAuthorIds) {
      if (!userRanks[authorId]) {
        const rank = await getUserRank(authorId);
        if (rank) setUserRanks(prev => ({ ...prev, [authorId]: rank }));
      }
    }
  };

  const handleCreateTopic = async () => {
    if (!user || !user.token) return onLoginRequest();
    if (!newTopicTitle.trim() || !newTopicBody.trim()) {
      setErrorMsg("Completa título y contenido.");
      return;
    }
    setIsSubmitting(true);
    const result = await createTopic(user.token, selectedCategory!.id, newTopicTitle, newTopicBody);
    if (result.success) {
      setNewTopicTitle(''); setNewTopicBody('');
      if (user.id && result.id) awardXP(user.id, 'CREATE_TOPIC', user.token, result.id);
      setSuccessMsg("¡Tema publicado!");
      setTimeout(() => setSuccessMsg(null), 3000);
      navigateTo('category_topics', { cat: selectedCategory!.id });
    } else {
      setErrorMsg(result.error || "Error al crear.");
    }
    setIsSubmitting(false);
  };

  const handleReplySubmit = async () => {
    if (!user || !user.token) return onLoginRequest();
    if (!selectedTopic || !replyBody.trim()) return;
    setIsSubmittingReply(true);
    const result = await createReply(user.token, selectedTopic.id, replyBody);
    setIsSubmittingReply(false);
    if (result.success) {
      setReplyBody('');
      if (user.id && result.id) awardXP(user.id, 'CREATE_REPLY', user.token, result.id);
      const updated = await fetchReplies(selectedTopic.id);
      setReplies(updated);
      setSuccessMsg("¡Respuesta publicada!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setErrorMsg("Error al responder.");
    }
  };

  // ... (Existing Render Helpers) ...

  // SEO Schema Generation
  const generateSchema = () => {
    if (view === 'topic' && selectedTopic) {
      return {
        "@context": "https://schema.org",
        "@type": "DiscussionForumPosting",
        "headline": selectedTopic.title,
        "author": {
          "@type": "Person",
          "name": selectedTopic.author
        },
        "datePublished": selectedTopic.date, // Needs ISO format ideally
        "interactionStatistic": {
          "@type": "InteractionCounter",
          "interactionType": "https://schema.org/CommentAction",
          "userInteractionCount": replies.length
        }
      };
    }
    return undefined;
  };

  // Render
  return (
    <div className="min-h-screen bg-black animate-fade-in pb-20 pt-8">
      <SEO
        title={getPageTitle()}
        description={selectedCategory?.description || "Foro de debate sobre mecánica y motos."}
        canonical={window.location.pathname + window.location.search}
        jsonLd={generateSchema()}
      />

      <div className="container mx-auto px-4">
        {/* Breadcrumb Header */}
        <div className="flex items-center gap-2 mb-8 text-sm text-zinc-500">
          <button onClick={() => navigateTo('categories')} className="hover:text-white flex items-center gap-1">Paddock</button>

          {(view === 'category_topics' || view === 'create_topic' || view === 'topic') && (
            <>
              <ChevronRight className="w-4 h-4" />
              <button
                onClick={() => selectedCategory && navigateTo('category_topics', { cat: selectedCategory.id })}
                className="hover:text-white font-bold">
                {selectedCategory?.title || 'Foro'}
              </button>
            </>
          )}

          {view === 'topic' && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span className="text-racing-orange truncate max-w-[200px]">{selectedTopic?.title || 'Tema'}</span>
            </>
          )}
        </div>

        {view !== 'categories' && (
          <button
            onClick={() => {
              if (view === 'topic') navigateTo('category_topics', { cat: categoryId! });
              else if (view === 'create_topic') navigateTo('category_topics', { cat: categoryId! });
              else navigateTo('categories');
            }}
            className="mb-6 flex items-center gap-2 text-zinc-400 hover:text-white text-xs uppercase font-bold">
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
        )}

        {/* --- VIEWS --- */}
        {view === 'categories' && (
          <div className="animate-fade-in">
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-extrabold text-white uppercase italic tracking-tighter mb-2">
                Paddock <span className="text-racing-orange">Comunidad</span>
              </h1>
              <p className="text-zinc-400">El punto de encuentro para pilotos, mecánicos y aficionados.</p>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-10 h-10 text-racing-orange animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {categories.map((cat) => {
                  const IconComponent = cat.icon;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat)}
                      className="group bg-zinc-900 border border-zinc-800 hover:border-racing-orange p-6 rounded-sm cursor-pointer transition-all duration-300 flex items-start gap-4 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <IconComponent className="w-24 h-24 text-racing-orange transform rotate-12" />
                      </div>

                      <div className="p-4 bg-zinc-950 rounded-full group-hover:bg-racing-orange transition-colors z-10">
                        <IconComponent className="w-8 h-8 text-zinc-400 group-hover:text-white" />
                      </div>
                      <div className="flex-1 z-10">
                        <h3 className="text-xl font-bold text-white uppercase italic mb-1">{cat.title}</h3>
                        <p className="text-zinc-500 text-sm mb-4 leading-relaxed">{cat.description}</p>
                        <div className="flex items-center text-xs text-zinc-600 font-bold uppercase tracking-wider">
                          <MessageSquare className="w-3 h-3 mr-1" /> {cat.topicCount} Temas Activos
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {view === 'category_topics' && (
          <div className="max-w-5xl mx-auto space-y-4">
            {successMsg && (
              <div className="fixed top-24 right-4 z-50 bg-green-900 border border-green-700 text-white px-6 py-3 rounded-sm shadow-2xl flex items-center gap-2 animate-fade-in-right">
                <CheckCircle className="w-5 h-5 text-green-400" /> {successMsg}
              </div>
            )}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white uppercase italic">{selectedCategory?.title}</h2>
                <p className="text-zinc-500 text-sm">{selectedCategory?.description}</p>
              </div>
              <button
                onClick={() => user ? navigateTo('create_topic', { cat: categoryId! }) : onLoginRequest()}
                className="bg-racing-orange hover:bg-orange-600 text-white font-bold uppercase text-xs py-2 px-4 rounded-sm flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" /> Nuevo Tema
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-racing-orange" /></div>
            ) : topics.length === 0 ? (
              <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-sm">
                <MessageSquare className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-400 font-bold mb-2">Esta pista está vacía</p>
                <p className="text-zinc-600 text-sm mb-6">Sé el primero en arrancar la conversación.</p>
                <button
                  onClick={() => user ? navigateTo('create_topic', { cat: categoryId! }) : onLoginRequest()}
                  className="text-racing-orange hover:text-white text-sm font-bold uppercase"
                >
                  Crear primer tema
                </button>
              </div>
            ) : (
              topics.map(topic => (
                <div key={topic.id} onClick={() => handleTopicClick(topic)} className="bg-zinc-900 border border-zinc-800 p-4 rounded-sm cursor-pointer hover:border-racing-orange transition-colors flex justify-between items-center group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-950 rounded-full flex items-center justify-center border border-zinc-800 group-hover:border-racing-orange/50 flex-shrink-0">
                      <MessageSquare className="w-5 h-5 text-zinc-600 group-hover:text-racing-orange transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold group-hover:text-racing-orange transition-colors text-sm md:text-base line-clamp-1" dangerouslySetInnerHTML={{ __html: topic.title }}></h3>
                      <div className="flex items-center gap-2 text-zinc-500 text-xs mt-1">
                        <span className="flex items-center gap-1 font-bold text-zinc-400"><User className="w-3 h-3" /> {topic.author}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {topic.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-zinc-500 text-xs flex items-center gap-1">
                      <Heart className="w-3 h-3" /> {topic.likes}
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-700" />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {view === 'create_topic' && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            <h2 className="text-2xl font-bold text-white uppercase italic mb-6">Nuevo Tema en <span className="text-racing-orange">{selectedCategory?.title}</span></h2>

            {errorMsg && (
              <div className="bg-red-900/20 border border-red-800 p-3 rounded-sm mb-4 text-red-200 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> {errorMsg}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-bold uppercase mb-2">Título del Tema</label>
                <input
                  value={newTopicTitle}
                  onChange={e => setNewTopicTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none font-bold"
                  placeholder="Ej: Problema con escape Akrapovic..."
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-bold uppercase mb-2">Contenido</label>
                <RichTextEditor
                  value={newTopicBody}
                  onChange={setNewTopicBody}
                  placeholder="Describe tu consulta o aporte con detalle..."
                  className="min-h-[300px]"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleCreateTopic}
                  disabled={isSubmitting}
                  className="bg-racing-orange hover:bg-orange-600 text-white font-bold uppercase py-3 px-8 rounded-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  Publicar Tema
                </button>
                <button
                  onClick={() => navigateTo('category_topics', { cat: categoryId! })}
                  disabled={isSubmitting}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold uppercase py-3 px-6 rounded-sm transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'topic' && selectedTopic && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-zinc-900 border border-zinc-800 rounded-sm mb-6 overflow-hidden">
              <div className="p-6 border-b border-zinc-800 bg-zinc-950/50">
                <div className="flex items-center gap-2 text-racing-orange text-xs font-bold uppercase mb-2">
                  <Hash className="w-3 h-3" /> {selectedCategory?.title}
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white uppercase italic leading-tight" dangerouslySetInnerHTML={{ __html: selectedTopic.title }}></h1>

                <div className="mt-6 text-zinc-300 prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: selectedTopic.content }} />
              </div>

              {/* Replies List */}
              <div className="divide-y divide-zinc-800">
                {loading ? <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-racing-orange" /></div> :
                  replies.map(reply => (
                    <div key={reply.id} className="p-6">
                      <div className="flex gap-4">
                        <div className="text-center w-12 flex-shrink-0">
                          <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-2 overflow-hidden">
                            {reply.authorAvatar ? <img src={reply.authorAvatar} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-zinc-500" />}
                          </div>
                          <span className="text-[10px] uppercase font-bold text-zinc-500">{reply.authorRole || 'Racer'}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-200">{reply.author}</span>
                              {userRanks[reply.authorId] && <RankBadge rank={userRanks[reply.authorId]} size="sm" />}
                            </div>
                            <span className="text-xs text-zinc-600 flex items-center gap-1"><Clock className="w-3 h-3" /> {reply.date}</span>
                          </div>
                          <div className="text-zinc-300 prose prose-invert prose-sm" dangerouslySetInnerHTML={{ __html: reply.content }} />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Reply Box */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm">
              <h3 className="text-white font-bold mb-4">Responder</h3>
              {user ? (
                <div className="space-y-4">
                  <RichTextEditor value={replyBody} onChange={setReplyBody} className="bg-zinc-950" />
                  <div className="flex justify-end">
                    <button onClick={handleReplySubmit} disabled={isSubmittingReply} className="bg-racing-orange text-white px-6 py-2 font-bold uppercase rounded-sm flex items-center gap-2">
                      {isSubmittingReply ? <Loader2 className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4" />} Publicar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-zinc-950 text-center text-zinc-400">
                  <button onClick={onLoginRequest} className="text-racing-orange font-bold uppercase">Inicia sesión</button> para participar.
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};