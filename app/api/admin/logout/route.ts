// app/api/admin/logout/route.ts
import prismadb from "@/lib/prismadb";
import { getUserFromRequest, logoutResponse } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // Ottieni l'utente (se presente) dalla request — compatibile con edge/runtime
    const user = await getUserFromRequest(req);

    // Incrementa tokenVersion per logout globale (se abbiamo un utente)
    if (user) {
      await prismadb.admin.update({
        where: { id: user.userId },
        data: { tokenVersion: { increment: 1 } },
      });
    }

    // Restituisci la response che cancella i cookie HttpOnly
    return logoutResponse();
  } catch (err) {
    console.error("LOGOUT ERROR", err);
    // In caso di errore, comunque cancella i cookie
    return logoutResponse();
  }
}