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
  // Renderizado de icono principal
  function renderMainIcon() {
    if (showReset) return <Mail size={28} className="text-white drop-shadow" />;
    if (isLogin) return <User size={28} className="text-white drop-shadow" />;
    return <Lock size={28} className="text-white drop-shadow" />;
  }

  // Renderizado de texto del botón principal
  function getMainButtonText() {
    if (isLogin) return "Iniciar Sesión";
    if (isLoading) return "Cargando...";
    return "Crear Cuenta";
  }
  const [successMsg, setSuccessMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
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
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  // Referencias para mensajes y primer input
  const errorRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
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

  // Enfocar mensaje relevante cuando aparece
  useEffect(() => {
    if (error && errorRef.current) errorRef.current.focus();
    else if (infoMsg && infoRef.current) infoRef.current.focus();
    else if (successMsg && successRef.current) successRef.current.focus();
  }, [error, infoMsg, successMsg]);

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

  // Cerrar modal al hacer clic fuera
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
      // Limpiar estados al cerrar
      setError("");
      setSuccessMsg("");
      setInfoMsg("");
      setResendMsg("");
      setResendLoading(false);
      setShowReset(false);
      setResetEmail("");
      setResetMsg("");
      setEmail("");
      setPassword("");
      setName("");
      setLastname("");
      setConfirmPassword("");
      setPasswordStrength(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setInfoMsg("");
    // Validaciones claras y específicas
    if (!email || !password || (!isLogin && (!name || !lastname))) {
      setError("Por favor completa todos los campos requeridos.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("El correo electrónico no es válido. Verifica el formato.");
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
      setError("Las contraseñas no coinciden. Por favor verifica ambas.");
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
        setError("");
        setInfoMsg("");
        setSuccessMsg('¡Inicio de sesión exitoso! Bienvenido a StyleHub. Serás redirigido al inicio...');
        setTimeout(() => {
          if (!userError && userData?.role === 'admin') {
            router.push('/admin');
          } else {
            router.push('/');
          }
          setSuccessMsg("");
          onClose();
        }, 1800);
      } else {
        await register(email, password, name, lastname);
        setSuccessMsg('¡Registro exitoso! Confirma tu correo electrónico para activar tu cuenta.<br>Si no recibiste el correo revisa tu bandeja de spam o <a href="mailto:soporte@stylehub.com" class="underline text-red-400">contáctanos</a>.');
        setError("");
        setInfoMsg("");
        return;
      }
    } catch (err) {
      let msg = err instanceof Error ? err.message : "Ocurrió un error inesperado.";
      if (msg.toLowerCase().includes("not allowed") || msg.toLowerCase().includes("email not confirmed") || msg.toLowerCase().includes("correo no verificado") || msg.toLowerCase().includes("not accepted")) {
        setInfoMsg("Primero debes verificar tu correo electrónico. Revisa tu bandeja de entrada y confirma tu cuenta antes de iniciar sesión.");
        msg = "";
      }
      if (msg.toLowerCase().includes("json object requested, multiple (or no) rows returned")) {
        msg = "No se pudo iniciar sesión. Verifica tus datos o contacta soporte si el problema persiste.";
      }
      if (msg.toLowerCase().includes("invalid login credentials")) {
        msg = "Credenciales incorrectas. Verifica tu correo y contraseña.";
      }
      if (msg.toLowerCase().includes("network error")) {
        msg = "No se pudo conectar con el servidor. Intenta de nuevo más tarde.";
      }
      if (msg.toLowerCase().includes("already registered")) {
        setInfoMsg("Este correo ya está registrado. Si no recibiste el correo de confirmación, revisa tu bandeja de spam o solicita un nuevo correo.");
        msg = "";
      }
      setError(msg);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg("");
    if (!resetEmail) {
      setResetMsg("Por favor ingresa tu correo electrónico.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(resetEmail)) {
      setResetMsg("El correo electrónico no es válido. Verifica el formato.");
      return;
    }
    try {
      await resetPassword(resetEmail);
      setResetMsg("¡Listo! Te enviamos un correo para restablecer tu contraseña. Revisa tu bandeja de entrada y spam.");
      setResetEmail("");
    } catch (err) {
      let msg = err instanceof Error ? err.message : "Error al enviar el correo.";
      if (msg.toLowerCase().includes("network error")) {
        msg = "No se pudo conectar con el servidor. Intenta de nuevo más tarde.";
      }
      setResetMsg(msg);
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-[#1a1a1a]/80 transition-opacity duration-500"
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={modalRef}
        className="relative bg-gradient-to-br from-[#2d2327] via-[#2d2327] to-[#1a1a1a] rounded-3xl w-full max-w-lg mx-4 shadow-3xl animate-modalPop overflow-hidden sm:p-0 p-0 pb-8 text-white border border-[#d7263d]/30 scale-95 transition-transform duration-300"
        style={{ minWidth: "340px", maxWidth: "480px" }}
      >
        <div className="relative">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-[#ff6f61] via-[#d7263d] to-[#2d2327] rounded-t-3xl z-0 blur-[2px]" />
          <button
            type="button"
            tabIndex={0}
            onClick={e => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-5 right-5 p-2 text-white hover:text-[#ff6f61] transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff6f61] z-20 rounded-full bg-[#2d2327]/60 shadow-lg"
            aria-label="Cerrar modal"
            autoFocus
          >
            <X size={26} />
          </button>
          <div className="relative flex flex-col items-center justify-center pt-8 pb-6 px-8 sm:px-12 z-10">
            <div className="flex flex-col items-center justify-center gap-2 mb-2">
              <span className="rounded-full bg-[#ff6f61]/10 p-3 shadow-lg border border-[#ff6f61]/20">
                {renderMainIcon()}
              </span>
              <h2 className="text-2xl font-extrabold text-white tracking-tight drop-shadow-lg mb-1">{getTitle()}</h2>
              <p className="text-base text-white/80 font-medium mt-0 mb-0 drop-shadow px-4 text-center leading-relaxed">{getSubtitle()}</p>
            </div>
          </div>
        </div>
        <div className="overflow-y-auto max-h-[80vh] px-0 sm:px-0 mt-2">
          {error?.trim() && (
            <div className="mb-8 flex flex-col items-center justify-center text-center animate-fadeInDown">
              <div
                ref={errorRef}
                tabIndex={-1}
                role="alert"
                aria-live="assertive"
                className="bg-gradient-to-br from-red-700 via-red-500/90 to-red-400/80 border border-red-500 rounded-xl px-5 py-5 w-full max-w-sm shadow-4xl outline-none"
              >
                <span className="font-semibold text-base flex items-center gap-3 mb-2">
                  <span className="rounded-full bg-red-500 p-2 shadow-lg"><X size={18} className="text-white"/></span>
                  <span className="text-white">¡Ups! Ocurrió un error:</span>
                </span>
                <div className="mt-2 text-sm text-white" dangerouslySetInnerHTML={{ __html: error.replace(/\n/g, '<br />') }} />
              </div>
            </div>
          )}
          {infoMsg && (
            <div className="mb-8 flex flex-col items-center justify-center text-center animate-fadeInDown">
              <div
                ref={infoRef}
                tabIndex={-1}
                role="status"
                aria-live="polite"
                className="bg-gradient-to-br from-blue-700 via-blue-500/90 to-blue-400/80 border border-blue-500 rounded-xl px-5 py-5 w-full max-w-sm shadow-4xl outline-none"
              >
                <span className="font-semibold text-base flex items-center gap-3 mb-2">
                  <span className="rounded-full bg-blue-500 p-2 shadow-lg"><Mail size={18} className="text-white"/></span>
                  <span className="text-white">Información:</span>
                </span>
                <div className="mt-2 text-sm text-white" dangerouslySetInnerHTML={{ __html: infoMsg.replace(/\n/g, '<br />') }} />
                {/* Mostrar botón de reenviar si el mensaje indica que el correo no está confirmado y es login */}
                {isLogin && infoMsg.toLowerCase().includes("verificar tu correo") && (
                  <div className="mt-4">
                    <button
                      type="button"
                      aria-label="Reenviar correo de confirmación"
                      disabled={resendLoading}
                      className="bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300 text-white px-5 py-3 rounded-lg font-semibold shadow hover:scale-[1.04] hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-400"
                      onClick={async () => {
                        setResendLoading(true);
                        setResendMsg("");
                        try {
                          const { error } = await supabase.auth.resend({ type: "signup", email });
                          if (error) {
                            setResendMsg("No se pudo reenviar el correo. Intenta de nuevo o contáctanos.");
                          } else {
                            setResendMsg("¡Correo de confirmación reenviado! Revisa tu bandeja de entrada y spam.");
                          }
                        } catch {
                          setResendMsg("Ocurrió un error inesperado. Intenta más tarde.");
                        }
                        setResendLoading(false);
                      }}
                    >
                      {resendLoading ? <span aria-live="polite">Enviando...</span> : <span>Reenviar correo de confirmación</span>}
                    </button>
                    {resendMsg && (
                      <div className={`mt-3 text-sm font-medium animate-fadeIn ${resendMsg.includes("¡Correo") ? "text-green-400" : "text-red-400"}`} role="alert" aria-live="assertive">
                        {resendMsg}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          {successMsg && (
            <div className="mb-8 flex flex-col items-center justify-center text-center animate-fadeInDown">
              <div
                ref={successRef}
                tabIndex={-1}
                role="status"
                aria-live="polite"
                className="bg-gradient-to-br from-green-700 via-green-500/90 to-green-400/80 border border-green-500 rounded-xl px-5 py-5 w-full max-w-sm shadow-4xl outline-none"
              >
                <span className="font-semibold text-base flex items-center gap-3 mb-2">
                  <span className="rounded-full bg-green-500 p-2 shadow-lg"><User size={18} className="text-white"/></span>
                  <span className="text-white">¡Registro exitoso!</span>
                </span>
                <div className="mt-2 text-sm text-white" dangerouslySetInnerHTML={{ __html: successMsg.replace(/\n/g, '<br />') }} />
                <div className="mt-4">
                  <button
                    type="button"
                    aria-label="Reenviar correo de confirmación"
                    disabled={resendLoading}
                    className="bg-gradient-to-r from-green-500 via-green-400 to-green-300 text-white px-5 py-3 rounded-lg font-semibold shadow hover:scale-[1.04] hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-400"
                    onClick={async () => {
                      setResendLoading(true);
                      setResendMsg("");
                      try {
                        const { error } = await supabase.auth.resend({ type: "signup", email });
                        if (error) {
                          setResendMsg("No se pudo reenviar el correo. Intenta de nuevo o contáctanos.");
                        } else {
                          setResendMsg("¡Correo de confirmación reenviado! Revisa tu bandeja de entrada y spam.");
                        }
                      } catch {
                        setResendMsg("Ocurrió un error inesperado. Intenta más tarde.");
                      }
                      setResendLoading(false);
                    }}
                  >
                    {resendLoading ? <span aria-live="polite">Enviando...</span> : <span>Reenviar correo de confirmación</span>}
                  </button>
                  {resendMsg && (
                    <div className={`mt-3 text-sm font-medium animate-fadeIn ${resendMsg.includes("¡Correo") ? "text-green-400" : "text-red-400"}`} role="alert" aria-live="assertive">
                      {resendMsg}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {resetMsg && (
            <div className="mb-8 flex flex-col items-center justify-center text-center animate-fadeInDown">
              <div className="bg-gradient-to-br from-[#2d2327] via-[#d7263d]/80 to-[#ff6f61]/40 border border-[#ff6f61] rounded-xl px-5 py-5 w-full max-w-sm shadow-4xl">
                <span className="font-semibold text-base flex items-center gap-3 mb-2">
                  <span className="rounded-full bg-gradient-to-br from-[#ff6f61] via-[#d7263d] to-[#2d2327] p-2 shadow-lg"><Lock size={18} className="text-white"/></span>
                  <span className="text-white">¡Listo!</span>
                </span>
                <div className="mt-2 text-sm text-white">{resetMsg}</div>
              </div>
            </div>
          )}
          {isLoading && (
            <div className="mb-8 flex flex-col items-center justify-center text-center animate-bounceIn">
              <div className="bg-gradient-to-br from-yellow-400 via-yellow-300/90 to-yellow-200/80 border border-yellow-400 rounded-xl px-5 py-5 w-full max-w-sm shadow-4xl outline-none">
                <span className="font-semibold text-base text-yellow-900 mb-2 flex items-center gap-2"><User size={18} className="text-yellow-900"/> Procesando...</span>
                <div className="mt-2 text-sm text-yellow-900">Por favor espera unos segundos.</div>
              </div>
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
                className="w-full bg-gradient-to-r from-[#ff6f61] via-[#d7263d] to-[#2d2327] text-white py-4 rounded-xl font-semibold hover:scale-[1.03] hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow mb-2"
              >
                {isLoading ? "Enviando..." : "Enviar correo de recuperación"}
              </button>
              {resetMsg && <div className="text-center text-sm mt-3 text-green-400 font-medium animate-fadeIn">{resetMsg}</div>}
              <button
                type="button"
                className="w-full text-xs text-[#ff6f61] mt-3 hover:underline hover:text-[#d7263d] transition-colors"
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
                className="w-full bg-gradient-to-r from-[#ff6f61] via-[#d7263d] to-[#2d2327] text-white py-4 rounded-xl font-semibold hover:scale-[1.03] hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow mb-2"
              >
                {getMainButtonText()}
              </button>
              {isLogin && (
                <button
                  type="button"
                  className="w-full text-xs text-[#ff6f61] mt-3 hover:underline hover:text-[#d7263d] transition-colors"
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
                className="text-[#ff6f61] font-semibold hover:underline hover:text-[#d7263d] transition-colors focus:outline-none"
              >
                {isLogin ? "Registrarse" : "Iniciar Sesión"}
              </button>
            </p>
            <p className="text-xs mt-4 text-[#ff6f61]">
              ¿Necesitas ayuda? <a href="mailto:soporte@stylehub.com" className="underline text-[#ff6f61] hover:text-[#d7263d] transition-colors">Contáctanos</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}