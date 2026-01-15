import { useState } from "react";
import { registerUser, saveSession } from "../services/auth";
import { ArrowLeft, UserPlus, Loader2 } from "lucide-react";

interface RegisterProps {
  onRegisterSuccess: () => void;
  onBack: () => void;
  onGoToLogin: () => void;
}

export function Register({ onRegisterSuccess, onBack, onGoToLogin }: RegisterProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!username || !email || !password) {
      setError("Por favor, completa todos los campos obligatorios");
      return;
    }

    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      setLoading(true);

      const res = await registerUser({
        username,
        email,
        password,
      });

      saveSession(res);
      onRegisterSuccess();
    } catch (err: any) {
      setError(err.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-4">
      <div className="max-w-md mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-bold uppercase text-xs tracking-widest">Volver</span>
        </button>

        <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-8">
          <div className="flex items-center gap-3 mb-8">
            <UserPlus className="w-8 h-8 text-racing-orange" />
            <h1 className="text-2xl font-bold text-white uppercase italic">Crear Cuenta</h1>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-sm mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nombre"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-black border border-zinc-800 text-white px-4 py-3 rounded-sm placeholder-zinc-600 focus:border-racing-orange focus:outline-none transition-colors"
              />
              <input
                type="text"
                placeholder="Apellidos"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-black border border-zinc-800 text-white px-4 py-3 rounded-sm placeholder-zinc-600 focus:border-racing-orange focus:outline-none transition-colors"
              />
            </div>

            <input
              type="text"
              placeholder="Usuario *"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-black border border-zinc-800 text-white px-4 py-3 rounded-sm placeholder-zinc-600 focus:border-racing-orange focus:outline-none transition-colors"
            />

            <input
              type="email"
              placeholder="Email *"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-black border border-zinc-800 text-white px-4 py-3 rounded-sm placeholder-zinc-600 focus:border-racing-orange focus:outline-none transition-colors"
            />

            <input
              type="password"
              placeholder="Contraseña *"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-black border border-zinc-800 text-white px-4 py-3 rounded-sm placeholder-zinc-600 focus:border-racing-orange focus:outline-none transition-colors"
            />

            <input
              type="password"
              placeholder="Confirmar contraseña *"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full bg-black border border-zinc-800 text-white px-4 py-3 rounded-sm placeholder-zinc-600 focus:border-racing-orange focus:outline-none transition-colors"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-racing-orange hover:bg-orange-600 text-white font-bold uppercase py-3 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                "Crear cuenta"
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
            <p className="text-zinc-500 text-sm">
              ¿Ya tienes una cuenta?{" "}
              <button
                onClick={onGoToLogin}
                className="text-racing-orange hover:text-white font-bold transition-colors"
              >
                Iniciar sesión
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
