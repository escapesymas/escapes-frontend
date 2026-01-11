
import React, { useState } from 'react';
import { ArrowLeft, Send, Mail, Phone, MapPin, Loader2, CheckCircle, MessageSquare, Instagram, Facebook } from 'lucide-react';
import { STORE_CONFIG } from '../storeData';

interface ContactProps {
  onBack: () => void;
}

export const Contact: React.FC<ContactProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulación de envío
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-racing-carbon border border-zinc-800 p-8 rounded-sm max-w-lg w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/50">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-white uppercase italic mb-2">Mensaje Enviado</h2>
          <p className="text-zinc-400 mb-8">
            Hemos recibido tu consulta correctamente. Un técnico de nuestro equipo se pondrá en contacto contigo en las próximas 24 horas laborables.
          </p>
          <button 
            onClick={onBack}
            className="w-full bg-racing-orange hover:bg-orange-600 text-white font-bold uppercase py-3 rounded-sm transition-colors"
          >
            Volver a la tienda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black animate-fade-in pb-20 pt-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-white mb-8 text-xs font-bold uppercase tracking-widest transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Información de Contacto */}
          <div>
            <div className="mb-8">
              <span className="text-racing-orange font-bold uppercase tracking-[0.2em] text-xs">Punto de Servicio</span>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white uppercase italic leading-none mt-2">
                Contacta con <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-racing-orange to-red-600">Nosotros</span>
              </h1>
              <p className="text-zinc-500 mt-6 leading-relaxed max-w-md">
                ¿Tienes dudas técnicas sobre la compatibilidad de un escape o necesitas asesoramiento para tu setup? Estamos aquí para ayudarte.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-sm text-racing-orange">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase">Email Soporte</p>
                  <p className="text-white font-bold">{STORE_CONFIG.contactEmail}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-sm text-racing-orange">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase">WhatsApp Técnico</p>
                  <p className="text-white font-bold">+34 600 000 000</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-sm text-racing-orange">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase">Horario de Atención</p>
                  <p className="text-white font-bold">Lunes a Viernes: 09:00 - 18:00</p>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-zinc-900">
               <p className="text-xs font-bold text-zinc-600 uppercase mb-4">Síguenos en Pista</p>
               <div className="flex gap-4">
                  <a href="#" className="w-10 h-10 bg-zinc-900 rounded-sm flex items-center justify-center text-zinc-400 hover:bg-racing-orange hover:text-white transition-colors">
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a href="#" className="w-10 h-10 bg-zinc-900 rounded-sm flex items-center justify-center text-zinc-400 hover:bg-racing-orange hover:text-white transition-colors">
                    <Facebook className="w-5 h-5" />
                  </a>
               </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="bg-racing-carbon border border-zinc-800 p-8 rounded-sm shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-racing-orange/5 rounded-full blur-3xl"></div>
            
            <h3 className="text-white font-bold uppercase italic mb-8 border-b border-zinc-800 pb-4">
              Formulario de Consulta
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Nombre Completo</label>
                  <input 
                    required 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange}
                    className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none transition-colors"
                    placeholder="Tu nombre..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Email</label>
                  <input 
                    required 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange}
                    className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none transition-colors"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Asunto de la Consulta</label>
                <select 
                  name="subject" 
                  value={formData.subject} 
                  onChange={handleChange}
                  className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none transition-colors"
                >
                  <option value="">Selecciona una opción</option>
                  <option value="tecnico">Asesoramiento Técnico</option>
                  <option value="pedido">Estado de mi Pedido</option>
                  <option value="devolucion">Garantías y Devoluciones</option>
                  <option value="otros">Otros asuntos</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Mensaje / Consulta</label>
                <textarea 
                  required 
                  name="message" 
                  rows={5}
                  value={formData.message} 
                  onChange={handleChange}
                  className="w-full bg-zinc-950 border border-zinc-800 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none transition-colors resize-none"
                  placeholder="Explícanos brevemente qué necesitas..."
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-racing-orange hover:bg-orange-600 text-white font-black uppercase py-4 rounded-sm transition-all shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Enviar Mensaje
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
