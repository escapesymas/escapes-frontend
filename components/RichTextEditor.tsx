import React, { useRef, useEffect, useState } from 'react';
import {
  Bold, Italic, Underline, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Link as LinkIcon,
  Quote, Code, Image as ImageIcon, Smile, Paperclip, Palette, Loader2, AtSign
} from 'lucide-react';
import { uploadFile, searchUsers } from '../services/woocommerce';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, className = '' }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Mentions State
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState<{ id: number; name: string; avatar: string }[]>([]);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [mentionIndex, setMentionIndex] = useState(0);

  // Sync external value changes to editor (only if different to avoid cursor jumps)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      if (value === '') {
        editorRef.current.innerHTML = '';
      } else {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value]);

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateParent();
  };

  const updateParent = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    checkMentionTrigger();
  };

  const checkMentionTrigger = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;
    const text = textNode.textContent || '';
    const cursor = range.startOffset;

    // Look for @ before cursor
    const lastAt = text.lastIndexOf('@', cursor);

    if (lastAt !== -1 && lastAt < cursor) {
      const query = text.substring(lastAt + 1, cursor);
      // Limit query length for sanity
      if (query.length <= 20) {
        setMentionQuery(query);
        setShowMentions(true);

        // Get coordinates for dropdown
        const rect = range.getBoundingClientRect();
        if (editorRef.current) {
          const editorRect = editorRef.current.getBoundingClientRect();
          setMentionPosition({
            top: rect.bottom - editorRect.top + 10,
            left: rect.left - editorRect.left
          });
        }
        return;
      }
    }
    setShowMentions(false);
  };

  useEffect(() => {
    if (showMentions && mentionQuery.length >= 1) {
      const timer = setTimeout(async () => {
        const users = await searchUsers(mentionQuery);
        setMentionResults(users);
        setMentionIndex(0);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setMentionResults([]);
    }
  }, [showMentions, mentionQuery]);

  const insertMention = (user: { id: number; name: string }) => {
    const selection = window.getSelection();
    if (!selection) return;

    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;
    const text = textNode.textContent || '';
    const cursor = range.startOffset;
    const lastAt = text.lastIndexOf('@', cursor);

    if (lastAt !== -1) {
      // Restore range to safe state
      range.setStart(textNode, lastAt);
      range.setEnd(textNode, cursor); // Delete specifically from @ to cursor
      range.deleteContents();

      // Create mention link
      const link = document.createElement('a');
      link.href = `/profile/${user.id}`;
      link.className = 'text-racing-orange font-bold hover:underline';
      link.contentEditable = 'false';
      link.innerText = `@${user.name}`;

      range.insertNode(link);

      // Add space after
      const space = document.createTextNode('\u00A0');
      range.setStartAfter(link);
      range.setEndAfter(link);
      range.insertNode(space);

      // Move cursor after space
      range.setStartAfter(space);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);

      setShowMentions(false);
      updateParent();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions && mentionResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % mentionResults.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + mentionResults.length) % mentionResults.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(mentionResults[mentionIndex]);
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    }
  };

  const handleLink = () => {
    const url = prompt('Introduce la URL:');
    if (url) execCommand('createLink', url);
  };

  const handleImage = () => {
    const url = prompt('Introduce la URL de la imagen:');
    if (url) execCommand('insertImage', url);
  };

  const handleColorClick = () => {
    colorInputRef.current?.click();
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    execCommand('foreColor', e.target.value);
  };

  const ToolbarButton = ({ icon: Icon, cmd, arg, title }: any) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        if (typeof cmd === 'function') cmd();
        else execCommand(cmd, arg);
      }}
      className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-sm transition-colors"
      title={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className={`flex flex-col border border-zinc-700 rounded-sm overflow-hidden bg-zinc-900 ${className}`}>
      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-zinc-800 border-b border-zinc-700">
        <div className="flex items-center gap-0.5 border-r border-zinc-700 pr-2 mr-1">
          <ToolbarButton icon={Bold} cmd="bold" title="Negrita" />
          <ToolbarButton icon={Italic} cmd="italic" title="Cursiva" />
          <ToolbarButton icon={Underline} cmd="underline" title="Subrayado" />

          <div className="relative flex items-center">
            <ToolbarButton icon={Palette} cmd={handleColorClick} title="Color de texto" />
            <input
              ref={colorInputRef}
              type="color"
              onChange={handleColorChange}
              className="absolute top-0 left-0 w-0 h-0 opacity-0 invisible"
            />
          </div>
        </div>

        <div className="flex items-center gap-0.5 border-r border-zinc-700 pr-2 mr-1">
          <ToolbarButton icon={AlignLeft} cmd="justifyLeft" title="Alinear Izquierda" />
          <ToolbarButton icon={AlignCenter} cmd="justifyCenter" title="Centrar" />
          <ToolbarButton icon={AlignRight} cmd="justifyRight" title="Alinear Derecha" />
        </div>

        <div className="flex items-center gap-0.5 border-r border-zinc-700 pr-2 mr-1">
          <ToolbarButton icon={List} cmd="insertUnorderedList" title="Lista Puntos" />
          <ToolbarButton icon={ListOrdered} cmd="insertOrderedList" title="Lista Numérica" />
        </div>

        <div className="flex items-center gap-0.5">
          <ToolbarButton icon={LinkIcon} cmd={handleLink} title="Insertar Enlace" />
          <ToolbarButton icon={Quote} cmd="formatBlock" arg="blockquote" title="Cita" />
          <ToolbarButton icon={Code} cmd="formatBlock" arg="pre" title="Código" />
          <ToolbarButton icon={ImageIcon} cmd={handleImage} title="Insertar Imagen" />
          <ToolbarButton icon={Smile} cmd={() => execCommand('insertText', '😊')} title="Emoji" />
          <ToolbarButton icon={AtSign} cmd={() => execCommand('insertText', '@')} title="Mencionar" />
        </div>
      </div>

      {/* EDITOR AREA */}
      <div
        ref={editorRef}
        contentEditable
        onInput={updateParent}
        onKeyDown={handleKeyDown}
        className="min-h-[200px] p-4 text-zinc-200 focus:outline-none prose prose-invert prose-sm max-w-none bg-zinc-950 relative"
        data-placeholder={placeholder}
        style={{ whiteSpace: 'pre-wrap' }}
      />

      {/* MENTION LIST */}
      {showMentions && mentionResults.length > 0 && (
        <div
          className="absolute z-50 bg-zinc-900 border border-zinc-700 rounded-sm shadow-xl w-64 overflow-hidden animate-fade-in"
          style={{ top: mentionPosition.top, left: mentionPosition.left }}
        >
          {mentionResults.map((user, idx) => (
            <div
              key={user.id}
              className={`p-2 flex items-center gap-2 cursor-pointer ${idx === mentionIndex ? 'bg-racing-orange text-white' : 'hover:bg-zinc-800 text-zinc-300'}`}
              onClick={() => insertMention(user)}
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 bg-zinc-700 rounded-full" />
              )}
              <span className="text-sm font-bold truncate">{user.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* FOOTER / ATTACHMENTS */}
      <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center gap-4">
        <label className={`cursor-pointer flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 px-3 py-1.5 rounded-sm text-xs font-bold text-zinc-300 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Paperclip className="w-3 h-3" />}
          {uploading ? 'Subiendo...' : 'Seleccionar archivo'}
          <input type="file" disabled={uploading} className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              if (file.size > 10 * 1024 * 1024) {
                alert("El archivo excede 10MB");
                return;
              }

              setUploading(true);
              try {
                const { url } = await uploadFile(file);
                execCommand('insertImage', url);
              } catch (err: any) {
                alert("Error al subir imagen: " + err.message);
              }
              setUploading(false);
              e.target.value = '';
            }
          }} />
        </label>
        <span className="text-zinc-600 text-[10px] uppercase">Formatos: JPG, PNG, PDF (Max 10MB)</span>
      </div>
    </div>
  );
};