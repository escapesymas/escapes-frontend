import React, { useState, useEffect } from 'react';
import { MessageSquare, Eye, Clock, Hash, ChevronRight, ArrowLeft, Send, ThumbsUp, Pin, User, Search, Loader2, PlusCircle, X, Quote, AlertCircle } from 'lucide-react';
import { ForumTopic, ForumCategory, ForumReply, User as UserType } from '../types';
import { fetchForumCategories, fetchTopics, fetchReplies, createTopic, createReply } from '../services/forum';
import { RichTextEditor } from './RichTextEditor';

interface ForumProps {
  user: UserType | null;
  onBack: () => void;
  onLoginRequest: () => void;
}

export const Forum: React.FC<ForumProps> = ({ user, onBack, onLoginRequest }) => {
  const [currentView, setCurrentView] = useState<'categories' | 'category_topics' | 'topic' | 'create_topic'>('categories');
  
  // Data State
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  
  // Selection State
  const [selectedCategory, setSelectedCategory] = useState<ForumCategory | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null); // Global or Form error
  
  // Create Topic Form State
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicBody, setNewTopicBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reply Form State
  const [replyBody, setReplyBody] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // --- INITIAL LOAD ---
  useEffect(() => {
    loadCategories();
  }, []);

  // Clear errors when changing views
  useEffect(() => {
    setErrorMsg(null);
  }, [currentView, selectedCategory, selectedTopic]);

  const loadCategories = async () => {
    setLoading(true);
    const data = await fetchForumCategories();
    setCategories(data);
    setLoading(false);
  };

  // --- NAVIGATION HANDLERS ---
  const handleCategoryClick = async (cat: ForumCategory) => {
    setSelectedCategory(cat);
    setLoading(true);
    setCurrentView('category_topics');
    
    // Fetch topics for this category
    const data = await fetchTopics(cat.id);
    setTopics(data);
    setLoading(false);
  };

  const handleTopicClick = async (topic: ForumTopic) => {
    setSelectedTopic(topic);
    setLoading(true);
    setCurrentView('topic');

    // Fetch replies for this topic
    const data = await fetchReplies(topic.id);
    setReplies(data);
    setLoading(false);
  };

  const goBack = () => {
    if (currentView === 'topic') setCurrentView('category_topics');
    else if (currentView === 'create_topic') setCurrentView('category_topics');
    else if (currentView === 'category_topics') {
      setCurrentView('categories');
      setSelectedCategory(null);
    }
    else onBack();
  };

  const handleCreateTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.token || !selectedCategory) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const result = await createTopic(user.token, selectedCategory.id, newTopicTitle, newTopicBody);
    
    if (result.success) {
      // OPTIMISTIC UPDATE
      // Note: We don't have the full WP object here, but we mimic it enough for the list
      const newTopicObj: ForumTopic = {
        id: result.id || Date.now(),
        categoryId: selectedCategory.id,
        title: newTopicTitle,
        author: user.username || user.firstName,
        authorAvatar: user.avatarUrl || '',
        date: 'Ahora mismo',
        views: 0,
        replies: 0,
        isPinned: false
      };

      setTopics(prev => [newTopicObj, ...prev]);
      
      // Reset form and go back to list
      setNewTopicTitle('');
      setNewTopicBody('');
      setCurrentView('category_topics');
    } else {
      setErrorMsg(result.error || "Error desconocido al crear el tema.");
    }
    setIsSubmitting(false);
  };

  const handleReplySubmit = async () => {
    if (!user?.token || !selectedTopic || !replyBody.trim()) return;

    setIsSubmittingReply(true);
    setErrorMsg(null);

    const result = await createReply(user.token, selectedTopic.id, replyBody);

    if (result.success) {
      // OPTIMISTIC UPDATE
      const newReplyObj: ForumReply = {
        id: result.id || Date.now(),
        topicId: selectedTopic.id,
        author: user.username || user.firstName,
        authorAvatar: user.avatarUrl || '',
        authorRole: 'Racer', // Default role for now
        content: replyBody,
        date: 'Ahora mismo',
        likes: 0
      };

      setReplies(prev => [...prev, newReplyObj]);
      setReplyBody(''); // Clear input
      
      setSelectedTopic(prev => prev ? ({ ...prev, replies: prev.replies + 1 }) : null);

    } else {
      // Show error in UI instead of alert
      setErrorMsg(result.error || "No se pudo publicar la respuesta. Verifica tus permisos.");
    }
    setIsSubmittingReply(false);
  };

  const handleQuote = (reply: ForumReply) => {
    const quoteHtml = `<blockquote><strong>${reply.author} escribió:</strong><br/>${reply.content}</blockquote><br/>`;
    setReplyBody(prev => prev + quoteHtml);
    // Scroll to editor
    const editorElement = document.getElementById('reply-editor');
    if (editorElement) editorElement.scrollIntoView({ behavior: 'smooth' });
  };

  // --- RENDERERS ---

  // 1. CATEGORIES VIEW
  const renderCategories = () => (
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {categories.map((cat) => (
            <div 
              key={cat.id} 
              onClick={() => handleCategoryClick(cat)}
              className="group bg-zinc-900 border border-zinc-800 hover:border-racing-orange p-6 rounded-sm cursor-pointer transition-all duration-300 flex items-start gap-4"
            >
              <div className="p-4 bg-zinc-950 rounded-full group-hover:bg-racing-orange transition-colors">
                <cat.icon className="w-8 h-8 text-zinc-400 group-hover:text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white uppercase italic mb-1">{cat.title}</h3>
                <p className="text-zinc-500 text-sm mb-4">{cat.description}</p>
                <div className="flex items-center text-xs text-zinc-600 font-bold uppercase tracking-wider">
                  <MessageSquare className="w-3 h-3 mr-1" /> {cat.topicCount} Temas
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-zinc-700 group-hover:text-racing-orange self-center" />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // 2. TOPICS LIST VIEW
  const renderTopics = () => {
    return (
      <div className="animate-fade-in max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
           <div>
             <h2 className="text-2xl font-bold text-white uppercase italic flex items-center gap-2">
               {selectedCategory?.icon && <selectedCategory.icon className="w-6 h-6 text-racing-orange" />}
               {selectedCategory?.title}
             </h2>
             <p className="text-zinc-500 text-sm mt-1">Discusiones recientes en esta categoría.</p>
           </div>
           {user ? (
             <button 
               onClick={() => setCurrentView('create_topic')}
               className="bg-racing-orange hover:bg-orange-600 text-white font-bold uppercase text-sm px-4 py-2 rounded-sm transition-colors flex items-center gap-2"
             >
               <PlusCircle className="w-4 h-4" /> Nuevo Tema
             </button>
           ) : (
             <button onClick={onLoginRequest} className="text-zinc-400 hover:text-white text-xs underline">Inicia sesión para publicar</button>
           )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-10 h-10 text-racing-orange animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {topics.length > 0 ? topics.map(topic => (
              <div 
                key={topic.id} 
                onClick={() => handleTopicClick(topic)}
                className="bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-600 p-4 rounded-sm cursor-pointer transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {topic.isPinned && <span className="bg-racing-orange text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase flex items-center gap-1"><Pin className="w-3 h-3" /> Fijo</span>}
                    <h3 className="text-white font-bold text-lg hover:text-racing-orange transition-colors" dangerouslySetInnerHTML={{__html: topic.title}}></h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                     <span className="text-zinc-400 font-bold">{topic.author}</span>
                     <span>•</span>
                     <span>{topic.date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-zinc-500 text-xs font-mono border-t md:border-t-0 md:border-l border-zinc-800 pt-2 md:pt-0 md:pl-6 w-full md:w-auto justify-between md:justify-start">
                  {/* Note: Native WP API post list doesn't return comment count easily without custom fields, so we hide it or show simplified view if 0 */}
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-white text-sm">Post</span>
                    <span>Info</span>
                  </div>
                  {topic.authorAvatar ? (
                    <img src={topic.authorAvatar} alt={topic.author} className="w-8 h-8 rounded-full border border-zinc-700 ml-2" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center ml-2"><User className="w-4 h-4" /></div>
                  )}
                </div>
              </div>
            )) : (
              <div className="text-center py-12 text-zinc-500 border border-zinc-800 border-dashed rounded-sm">
                No hay temas en esta categoría aún. ¡Sé el primero!
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // 3. CREATE TOPIC FORM (Remains mostly the same, handled by Service)
  const renderCreateTopic = () => (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-sm">
        <h2 className="text-2xl font-bold text-white uppercase italic mb-6 border-b border-zinc-800 pb-4">
          Crear Nuevo Tema en <span className="text-racing-orange">{selectedCategory?.title}</span>
        </h2>
        
        {errorMsg && (
          <div className="mb-6 bg-red-900/20 border border-red-800 text-red-200 p-4 rounded-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">No se pudo crear el tema</p>
              <p className="text-sm opacity-80">{errorMsg}</p>
            </div>
          </div>
        )}
        
        <form onSubmit={handleCreateTopicSubmit} className="space-y-6">
          <div>
            <label className="block text-zinc-500 text-xs font-bold uppercase mb-2">Título del Tema</label>
            <input 
              required
              type="text" 
              value={newTopicTitle}
              onChange={(e) => setNewTopicTitle(e.target.value)}
              placeholder="Ej: Duda sobre compatibilidad escape MT-07"
              className="w-full bg-zinc-950 border border-zinc-700 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-zinc-500 text-xs font-bold uppercase mb-2">Contenido</label>
            <RichTextEditor 
              value={newTopicBody} 
              onChange={setNewTopicBody} 
              placeholder="Escribe aquí tu consulta..." 
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button 
              type="button" 
              onClick={() => setCurrentView('category_topics')}
              className="px-6 py-3 text-zinc-400 hover:text-white font-bold uppercase text-sm"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-racing-orange hover:bg-orange-600 text-white font-bold uppercase px-6 py-3 rounded-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Publicar Tema
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // 4. SINGLE TOPIC VIEW
  const renderSingleTopic = () => {
    if (!selectedTopic) return null;

    return (
      <div className="animate-fade-in max-w-4xl mx-auto">
        {/* Topic Header */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm mb-6">
           <div className="flex items-start justify-between gap-4 mb-6">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white uppercase italic leading-tight" dangerouslySetInnerHTML={{__html: selectedTopic.title}}>
              </h1>
              {selectedTopic.isPinned && <Pin className="w-6 h-6 text-racing-orange flex-shrink-0" />}
           </div>
           
           <div className="flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-800 pt-4">
              <div className="flex items-center gap-2">
                 {selectedTopic.authorAvatar ? (
                   <img src={selectedTopic.authorAvatar} className="w-6 h-6 rounded-full" />
                 ) : <User className="w-5 h-5 bg-zinc-800 rounded-full p-1" />}
                 <span className="text-zinc-300 font-bold">{selectedTopic.author}</span>
                 <span>• {selectedTopic.date}</span>
              </div>
              <div className="flex gap-4">
                 <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" /> {replies.length - 1} Respuestas</span>
              </div>
           </div>
        </div>

        {/* Replies */}
        {loading ? (
           <div className="flex justify-center py-8">
             <Loader2 className="w-8 h-8 text-racing-orange animate-spin" />
           </div>
        ) : (
          <div className="space-y-4 mb-8">
             {replies.map((reply, idx) => (
               <div key={reply.id} className={`p-6 rounded-sm border flex flex-col md:flex-row gap-4 ${reply.authorRole === 'OP' ? 'bg-zinc-900 border-zinc-700' : 'bg-zinc-950 border-zinc-800'}`}>
                  {/* Author Info */}
                  <div className="flex-shrink-0 flex flex-row md:flex-col items-center md:items-start gap-3 md:w-32">
                     <div className="relative">
                        {reply.authorAvatar ? (
                          <img src={reply.authorAvatar} className="w-12 h-12 rounded-full border border-zinc-700" />
                        ) : <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center"><User className="w-6 h-6 text-zinc-500" /></div>}
                     </div>
                     
                     <div className="text-left md:text-center w-full">
                       <span className="text-zinc-300 font-bold text-sm block truncate">{reply.author}</span>
                       {reply.authorRole === 'OP' && (
                         <span className="bg-racing-orange text-white text-[10px] font-bold px-1.5 rounded-sm uppercase inline-block mt-1">
                           Autor
                         </span>
                       )}
                     </div>
                  </div>

                  {/* Content */}
                  <div className="flex-grow border-l border-zinc-800/50 pl-0 md:pl-6 pt-2 md:pt-0">
                     <div className="flex justify-between items-start mb-4">
                        <span className="text-zinc-600 text-xs">{reply.date}</span>
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleQuote(reply)}
                            className="text-zinc-500 hover:text-white transition-colors"
                            title="Citar respuesta"
                          >
                            <Quote className="w-4 h-4" />
                          </button>
                        </div>
                     </div>
                     
                     {/* HTML Content Render */}
                     <div 
                        className="text-zinc-300 text-sm leading-relaxed mb-4 prose prose-invert prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: reply.content }}
                     />
                  </div>
               </div>
             ))}
          </div>
        )}

        {/* Reply Box */}
        <div id="reply-editor" className="mt-8">
          <h3 className="text-white font-bold uppercase italic mb-4">Dejar una respuesta</h3>
          
          {errorMsg && (
            <div className="mb-4 bg-red-900/20 border border-red-800 text-red-200 p-3 rounded-sm text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Error al publicar:</span>
                <span className="opacity-90">{errorMsg}</span>
              </div>
            </div>
          )}

          <div className="bg-zinc-900 border border-zinc-800 p-1 rounded-sm">
            {user ? (
               <div className="flex flex-col">
                  {/* RICH TEXT EDITOR */}
                  <RichTextEditor 
                    value={replyBody}
                    onChange={setReplyBody}
                    placeholder="Escribe tu respuesta aquí..."
                    className="border-0"
                  />
                  
                  <div className="bg-zinc-900 p-3 flex justify-end border-t border-zinc-800">
                    <button 
                      onClick={handleReplySubmit}
                      disabled={isSubmittingReply || !replyBody.trim()}
                      className="bg-racing-red hover:bg-red-600 text-white font-bold uppercase text-xs px-6 py-2.5 rounded-full flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-900/20"
                    >
                      {isSubmittingReply ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      Añadir Respuesta
                    </button>
                  </div>
               </div>
            ) : (
              <div className="text-center py-8 bg-zinc-950">
                <p className="text-zinc-500 text-sm mb-4">Recuerda cumplir las normas del foro y respetar a los demás usuarios.</p>
                <button onClick={onLoginRequest} className="bg-racing-orange text-white px-6 py-2 rounded-sm font-bold uppercase text-sm hover:bg-orange-600 transition-colors">
                  Iniciar Sesión para Responder
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black animate-fade-in pb-20 pt-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb / Back Navigation */}
        <div className="flex items-center gap-2 mb-8 text-sm text-zinc-500">
          <button onClick={() => setCurrentView('categories')} className="hover:text-white flex items-center gap-1">
             Paddock
          </button>
          {currentView !== 'categories' && (
             <>
               <ChevronRight className="w-4 h-4" />
               <button onClick={() => setCurrentView('category_topics')} className={`hover:text-white ${currentView === 'topic' || currentView === 'create_topic' ? '' : 'text-racing-orange font-bold'}`}>
                 {selectedCategory?.title || 'Foro'}
               </button>
             </>
          )}
          {currentView === 'topic' && (
             <>
               <ChevronRight className="w-4 h-4" />
               <span className="text-racing-orange font-bold truncate max-w-[200px]" dangerouslySetInnerHTML={{__html: selectedTopic?.title || ''}}></span>
             </>
          )}
          {currentView === 'create_topic' && (
             <>
               <ChevronRight className="w-4 h-4" />
               <span className="text-racing-orange font-bold">Nuevo Tema</span>
             </>
          )}
        </div>
        
        {/* Back Button for mobile convenience */}
        {currentView !== 'categories' && (
          <button onClick={goBack} className="mb-6 flex items-center gap-2 text-zinc-400 hover:text-white text-xs uppercase font-bold">
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
        )}

        {/* View Content */}
        {currentView === 'categories' && renderCategories()}
        {currentView === 'category_topics' && renderTopics()}
        {currentView === 'topic' && renderSingleTopic()}
        {currentView === 'create_topic' && renderCreateTopic()}
      </div>
    </div>
  );
};