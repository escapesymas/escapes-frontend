'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { Loader2, Minus, Plus, Save, X } from 'lucide-react';

/** Lado en píxeles de la foto que se sube (el servidor la deja en 512 px WebP). */
const OUTPUT_SIZE = 512;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

interface AvatarCropModalProps {
  /** Foto elegida, como data: URL (la CSP de la web no admite blob: en img-src). */
  imageSrc: string;
  isSaving: boolean;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}

/** Recorta el área elegida a un cuadrado de OUTPUT_SIZE px en JPEG. */
async function cropToBlob(imageSrc: string, area: Area): Promise<Blob> {
  const img = new Image();
  img.src = imageSrc;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Tu navegador no permite recortar la imagen.');
  // Fondo blanco: las zonas transparentes de un PNG saldrían negras en JPEG.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se ha podido recortar la imagen.'))), 'image/jpeg', 0.92);
  });
}

export default function AvatarCropModal({ imageSrc, isSaving, onCancel, onConfirm }: AvatarCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [error, setError] = useState('');
  const [isCropping, setIsCropping] = useState(false);
  const busy = isSaving || isCropping;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onCancel]);

  const handleCropComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), []);

  const handleSave = async () => {
    if (!area) return;
    setError('');
    setIsCropping(true);
    try {
      onConfirm(await cropToBlob(imageSrc, area));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se ha podido recortar la imagen.');
    } finally {
      setIsCropping(false);
    }
  };

  const stepZoom = (delta: number) => setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(z + delta).toFixed(2))));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-crop-title"
        className="bg-card border border-card-border rounded-2xl shadow-2xl w-full max-w-md p-5 flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <h3 id="avatar-crop-title" className="font-mono font-bold text-foreground uppercase text-sm">Recorta tu foto</h3>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="p-1.5 text-text-muted hover:text-foreground cursor-pointer disabled:opacity-50"
            aria-label="Cancelar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-950">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            aspect={1}
            showGrid
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>

        <p className="text-[11px] text-text-muted font-mono text-center">Arrastra la foto para encuadrarla y usa el zoom para acercarla.</p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => stepZoom(-0.25)}
            className="p-2 rounded-lg border border-card-border text-text-muted hover:text-foreground cursor-pointer"
            aria-label="Alejar"
          >
            <Minus className="w-4 h-4" />
          </button>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-accent cursor-pointer"
            aria-label="Zoom"
          />
          <button
            type="button"
            onClick={() => stepZoom(0.25)}
            className="p-2 rounded-lg border border-card-border text-text-muted hover:text-foreground cursor-pointer"
            aria-label="Acercar"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <p role="alert" className="text-[11px] font-mono text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">{error}</p>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 py-2.5 bg-background border border-card-border text-xs font-mono font-bold uppercase tracking-wider rounded-xl text-foreground hover:bg-select-bg transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={busy || !area}
            className="flex-1 py-2.5 bg-accent text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-accent-hover transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar foto
          </button>
        </div>
      </div>
    </div>
  );
}
