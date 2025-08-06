"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// --- Helpers fuera del componente ---
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string) {
  if (!email.trim()) return "El correo electrónico es requerido";
  if (!emailRegex.test(email.trim())) return "Formato de correo electrónico inválido";
  return "";
}

function validateForm({
  email,
  password,
  isLogin,
  name,
  lastname,
  confirmPassword,
}: {
  email: string;
  password: string;
  isLogin: boolean;
  name: string;
  lastname: string;
  confirmPassword: string;
}) {
  const validationErrors: string[] = [];
  const emailError = validateEmail(email);
  if (emailError) validationErrors.push(emailError);

  if (!password) {
    validationErrors.push("La contraseña es requerida");
  } else if (password.length < 8) {
    validationErrors.push("La contraseña debe tener al menos 8 caracteres");
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    validationErrors.push("La contraseña debe contener al menos una mayúscula, una minúscula y un número");
  }

  if (!isLogin) {
    if (!name.trim()) {
      validationErrors.push("El nombre es requerido");
    } else if (name.trim().length < 2) {
      validationErrors.push("El nombre debe tener al menos 2 caracteres");
    }
    if (!lastname.trim()) {
      validationErrors.push("El apellido es requerido");
    } else if (lastname.trim().length < 2) {
      validationErrors.push("El apellido debe tener al menos 2 caracteres");
    }
    if (password !== confirmPassword) {
      validationErrors.push("Las contraseñas no coinciden");
    }
  }
  return validationErrors;
}

function getErrorMessage(err: unknown): string {
  let msg = err instanceof Error ? err.message : "Error desconocido";
  if (msg.includes("Invalid login credentials")) {
    return "Correo electrónico o contraseña incorrectos";
  } else if (msg.includes("User already registered")) {
    return "Este correo electrónico ya está registrado. Intenta iniciar sesión";
  } else if (msg.includes("Password should be at least 6 characters")) {
    return "La contraseña debe tener al menos 6 caracteres";
  } else if (msg.includes("Unable to validate email address")) {
    return "Formato de correo electrónico inválido";
  }
  return msg;
}

function getPasswordStrength(password: string): number {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  return strength;
}

function getBarClass(passwordStrength: number) {
  switch (passwordStrength) {
    case 1:
      return "bg-red-400 w-1/4";
    case 2:
      return "bg-yellow-400 w-2/4";
    case 3:
      return "bg-blue-400 w-3/4";
    case 4:
      return "bg-green-500 w-full";
    default:
      return "bg-gray-200 w-0";
  }
}

function renderMainIcon(isLogin: boolean, showReset: boolean) {
  if (showReset) return <Mail size={40} className="text-white drop-shadow-lg" />;
  if (isLogin) return <User size={40} className="text-white drop-shadow-lg" />;
  return <Lock size={40} className="text-white drop-shadow-lg" />;
}

function getMainButtonText(isLogin: boolean, isLoading: boolean) {
  if (isLogin) return "Iniciar Sesión";
  if (isLoading) return "Cargando...";
  return "Crear Cuenta";
}

function getTitle(isLogin: boolean, showReset: boolean) {
  if (showReset) return "Recuperar contraseña";
  if (isLogin) return "Bienvenido de Vuelta";
  return "Crear Cuenta";
}

function getSubtitle(isLogin: boolean, showReset: boolean) {
  if (showReset) return "Te enviaremos un enlace para restablecer tu contraseña.";
  if (isLogin) return "Inicia sesión en tu cuenta";
  return "Únete a StyleHub hoy";
}

// Subcomponents for rendering messages and forms
function AuthMessages({
  error,
  infoMsg,
  successMsg,
  errorRef,
  infoRef,
  successRef,
  showResendButton,
  resendLoading,
  resendMsg,
  resendVerification,
  setResendLoading,
  setResendMsg,
  pendingRedirect,
  user,
}: any) {
  return (
    <>
      {(error?.trim() || infoMsg || successMsg) && (
        <div className="mb-6 flex flex-col items-center justify-center text-center animate-fadeInDown">
          {error?.trim() && (
            <div
              ref={errorRef}
              tabIndex={-1}
              role="alert"
              aria-live="assertive"
              className="bg-gradient-to-br from-red-700 via-red-500/90 to-red-400/80 border border-red-500 rounded-xl px-5 py-5 w-full max-w-sm shadow-4xl outline-none mb-2"
            >
              <span className="font-semibold text-base flex items-center gap-3 mb-2">
                <span className="rounded-full bg-red-500 p-2 shadow-lg"><X size={18} className="text-white"/></span>
                <span className="text-white">¡Ups! Ocurrió un error:</span>
              </span>
              <div className="mt-2 text-sm text-white">
                {error.split("\n").map((line: string) => (
                  <span key={line}>{line}<br /></span>
                ))}
              </div>
              {showResendButton && (
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
                        await resendVerification();
                        setResendMsg("¡Correo de confirmación reenviado! Revisa tu bandeja de entrada y spam.");
                      } catch (error: unknown) {
                        const msg = error instanceof Error ? error.message : "No se pudo reenviar el correo. Intenta de nuevo o contáctanos.";
                        setResendMsg(msg);
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
          )}
          {infoMsg && (
            <div
              ref={infoRef}
              tabIndex={-1}
              aria-live="polite"
              className="bg-gradient-to-br from-blue-700 via-blue-500/90 to-blue-400/80 border border-blue-500 rounded-xl px-5 py-5 w-full max-w-sm shadow-4xl outline-none mb-2"
            >
              <span className="font-semibold text-base flex items-center gap-3 mb-2">
                <span className="rounded-full bg-blue-500 p-2 shadow-lg"><Mail size={18} className="text-white"/></span>
                <span className="text-white">Información:</span>
              </span>
              <div className="mt-2 text-sm text-white">
                {infoMsg.split("\n").map((line: string) => (
                  <span key={line}>{line}<br /></span>
                ))}
              </div>
            </div>
          )}
          {successMsg && (
            <div
              ref={successRef}
              tabIndex={-1}
              aria-live="polite"
              className="bg-gradient-to-br from-green-700 via-green-500/90 to-green-400/80 border border-green-500 rounded-xl px-5 py-5 w-full max-w-sm shadow-4xl outline-none mb-2"
            >
              <span className="font-semibold text-base flex items-center gap-3 mb-2">
                <span className="rounded-full bg-green-500 p-2 shadow-lg"><User size={18} className="text-white"/></span>
                <span className="text-white">¡Exitoso!</span>
              </span>
              <div className="mt-2 text-sm text-white">
                {successMsg.split("\n").map((line: string) => (
                  <span key={line}>{line}<br /></span>
                ))}
              </div>
              {pendingRedirect && !user && (
                <div className="mt-4 text-center">
                  <span className="text-gray-200 text-base font-semibold">Procesando inicio de sesión...</span>
                </div>
              )}
              {showResendButton && (
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
                        await resendVerification();
                        setResendMsg("¡Correo de confirmación reenviado! Revisa tu bandeja de entrada y spam.");
                      } catch (error: unknown) {
                        const msg = error instanceof Error ? error.message : "No se pudo reenviar el correo. Intenta de nuevo o contáctanos.";
                        setResendMsg(msg);
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
          )}
        </div>
      )}
    </>
  );
}

function AuthForm({
  isLogin,
  name,
  setName,
  lastname,
  setLastname,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  confirmPassword,
  setConfirmPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  passwordStrength,
  setPasswordStrength,
  isLoading,
  handleSubmit,
  setShowReset,
}: any) {
  return (
    <form onSubmit={handleSubmit} className="space-y-6 px-4 sm:px-6">
      {!isLogin && (
        <div className="flex flex-col sm:flex-row gap-4 mb-2">
          <div className="relative flex-1">
            <label htmlFor="name" className="sr-only">Nombre</label>
            <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nombre"
              required
              minLength={2}
              className="w-full pl-10 pr-4 py-4 border border-slate-700 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400 transition-all"
            />
          </div>
          <div className="relative flex-1">
            <label htmlFor="lastname" className="sr-only">Apellido</label>
            <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              id="lastname"
              type="text"
              value={lastname}
              onChange={e => setLastname(e.target.value)}
              placeholder="Apellido"
              required
              minLength={2}
              className="w-full pl-10 pr-4 py-4 border border-slate-700 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400 transition-all"
            />
          </div>
        </div>
      )}
      <div className="relative mb-2">
        <label htmlFor="email" className="sr-only">Correo electrónico</label>
        <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="w-full pl-10 pr-4 py-4 border border-slate-700 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400 transition-all"
        />
      </div>
      <div className="relative mb-2">
        <label htmlFor="password" className="sr-only">Contraseña</label>
        <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <input
          id="password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={e => {
            setPassword(e.target.value);
            if (!isLogin) {
              setPasswordStrength(getPasswordStrength(e.target.value));
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
          onClick={() => setShowPassword((v: boolean) => !v)}
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
      {!isLogin && (
        <>
          <div className="w-full h-2 rounded bg-gray-200 mt-3 mb-3">
            <div className={`h-2 rounded transition-all duration-300 ${getBarClass(passwordStrength)}`} />
          </div>
          <ul className="text-xs text-gray-500 mb-3 pl-4 list-disc">
            <li>Al menos 8 caracteres</li>
            <li>Una letra mayúscula</li>
            <li>Un número</li>
            <li>Un símbolo especial</li>
          </ul>
          <div className="relative mb-2">
            <label htmlFor="confirmPassword" className="sr-only">Confirmar contraseña</label>
            <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirmar contraseña"
              required
              minLength={6}
              className="w-full pl-10 pr-12 py-4 border border-slate-700 rounded-lg bg-slate-800 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400 transition-all"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary"
              tabIndex={0}
              onClick={() => setShowConfirmPassword((v: boolean) => !v)}
              aria-label={showConfirmPassword ? "Ocultar confirmación" : "Mostrar confirmación"}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </>
      )}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-[#ff6f61] via-[#d7263d] to-[#2d2327] text-white py-4 rounded-xl font-semibold hover:scale-[1.03] hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow mb-2"
      >
        {getMainButtonText(isLogin, isLoading)}
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
  );
}

function ResetForm({
  resetEmail,
  setResetEmail,
  isLoading,
  handleReset,
  resetMsg,
  setShowReset,
  setIsLogin,
  setResetMsg,
  setError,
}: any) {
  return (
    <form onSubmit={handleReset} className="space-y-6 px-4 sm:px-6">
      <div className="relative mb-4 w-full">
        <label htmlFor="resetEmail" className="sr-only">Correo electrónico</label>
        <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        <input
          id="resetEmail"
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
  );
}

export default function AuthModal({ isOpen, onClose }: Readonly<AuthModalProps>) {
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
  const [showResendButton, setShowResendButton] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDialogElement>(null);
  const { login, register, isLoading, resetPassword, resendVerification, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isOpen && modalRef.current) {
      const timer = setTimeout(() => {
        const input = modalRef.current?.querySelector("input");
        if (input) input.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen, isLogin, showReset]);

  useEffect(() => {
    if (error && errorRef.current) errorRef.current.focus();
    else if (infoMsg && infoRef.current) infoRef.current.focus();
    else if (successMsg && successRef.current) successRef.current.focus();
  }, [error, infoMsg, successMsg]);

  useEffect(() => {
    if (!isLogin && password) {
      setPasswordStrength(getPasswordStrength(password));
    } else {
      setPasswordStrength(0);
    }
  }, [password, isLogin]);

  useEffect(() => {
    if (pendingRedirect && user?.email) {
      setSuccessMsg("");
      onClose();
      
      // Verificar si hay una redirección pendiente desde el checkout
      const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
      if (redirectUrl) {
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(redirectUrl);
      } else if (user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
      
      setPendingRedirect(false);
    }
  }, [pendingRedirect, user, router, onClose]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
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
        setShowResendButton(false);
      }
    },
    [onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === "Escape") handleOverlayClick(e as unknown as React.MouseEvent<HTMLElement>);
    },
    [handleOverlayClick]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError("");
      setSuccessMsg("");
      setInfoMsg("");
      setShowResendButton(false);

      const validationErrors = validateForm({ email, password, isLogin, name, lastname, confirmPassword });

      if (validationErrors.length > 0) {
        setError(validationErrors.join(". "));
        return;
      }

      try {
        if (isLogin) {
          await login(email.trim().toLowerCase(), password);
          setError("");
          setInfoMsg("");
          setSuccessMsg("¡Inicio de sesión exitoso! Bienvenido a StyleHub. Serás redirigido al inicio...");
          setPendingRedirect(true);
        } else {
          await register(email.trim().toLowerCase(), password, name.trim(), lastname.trim());
          setSuccessMsg("¡Registro exitoso! Confirma tu correo electrónico para activar tu cuenta. Si no recibiste el correo revisa tu bandeja de spam o contáctanos.");
          setError("");
          setInfoMsg("");
          setShowResendButton(true);
          return;
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err));
        setSuccessMsg("");
        setInfoMsg("");
        const msg = err instanceof Error ? err.message.toLowerCase() : "";
        if (msg.includes("email not confirmed") || msg.includes("email no confirmado")) {
          setShowResendButton(true);
        }
        setPendingRedirect(false);
      }
    },
    [email, password, isLogin, name, lastname, confirmPassword, login, register]
  );

  const handleReset = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setResetMsg("");
      const emailError = validateEmail(resetEmail);
      if (emailError) {
        setResetMsg(emailError);
        return;
      }
      try {
        await resetPassword(resetEmail);
        setResetMsg("¡Listo! Te enviamos un correo para restablecer tu contraseña. Revisa tu bandeja de entrada y spam.");
        setResetEmail("");
      } catch (err: unknown) {
        let msg = err instanceof Error ? err.message : "Error al enviar el correo.";
        if (typeof msg === "string" && msg.toLowerCase().includes("network error")) {
          msg = "No se pudo conectar con el servidor. Intenta de nuevo más tarde.";
        }
        setResetMsg(msg);
      }
    },
    [resetEmail, resetPassword]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-[#1a1a1a]/80 transition-opacity duration-500">
      <button
        className="absolute inset-0 w-full h-full bg-transparent border-none outline-none cursor-default"
        onClick={handleOverlayClick}
        onKeyDown={handleKeyDown}
        aria-label="Cerrar modal haciendo clic fuera del contenido"
        type="button"
      />
      <dialog
        ref={modalRef}
        className="relative bg-gradient-to-br from-[#2d2327] via-[#2d2327] to-[#1a1a1a] rounded-3xl w-full max-w-lg mx-4 shadow-3xl animate-modalPop overflow-hidden sm:p-0 p-0 pb-8 text-white border border-[#d7263d]/30 scale-95 transition-transform duration-300 z-10"
        style={{ minWidth: "340px", maxWidth: "480px" }}
        open
      >
        {/* Header */}
        <div className="relative w-full h-44 bg-gradient-to-br from-[#ff6f61] via-[#d7263d] to-[#2d2327] rounded-t-3xl flex flex-col items-center justify-center z-10 pt-8 pb-8 shadow-lg">
          <span className="rounded-full bg-[#ff6f61]/20 p-5 shadow-xl border border-[#ff6f61]/30 mb-3 flex items-center justify-center">
            {renderMainIcon(isLogin, showReset)}
          </span>
          <h2 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-xl mb-2 text-center leading-tight">{getTitle(isLogin, showReset)}</h2>
          <p className="text-lg text-white/80 font-medium mt-0 mb-0 drop-shadow px-6 text-center leading-relaxed">{getSubtitle(isLogin, showReset)}</p>
        </div>
        <div className="w-full h-6" />
        <button
          type="button"
          tabIndex={0}
          onClick={e => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 text-white hover:text-[#ff6f61] transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff6f61] z-20 rounded-full bg-[#2d2327]/60 shadow-lg"
          aria-label="Cerrar modal"
        >
          <X size={26} />
        </button>
        <div className="overflow-y-auto max-h-[70vh] px-0 sm:px-0 mt-2">
          <AuthMessages
            error={error}
            infoMsg={infoMsg}
            successMsg={successMsg}
            errorRef={errorRef}
            infoRef={infoRef}
            successRef={successRef}
            showResendButton={showResendButton}
            resendLoading={resendLoading}
            resendMsg={resendMsg}
            resendVerification={resendVerification}
            setResendLoading={setResendLoading}
            setResendMsg={setResendMsg}
            pendingRedirect={pendingRedirect}
            user={user}
          />
          {showReset ? (
            <ResetForm
              resetEmail={resetEmail}
              setResetEmail={setResetEmail}
              isLoading={isLoading}
              handleReset={handleReset}
              resetMsg={resetMsg}
              setShowReset={setShowReset}
              setIsLogin={setIsLogin}
              setResetMsg={setResetMsg}
              setError={setError}
            />
          ) : (
            <AuthForm
              isLogin={isLogin}
              name={name}
              setName={setName}
              lastname={lastname}
              setLastname={setLastname}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              showConfirmPassword={showConfirmPassword}
              setShowConfirmPassword={setShowConfirmPassword}
              passwordStrength={passwordStrength}
              setPasswordStrength={setPasswordStrength}
              isLoading={isLoading}
              handleSubmit={handleSubmit}
              setShowReset={setShowReset}
            />
          )}
          <div className="mt-8 text-center pb-2">
            <p className="text-slate-400 text-base">
              {isLogin ? "¿No tienes una cuenta? " : "¿Ya tienes una cuenta? "}
              <button
                type="button"
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
                  setSuccessMsg("");
                  setShowResendButton(false);
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
      </dialog>
    </div>
  );
}
