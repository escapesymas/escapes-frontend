import React from 'react';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { STORE_CONFIG, NAV_LINKS } from '../storeData';

interface FooterProps {
  onNavClick: (view: any) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavClick }) => {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800 pt-16 pb-8 text-sm">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* BRAND */}
          <div className="space-y-4">
            <div className="mb-4">
              <img 
                src={STORE_CONFIG.logoUrl} 
                alt={STORE_CONFIG.name} 
                className="h-12 w-auto object-contain" 
              />
            </div>
            <p className="text-zinc-500 leading-relaxed">
              Especialistas en sistemas de escape y recambios de alto rendimiento. 
              Elevamos tu experiencia en pista y carretera con las mejores marcas del mercado.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="w-10 h-10 bg-zinc-900 rounded-sm flex items-center justify-center text-zinc-400 hover:bg-racing-orange hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-zinc-900 rounded-sm flex items-center justify-center text-zinc-400 hover:bg-racing-orange hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-zinc-900 rounded-sm flex items-center justify-center text-zinc-400 hover:bg-racing-orange hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* QUICK LINKS */}
          <div>
            <h3 className="text-white font-bold uppercase mb-6 tracking-wide border-b border-zinc-800 pb-2 inline-block">Navegación</h3>
            <ul className="space-y-3">
              {NAV_LINKS.map((link, idx) => (
                <li key={idx}>
                  <button 
                    onClick={() => onNavClick(link.view)}
                    className="text-zinc-500 hover:text-racing-orange transition-colors flex items-center gap-2 uppercase font-bold text-xs"
                  >
                    <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full"></span>
                    {link.label}
                  </button>
                </li>
              ))}
              <li>
                <button onClick={() => onNavClick('account')} className="text-zinc-500 hover:text-racing-orange transition-colors flex items-center gap-2 uppercase font-bold text-xs">
                  <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full"></span>
                  Mi Cuenta
                </button>
              </li>
              <li>
                <button onClick={() => onNavClick('orders')} className="text-zinc-500 hover:text-racing-orange transition-colors flex items-center gap-2 uppercase font-bold text-xs">
                  <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full"></span>
                  Seguimiento de Pedidos
                </button>
              </li>
            </ul>
          </div>

          {/* CONTACT */}
          <div id="contact-section">
            <h3 className="text-white font-bold uppercase mb-6 tracking-wide border-b border-zinc-800 pb-2 inline-block">Contacto</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-racing-orange flex-shrink-0 mt-0.5" />
                <div>
                   <span className="block text-white font-bold text-xs uppercase mb-1">Dirección</span>
                   <span className="text-zinc-500 block">Polígono Industrial MotorLand<br/>44600 Alcañiz, Teruel</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-racing-orange flex-shrink-0 mt-0.5" />
                <div>
                   <span className="block text-white font-bold text-xs uppercase mb-1">Email</span>
                   <a href={`mailto:${STORE_CONFIG.contactEmail}`} className="text-zinc-500 hover:text-white transition-colors">{STORE_CONFIG.contactEmail}</a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-racing-orange flex-shrink-0 mt-0.5" />
                <div>
                   <span className="block text-white font-bold text-xs uppercase mb-1">Teléfono</span>
                   <span className="text-zinc-500">+34 900 123 456</span>
                </div>
              </li>
              <li className="pt-2">
                 <button onClick={() => onNavClick('warranty')} className="text-racing-orange hover:text-white transition-colors flex items-center gap-2 uppercase font-bold text-xs border border-racing-orange px-3 py-2 rounded-sm w-fit">
                    Gestión de Garantías
                 </button>
              </li>
            </ul>
          </div>

          {/* NEWSLETTER */}
          <div>
             <h3 className="text-white font-bold uppercase mb-6 tracking-wide border-b border-zinc-800 pb-2 inline-block">Newsletter</h3>
             <p className="text-zinc-500 mb-4 text-xs">
               Recibe ofertas exclusivas, novedades de Racing y códigos de descuento.
             </p>
             <div className="flex flex-col gap-2">
               <input 
                 type="email" 
                 placeholder="Tu email..." 
                 className="bg-zinc-900 border border-zinc-800 p-3 text-white rounded-sm focus:border-racing-orange focus:outline-none text-sm"
               />
               <button className="bg-racing-orange hover:bg-orange-600 text-white font-bold uppercase py-3 rounded-sm transition-colors text-xs tracking-widest">
                 Suscribirse
               </button>
             </div>
             <p className="text-zinc-600 text-[10px] mt-2 italic">
               *No enviamos spam. Solo adrenalina.
             </p>
          </div>
        </div>

        <div className="border-t border-zinc-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-zinc-600 text-xs">
            © 2024 {STORE_CONFIG.name}. Todos los derechos reservados.
          </p>
          <div className="flex gap-4">
             <div className="w-8 h-5 bg-zinc-800 rounded-sm opacity-50"></div>
             <div className="w-8 h-5 bg-zinc-800 rounded-sm opacity-50"></div>
             <div className="w-8 h-5 bg-zinc-800 rounded-sm opacity-50"></div>
          </div>
        </div>
      </div>
    </footer>
  );
};