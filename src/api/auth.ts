export type User = {
  id: string;
  userName?: string | null;
  email?: string | null;
  role?: string | null;
};

const auth_base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:5176";
const api_base = `${auth_base.replace(/\/+$/, "")}/api`;

const safeJson = async <T>(res: Response): Promise<T | null> => {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
};

export async function getCurrentUser(): Promise<User | null> {
  const res = await fetch(`${api_base}/auth/user`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (res.status === 401 || res.status === 403) return null;
  if (!res.ok) throw new Error(`GET /api/auth/user failed (${res.status})`);

  const data = await safeJson<User>(res);
  return data ?? null;
}

export async function login(email: string, password: string): Promise<User> {
  const res = await fetch(`${api_base}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ userName: email, password }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Login failed (${res.status})`);
  }

  const data = await safeJson<User>(res);
  return data ?? { id: "unknown", email };
}

export async function logout(): Promise<void> {
  await fetch(`${api_base}/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
}
