import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, Hash, ChevronRight, ArrowLeft, Send, User, Loader2, PlusCircle, Quote, AlertCircle, CheckCircle, Pencil, Trash2, XCircle, Save } from 'lucide-react';
import { ForumTopic, ForumCategory, ForumReply, User as UserType } from '../types';
import { fetchForumCategories, fetchTopics, fetchReplies, createTopic, createReply, updateTopic, deleteTopic, updateReply, deleteReply } from '../services/forum';
import { RichTextEditor } from './RichTextEditor';

interface ForumProps {
  user: UserType | null;
  onBack: () => void;
  onLoginRequest: () => void;
}

export const Forum: React.FC<ForumProps> = ({ user, onBack, onLoginRequest }) => {
  const [currentView, setCurrentView] = useState<'categories' | 'category_topics' | 'topic' | 'create_topic'>('categories');
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [replies, setReplies] = useState<ForumReply[]>([]);
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
  const [editingId, setEditingId] = useState<number | null>(null); // ID of reply/topic being edited
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState(''); // Only for Topic OP

  useEffect(() => {
    loadCategories();
  }, []);

  // Real-time polling (Chat mode)
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (currentView === 'category_topics' && selectedCategory) {
      interval = setInterval(async () => {
        const data = await fetchTopics(selectedCategory.id);
        setTopics(data);
      }, 1000);
    } else if (currentView === 'topic' && selectedTopic) {
      interval = setInterval(async () => {
        const data = await fetchReplies(selectedTopic.id);
        setReplies(data);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentView, selectedCategory, selectedTopic]);

  const loadCategories = async () => {
    setLoading(true);
    const data = await fetchForumCategories();
    setCategories(data);
    setLoading(false);
  };

  const handleCategoryClick = async (cat: ForumCategory) => {
    setSelectedCategory(cat);
    setLoading(true);
    setCurrentView('category_topics');
    const data = await fetchTopics(cat.id);
    setTopics(data);
    setLoading(false);
  };

  const handleTopicClick = async (topic: ForumTopic) => {
    setSelectedTopic(topic);
    setLoading(true);
    setCurrentView('topic');
    const data = await fetchReplies(topic.id);
    setReplies(data);
    setLoading(false);
  };

  const handleCreateTopic = async () => {
    if (!user || !user.token) {
      onLoginRequest();
      return;
    }
    if (!newTopicTitle.trim() || !newTopicBody.trim()) {
      setErrorMsg("Debes completar el título y el contenido.");
      return;
    }

    setIsSubmitting(true);
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const result = await createTopic(user.token, selectedCategory!.id, newTopicTitle, newTopicBody);

    if (result.success) {
      setNewTopicTitle('');
      setNewTopicBody('');
      // Reload topics
      const updatedTopics = await fetchTopics(selectedCategory!.id);
      setTopics(updatedTopics);
      setCurrentView('category_topics');
      setSuccessMsg("¡Tema publicado correctamente!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setErrorMsg(result.error || "Error al crear el tema.");
    }
    setIsSubmitting(false);
  };

  const handleReplySubmit = async () => {
    if (!user || !user.token) {
      onLoginRequest();
      return;
    }
    if (!selectedTopic || !replyBody.trim()) return;

    setIsSubmittingReply(true);
    const result = await createReply(user!.token, selectedTopic.id, replyBody);

    setIsSubmittingReply(false);

    if (result.success) {
      setReplyBody('');
      // Refresh replies
      const updatedReplies = await fetchReplies(selectedTopic!.id);
      setReplies(updatedReplies);
      setSuccessMsg("¡Respuesta publicada!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setErrorMsg(result.error || "Error al responder.");
    }
  };

  const handleDelete = async (item: ForumReply) => {
    if (!user || !user.token) {
      onLoginRequest();
      return;
    }
    if (!window.confirm("¿Seguro que quieres borrar este mensaje? Esta acción no se puede deshacer.")) return;

    let success = false;
    const isTopic = item.id === selectedTopic?.id;

    if (isTopic) {
      success = await deleteTopic(user!.token, item.id);
      if (success) {
        setSuccessMsg("Tema eliminado.");
        // Go back to list
        setCurrentView('category_topics');
        const updated = await fetchTopics(selectedCategory!.id);
        setTopics(updated);
      }
    } else {
      success = await deleteReply(user!.token, item.id);
      if (success) {
        setSuccessMsg("Respuesta eliminada.");
        const updated = await fetchReplies(selectedTopic!.id);
        setReplies(updated);
      }
    }

    if (!success && !successMsg) alert("Error al eliminar.");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const startEdit = (item: ForumReply) => {
    setEditingId(item.id);
    setEditContent(item.content);
    // If it's the topic OP, we might want to edit title too, but simpler to just edit content for now or add title field if isTopic
    if (item.id === selectedTopic?.id) {
      setEditTitle(selectedTopic.title);
    }
  };

  const handleUpdate = async (item: ForumReply) => {
    if (!user || !user.token) {
      onLoginRequest();
      return;
    }
    let success = false;
    const isTopic = item.id === selectedTopic?.id;

    if (isTopic) {
      success = await updateTopic(user!.token, item.id, editTitle || selectedTopic!.title, editContent);
      if (success && selectedTopic) {
        setSelectedTopic({ ...selectedTopic, title: editTitle || selectedTopic.title }); // Optimistic update of title
      }
    } else {
      success = await updateReply(user!.token, item.id, editContent);
    }

    if (success) {
      setEditingId(null);
      setSuccessMsg("Actualizado correctamente.");
      const updated = await fetchReplies(selectedTopic!.id);
      setReplies(updated);
    } else {
      alert("Error al actualizar.");
    }
    setTimeout(() => setSuccessMsg(null), 3000);
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

  const renderCreateTopic = () => (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <h2 className="text-2xl font-bold text-white uppercase italic mb-6">Nuevo Tema en <span className="text-racing-orange">{selectedCategory?.title}</span></h2>

      {errorMsg && (
        <div className="bg-red-900/20 border border-red-800 p-3 rounded-sm mb-4 text-red-200 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /> {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="bg-green-900/20 border border-green-800 p-3 rounded-sm mb-4 text-green-200 flex items-center gap-2 animate-pulse">
          <CheckCircle className="w-5 h-5" /> {successMsg}
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
            onClick={() => setCurrentView('category_topics')}
            disabled={isSubmitting}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold uppercase py-3 px-6 rounded-sm transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black animate-fade-in pb-20 pt-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb Header */}
        <div className="flex items-center gap-2 mb-8 text-sm text-zinc-500">
          <button onClick={() => setCurrentView('categories')} className="hover:text-white flex items-center gap-1">Paddock</button>
          {currentView !== 'categories' && (
            <>
              <ChevronRight className="w-4 h-4" />
              <button onClick={() => setCurrentView('category_topics')} className="hover:text-white font-bold">
                {selectedCategory?.title || 'Foro'}
              </button>
            </>
          )}
          {currentView === 'topic' && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span className="text-racing-orange truncate max-w-[200px]">{selectedTopic?.title}</span>
            </>
          )}
        </div>

        {currentView !== 'categories' && (
          <button onClick={goBack} className="mb-6 flex items-center gap-2 text-zinc-400 hover:text-white text-xs uppercase font-bold">
            <ArrowLeft className="w-4 h-4" /> Volver
          </button>
        )}

        {/* --- VIEWS --- */}

        {/* 1. CATEGORIES */}
        {currentView === 'categories' && (
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

        {/* 2. TOPIC LIST */}
        {currentView === 'category_topics' && (
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
                onClick={() => user ? setCurrentView('create_topic') : onLoginRequest()}
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
                  onClick={() => user ? setCurrentView('create_topic') : onLoginRequest()}
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
                  <ChevronRight className="w-5 h-5 text-zinc-700" />
                </div>
              ))
            )}
          </div>
        )}

        {/* 3. CREATE TOPIC */}
        {currentView === 'create_topic' && renderCreateTopic()}

        {/* 4. TOPIC DETAIL (READ & REPLY) */}
        {currentView === 'topic' && selectedTopic && (
          <div className="max-w-4xl mx-auto">
            {/* Original Post */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-sm mb-6 overflow-hidden">
              <div className="p-6 border-b border-zinc-800 bg-zinc-950/50">
                <div className="flex items-center gap-2 text-racing-orange text-xs font-bold uppercase mb-2">
                  <Hash className="w-3 h-3" /> {selectedCategory?.title}
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white uppercase italic leading-tight" dangerouslySetInnerHTML={{ __html: selectedTopic.title }}></h1>
              </div>

              {/* Replies List (First one is the OP content usually) */}
              <div className="divide-y divide-zinc-800">
                {loading ? (
                  <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-racing-orange" /></div>
                ) : replies.map((reply, index) => (
                  <div key={reply.id} className={`p-6 rounded-sm border ${index === 0 ? 'bg-zinc-900 border-zinc-700' : 'bg-zinc-900/50 border-zinc-800'}`}>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 text-center">
                        {reply.authorAvatar ? (
                          <img src={reply.authorAvatar} alt={reply.author} className="w-10 h-10 rounded-full object-cover mx-auto mb-2" />
                        ) : (
                          <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-2">
                            <User className="w-6 h-6 text-zinc-500" />
                          </div>
                        )}
                        <span className="text-xs font-bold text-zinc-400 block">{reply.authorRole || 'Racer'}</span>
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-bold text-zinc-200 block">{reply.author}</span>
                            <span className="text-xs text-zinc-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {reply.date}
                              {index === 0 && <span className="ml-2 bg-racing-orange/20 text-racing-orange px-1.5 rounded text-[10px]">OP</span>}
                            </span>
                          </div>
                          {/* Edit/Delete Actions */}
                          {user && user.id === reply.authorId && (
                            <div className="flex gap-2">
                              <button onClick={() => startEdit(reply)} className="text-zinc-500 hover:text-white" title="Editar">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(reply)} className="text-zinc-500 hover:text-red-500" title="Borrar">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Content or Editor */}
                        {editingId === reply.id ? (
                          <div className="space-y-3">
                            {/* Title Editor for OP */}
                            {index === 0 && (
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 p-2 text-white font-bold mb-2"
                                placeholder="Título del tema"
                              />
                            )}
                            <RichTextEditor value={editContent} onChange={setEditContent} className="min-h-[150px]" />
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => setEditingId(null)} className="px-3 py-1 text-zinc-400 hover:text-white flex items-center gap-1">
                                <XCircle className="w-4 h-4" /> Cancelar
                              </button>
                              <button onClick={() => handleUpdate(reply)} className="px-3 py-1 bg-green-700 text-white hover:bg-green-600 flex items-center gap-1 rounded-sm">
                                <Save className="w-4 h-4" /> Guardar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-zinc-300 prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: reply.content }} />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reply Box */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-sm">
              <h3 className="text-white font-bold uppercase italic mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-racing-orange" /> Responder al tema
              </h3>

              {successMsg && (
                <div className="bg-green-900/20 border border-green-800 p-3 rounded-sm mb-4 text-green-200 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" /> {successMsg}
                </div>
              )}

              {user ? (
                <div className="space-y-4">
                  <RichTextEditor
                    value={replyBody}
                    onChange={setReplyBody}
                    placeholder="Escribe tu respuesta aquí..."
                    className="bg-zinc-950"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleReplySubmit}
                      disabled={isSubmittingReply || !replyBody.trim()}
                      className="bg-racing-orange hover:bg-orange-600 text-white font-bold uppercase py-3 px-8 rounded-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSubmittingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Publicar Respuesta
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-950 border border-zinc-800 p-8 text-center rounded-sm">
                  <p className="text-zinc-400 mb-4">Debes estar identificado para participar en la conversación.</p>
                  <button onClick={onLoginRequest} className="bg-zinc-800 hover:bg-white hover:text-black text-white font-bold uppercase py-2 px-6 rounded-sm transition-colors">
                    Iniciar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};