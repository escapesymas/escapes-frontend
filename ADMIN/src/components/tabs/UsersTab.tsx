import React from 'react';
import * as Icons from 'lucide-react';

interface UsersTabProps {
  users: any[];
}

/**
 * UsersTab — Listado de Usuarios Registrados
 *
 * Muestra la tabla de usuarios del sistema con su ID, nombre, email, rol y fecha de registro.
 */
const UsersTab: React.FC<UsersTabProps> = ({ users }) => {
  return (
    <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-900 text-[10px] text-zinc-500 uppercase tracking-widest font-black">
              <th className="pb-4">ID</th>
              <th className="pb-4">Nombre Completo</th>
              <th className="pb-4">Email</th>
              <th className="pb-4">Rol</th>
              <th className="pb-4">Fecha Registro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/50">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-zinc-500 italic">No hay usuarios registrados.</td>
              </tr>
            ) : users.map((u) => (
              <tr key={u.id} className="hover:bg-white/[0.01]">
                <td className="py-4 font-mono text-xs text-zinc-500">#{u.id}</td>
                <td className="py-4 font-bold text-white">
                  {u.firstName || 'Cliente'} {u.lastName || ''}
                </td>
                <td className="py-4 font-mono text-xs text-zinc-400">{u.email}</td>
                <td className="py-4">
                  <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                    u.role === 'admin'
                      ? 'bg-red-950/20 text-red-500 border border-red-900/30'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                  }`}>
                    {u.role || 'customer'}
                  </span>
                </td>
                <td className="py-4 text-xs text-zinc-500">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-ES') : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersTab;
