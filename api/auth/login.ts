import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { username, password } = req.body;

  const wp = await fetch(process.env.WC_URL + "/wp-json/jwt-auth/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await wp.json();
  res.status(200).json(data);
}
