export interface Session {
  token: string;
  user_email: string;
  user_display_name: string;
}

const KEY = "escapesymas_session";
const API = "https://backendescapes.com/wp-json";

// =====================
// AUTH API
// =====================

export async function registerUser(data: {
  username: string;
  email: string;
  password: string;
}) {
  const res = await fetch(`${API}/escapes/v1/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/j
