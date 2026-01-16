import React, { useRef, useEffect } from 'react';
import {
  Bold, Italic, Underline, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Link as LinkIcon,
  Quote, Code, Image as ImageIcon, Smile, Paperclip, Palette, Loader2
} from 'lucide-react';
import { uploadFile } from '../services/woocommerce';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, className = '' }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  // Sync external value changes to editor (only if different to avoid cursor jumps)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      // If value is empty, clear it specifically
      if (value === '') {
        editorRef.current.innerHTML = '';
      } else {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value]);

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    // Force focus back to editor
    editorRef.current?.focus();
    updateParent();
  };

  const updateParent = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
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

  // Trigger the hidden color input
  const handleColorClick = () => {
    colorInputRef.current?.click();
  };

  // Apply color when input changes
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    execCommand('foreColor', e.target.value);
  };

  const ToolbarButton = ({ icon: Icon, cmd, arg, title }: any) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault(); // Prevent losing focus from editor
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

          {/* Color Picker */}
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
        </div>
      </div>

      {/* EDITOR AREA */}
      <div
        ref={editorRef}
        contentEditable
        onInput={updateParent}
        className="min-h-[200px] p-4 text-zinc-200 focus:outline-none prose prose-invert prose-sm max-w-none bg-zinc-950"
        data-placeholder={placeholder}
        style={{ whiteSpace: 'pre-wrap' }}
      />

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
                const url = await uploadFile(file);
                execCommand('insertImage', url);
              } catch (err: any) {
                alert("Error al subir imagen: " + err.message);
              }
              setUploading(false);
              // Clear input
              e.target.value = '';
            }
          }} />
        </label>
        <span className="text-zinc-600 text-[10px] uppercase">Formatos: JPG, PNG, PDF (Max 5MB)</span>
      </div>
    </div>
  );
};