"use client";
import { useState, useRef, useEffect } from "react";
import { X, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import supabase from "../../lib/supabaseClient";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: Readonly<AuthModalProps>) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  const { login, register, isLoading, resetPassword, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isOpen && modalRef.current) {
      setTimeout(() => {
        const input = modalRef.current?.querySelector("input");
        input?.focus();
      }, 100);
    }
  }, [isOpen, isLogin, showReset]);

  useEffect(() => {
    if (!isLogin && password) {
      let strength = 0;
      if (password.length >= 8) strength++;
      if (/[A-Z]/.test(password)) strength++;
      if (/\d/.test(password)) strength++;
      if (/[^A-Za-z0-9]/.test(password)) strength++;
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [password, isLogin]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password || (!isLogin && (!name || !lastname))) {
      setError("Todos los campos son obligatorios.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("Email inválido.");
      return;
    }
    if (!isLogin && name.length < 2) {
      setError("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    if (!isLogin && lastname.length < 2) {
      setError("El apellido debe tener al menos 2 caracteres.");
      return;
    }
    if (!isLogin && password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    try {
      if (isLogin) {
        await login(email, password);
        // Consultar el rol directamente tras login
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('email', email)
          .single();
        if (!userError && userData?.role === 'admin') {
          router.push('/admin');
        }
      } else {
        await register(email, password, name, lastname);
        setError('Confirma tu correo electrónico para activar tu cuenta.<br>¿Necesitas ayuda? <a href="mailto:soporte@stylehub.com" class="underline text-red-400">Contáctanos</a>');
        return;
      }
    } catch (err) {
      let msg = err instanceof Error ? err.message : "Ocurrió un error";
      if (msg.toLowerCase().includes("not allowed") || msg.toLowerCase().includes("email not confirmed") || msg.toLowerCase().includes("correo no verificado") || msg.toLowerCase().includes("not accepted")) {
        msg = "Tu cuenta aún no ha sido verificada. Por favor revisa tu correo y confirma tu cuenta antes de iniciar sesión.";
      }
      if (msg.toLowerCase().includes("json object requested, multiple (or no) rows returned")) {
        msg = "No se pudo iniciar sesión. Verifica tus datos o contacta soporte si el problema persiste.";
      }
      setError(msg);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg("");
    try {
      await resetPassword(resetEmail);
      setResetMsg("Correo de recuperación enviado. Revisa tu bandeja de entrada.");
      setResetEmail("");
    } catch (err) {
      setResetMsg(err instanceof Error ? err.message : "Error al enviar el correo");
    }
  };

  const getBarClass = () => {
    switch (passwordStrength) {
      case 1: return "bg-red-400 w-1/4";
      case 2: return "bg-yellow-400 w-2/4";
      case 3: return "bg-blue-400 w-3/4";
      case 4: return "bg-green-500 w-full";
      default: return "bg-gray-200 w-0";
    }
  };

  const getTitle = () => {
    if (showReset) return "Recuperar contraseña";
    if (isLogin) return "Bienvenido de Vuelta";
    return "Crear Cuenta";
  };
  const getSubtitle = () => {
    if (showReset) return "Te enviaremos un enlace para restablecer tu contraseña.";
    if (isLogin) return "Inicia sesión en tu cuenta";
    return "Únete a StyleHub hoy";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 bg-opacity-70">
      <div
        ref={modalRef}
        className="relative bg-slate-900 rounded-2xl w-full max-w-lg mx-4 shadow-2xl animate-modalPop overflow-hidden sm:p-0 p-0 pb-8 text-white"
        style={{ minWidth: "340px", maxWidth: "480px" }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          <X size={24} />
        </button>
        <div className="bg-gradient-to-r from-slate-900 to-red-400 py-8 px-8 sm:px-12 rounded-t-2xl text-center mb-8 flex flex-col items-center justify-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            {showReset ? (
              <Mail size={28} className="text-white drop-shadow" />
            ) : isLogin ? (
              <User size={28} className="text-white drop-shadow" />
            ) : (
              <Lock size={28} className="text-white drop-shadow" />
            )}
            <h2 className="text-2xl font-bold text-white tracking-tight">{getTitle()}</h2>
          </div>
          <p className="text-red-100">{getSubtitle()}</p>
        </div>
        {error && (
          <div className="mb-6 text-red-400 text-xs text-center bg-red-900/30 rounded p-3 animate-shake">
            <span dangerouslySetInnerHTML={{ __html: error.replace(/\n/g, '<br />') }} />
          </div>
        )}
        {isLoading && (
          <div className="mb-6 text-red-400 text-xs text-center bg-red-900/30 rounded p-3 animate-pulse">
            Procesando...
          </div>
        )}
        {showReset ? (
          <form onSubmit={handleReset} className="space-y-6 px-4 sm:px-6 flex flex-col justify-center items-center w-full max-w-sm mx-auto">
            <div className="relative mb-4 w-full">
              <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full pl-10 pr-4 py-4 border border-slate-700 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-400 text-white py-4 rounded-lg font-semibold hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow mb-2"
            >
              {isLoading ? "Enviando..." : "Enviar correo de recuperación"}
            </button>
            {resetMsg && <div className="text-center text-sm mt-3 text-green-400 font-medium animate-fadeIn">{resetMsg}</div>}
            <button
              type="button"
              className="w-full text-xs text-red-400 mt-3 hover:underline"
              onClick={() => {
                setShowReset(false);
                setIsLogin(true);
                setResetEmail("");
                setResetMsg("");
                setError("");
              }}
            >
              Volver a iniciar sesión
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 px-4 sm:px-6">
            {!isLogin && (
              <div className="flex flex-col sm:flex-row gap-4 mb-2">
                <div className="relative flex-1">
                  <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre"
                    required
                    minLength={2}
                    className="w-full pl-10 pr-4 py-4 border border-slate-700 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400 transition-all"
                  />
                </div>
                <div className="relative flex-1">
                  <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={lastname}
                    onChange={(e) => setLastname(e.target.value)}
                    placeholder="Apellido"
                    required
                    minLength={2}
                    className="w-full pl-10 pr-4 py-4 border border-slate-700 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400 transition-all"
                  />
                </div>
              </div>
            )}
            <div className="relative mb-2">
              <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full pl-10 pr-4 py-4 border border-slate-700 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400 transition-all"
              />
            </div>
            <div className="relative mb-2">
              <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (!isLogin) {
                    let strength = 0;
                    if (e.target.value.length >= 8) strength++;
                    if (/[A-Z]/.test(e.target.value)) strength++;
                    if (/\d/.test(e.target.value)) strength++;
                    if (/[^A-Za-z0-9]/.test(e.target.value)) strength++;
                    setPasswordStrength(strength);
                  }
                }}
                placeholder="Contraseña"
                required
                minLength={6}
                className="w-full pl-10 pr-12 py-4 border border-slate-700 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400 transition-all"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary"
                tabIndex={0}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {/* Barra de seguridad de contraseña y recomendaciones solo en registro */}
            {!isLogin && (
              <>
                <div className="w-full h-2 rounded bg-gray-200 mt-3 mb-3">
                  <div className={`h-2 rounded transition-all duration-300 ${getBarClass()}`}></div>
                </div>
                <ul className="text-xs text-gray-500 mb-3 pl-4 list-disc">
                  <li>Al menos 8 caracteres</li>
                  <li>Una letra mayúscula</li>
                  <li>Un número</li>
                  <li>Un símbolo especial</li>
                </ul>
              </>
            )}
            {/* Confirmación de contraseña solo en registro */}
            {!isLogin && (
              <div className="relative mb-2">
                <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmar contraseña"
                  required
                  minLength={6}
                className="w-full pl-10 pr-12 py-4 border border-slate-700 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400 transition-all"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary"
                  tabIndex={0}
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? "Ocultar confirmación" : "Mostrar confirmación"}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-400 text-white py-4 rounded-lg font-semibold hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow mb-2"
            >
              {isLogin ? "Iniciar Sesión" : isLoading ? "Cargando..." : "Crear Cuenta"}
            </button>
            {isLogin && (
              <button
                type="button"
                className="w-full text-xs text-red-400 mt-3 hover:underline"
                onClick={() => setShowReset(true)}
              >
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </form>
        )}
        <div className="mt-8 text-center pb-2">
          <p className="text-slate-400 text-base">
            {isLogin ? "¿No tienes una cuenta? " : "¿Ya tienes una cuenta? "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setEmail("");
                setPassword("");
                setName("");
                setLastname("");
                setShowReset(false);
                setResetEmail("");
                setResetMsg("");
                setConfirmPassword("");
                setPasswordStrength(0);
              }}
              className="text-slate-300 font-semibold hover:underline focus:outline-none"
            >
              {isLogin ? "Registrarse" : "Iniciar Sesión"}
            </button>
          </p>
          <p className="text-xs mt-4 text-slate-400">
            ¿Necesitas ayuda? <a href="mailto:soporte@stylehub.com" className="underline text-red-400">Contáctanos</a>
          </p>
        </div>
      </div>
    </div>
  );
}