'use client';

import { useState, useEffect } from "react";
import Image from "next/image";
import { useUser } from "@/context/auth-context";
import logo from "@/images/logo.jpg";
import logoWhite from "@/images/logo-white.png";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useUser();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

  // --- Determina il tema iniziale ---
  useEffect(() => {
    const updateTheme = () => setIsDark(document.documentElement.classList.contains('dark'));
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    const timeout = setTimeout(() => setPageLoading(false), 500);
    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, []);

  // --- Carica lo stato di autorizzazione dal localStorage ---
  useEffect(() => {
    const stored = localStorage.getItem("passwordAuthorized");
    setIsAuthorized(stored === "true");

    // --- Listener per aggiornamenti da logout o altri tab ---
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "passwordAuthorized") {
        setIsAuthorized(e.newValue === "true");
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // --- Blocca scroll se gate attivo ---
  useEffect(() => {
    if (!isAuthorized && !isAuthenticated) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [isAuthorized, isAuthenticated]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === ADMIN_PASSWORD) {
      setIsAuthorized(true);
      localStorage.setItem("passwordAuthorized", "true");
      setError("");
    } else {
      setError("Неверный пароль. Попробуйте еще раз.");
      setInput("");
    }
  };

  if (pageLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent"></div>
      </div>
    );
  }

  if (isAuthenticated) return <>{children}</>;

  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-background/80 z-50 px-4">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-center gap-6 bg-card rounded-2xl shadow-lg p-10 w-full max-w-sm transition-all"
        >
          <div className="mb-2">
            <Image
              src={isDark ? logoWhite : logo}
              alt="Logo"
              width={80}
              height={80}
              style={{ width: 'auto', height: 'auto' }}
              className="object-contain"
            />
          </div>

          <h2 className="text-2xl font-semibold text-foreground">🔒 Доступ ограничен</h2>
          <p className="text-muted-foreground text-center text-sm">
            Введите пароль для входа в панель администратора
          </p>

          <div className="w-full flex flex-col gap-1">
            <input type="text" name="username" autoComplete="username" className="hidden" />
            <input
              type="password"
              value={input}
              autoComplete="new-password"
              onChange={(e) => setInput(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg text-foreground placeholder:text-muted-foreground border ${error ? "border-destructive" : "border-border"} focus:outline-none focus:ring-2 focus:ring-primary transition-colors`}
              placeholder="Введите пароль"
              autoFocus
            />
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-lg text-lg cursor-pointer"
          >
            Войти
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}