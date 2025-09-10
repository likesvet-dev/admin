'use client';

import { useState, useRef, useEffect } from "react";
import { User } from "lucide-react";
import { useUser } from "@/context/auth-context";

export function UserMenu() {
  const { user, logout } = useUser();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
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
          {/* Mostra email sopra il logout */}
          <div className="px-4 py-2 border-b border-border text-sm text-foreground font-medium">
            {user?.email || "Unknown"}
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