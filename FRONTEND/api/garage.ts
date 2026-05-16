import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, schema } from "../lib/db.js";
import { eq, and } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;
  const { userEmail } = req.query; // Para simplificar esta fase inicial

  if (!userEmail) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    // Obtener ID del usuario interno por su email
    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, userEmail as string)
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no sincronizado" });
    }

    if (method === 'GET') {
      // Listar garaje
      const vehicles = await db.query.garage.findMany({
        where: eq(schema.garage.userId, user.id)
      });
      return res.status(200).json(vehicles);
    }

    if (method === 'POST') {
      // Añadir vehículo
      const { brand, model, year } = req.body;
      if (!brand || !model || !year) return res.status(400).json({ error: "Faltan datos" });

      const [newVehicle] = await db.insert(schema.garage).values({
        userId: user.id,
        brand,
        model,
        year
      }).returning();

      return res.status(201).json(newVehicle);
    }

    if (method === 'DELETE') {
      // Eliminar vehículo
      const { vehicleId } = req.body;
      if (!vehicleId) return res.status(400).json({ error: "ID requerido" });

      await db.delete(schema.garage).where(
        and(
          eq(schema.garage.id, vehicleId),
          eq(schema.garage.userId, user.id)
        )
      );

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (err: any) {
    console.error("[GARAGE API ERROR]:", err.message);
    return res.status(500).json({ error: "Error interno del servidor", detail: err.message });
  }
}
