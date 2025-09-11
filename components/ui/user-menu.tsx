'use client';

import { useState, useRef, useEffect } from "react";
import { User } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export function UserMenu() {
  const { email, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    localStorage.setItem('passwordAuthorized', 'false');
    await signOut();
  };

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

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-2 rounded-md border border-border hover:bg-muted transition cursor-pointer text-sm flex items-center justify-center"
      >
        <User className="w-5 h-5" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50">
          {/* Mostra l'email */}
          <div className="px-4 py-2 border-b border-border text-sm text-foreground font-medium">
            {email || ''}
          </div>

          <button
            onClick={() => {
              setOpen(false);
              handleLogout();
            }}
            className="w-full text-left px-4 py-2 hover:bg-destructive/10 text-destructive cursor-pointer"
          >
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}