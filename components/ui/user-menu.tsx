'use client';

import { useState, useRef, useEffect } from "react";
import { User } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export function UserMenu() {
  const { userId, signOut } = useAuth(); 
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await signOut();
  };

  // --- Chiude il dropdown se clicchi fuori ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Se non c'è userId (utente non loggato), non mostrare il menu
  if (!userId) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Pulsante principale con icona user */}
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-2 rounded-md border border-border hover:bg-muted transition cursor-pointer text-sm flex items-center justify-center"
      >
        <User className="w-5 h-5" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50">
          {/* Mostra l'ID utente (potresti voler aggiungere l'email in futuro) */}
          <div className="px-4 py-2 border-b border-border text-sm text-foreground font-medium">
            User ID: {userId.substring(0, 8)}... {/* Mostra solo i primi 8 caratteri per sicurezza */}
          </div>

          <button
            onClick={() => {
              setOpen(false);
              handleLogout();
            }}
            className="w-full text-left px-4 py-2 hover:bg-destructive/10 text-destructive cursor-pointer"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}