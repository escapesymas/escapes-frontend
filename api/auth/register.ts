import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { username, email, password } = req.body;

  try {
    const wp = await fetch(process.env.WC_URL + "/wp-json/wp/v2/users", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(
          process.env.WC_CONSUMER_KEY + ":" + process.env.WC_CONSUMER_SECRET
        ).toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        email,
        password,
        roles: ["customer"],
      }),
    });

    const data = await wp.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: "Registration failed" });
  }
}
