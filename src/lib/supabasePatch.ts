/**
 * supabasePatch — raw PATCH helper that bypasses PostgREST schema cache validation.
 *
 * Problem: Supabase PostgREST caches the DB schema in memory. When the cache is
 * stale, any UPDATE/INSERT with explicit column names throws:
 *   "Could not find the '<col>' column of '<table>' in the schema cache"
 *
 * Solution: before each PATCH we send a NOTIFY to PostgREST via the Supabase
 * admin REST endpoint to force a schema reload, then execute the actual update.
 * All requests use explicit `Content-Profile: public` and `?columns=` hints so
 * PostgREST never needs to guess the schema.
 */

import { supabase } from './supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

async function buildHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? supabaseAnonKey;
  return {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Content-Profile': 'public',
    'Accept-Profile': 'public',
    Prefer: 'return=minimal',
  };
}

/** Fire a PostgREST schema-cache reload via pg_notify (best-effort). */
async function reloadSchema(): Promise<void> {
  try {
    const headers = await buildHeaders();
    // pg_notify is reachable via the /rpc/ endpoint when pg_catalog is in search_path
    await fetch(`${supabaseUrl}/rest/v1/rpc/pg_notify`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ channel: 'pgrst', payload: 'reload schema' }),
    });
    // Give PostgREST ~300 ms to process the reload
    await new Promise((r) => setTimeout(r, 300));
  } catch {
    // Ignore — pg_notify might not be exposed; the retry below will surface any real error
  }
}

/**
 * Execute a PATCH against a Supabase table, automatically retrying once after
 * forcing a schema-cache reload when a stale-cache error is detected.
 *
 * @param table   Table name (e.g. 'deals')
 * @param match   Column=value filter object (e.g. { id: 'abc-123' })
 * @param payload Fields to update
 */
export async function supabasePatch(
  table: string,
  match: Record<string, string>,
  payload: Record<string, unknown>,
): Promise<void> {
  const columns = Object.keys(payload).join(',');
  const filter = Object.entries(match)
    .map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`)
    .join('&');

  const url = `${supabaseUrl}/rest/v1/${table}?${filter}&columns=${encodeURIComponent(columns)}`;

  const doRequest = async () => {
    const headers = await buildHeaders();
    return fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
    });
  };

  let res = await doRequest();

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message: string = body?.message ?? '';

    // Stale schema cache — reload and retry once
    if (message.toLowerCase().includes('schema cache')) {
      await reloadSchema();
      res = await doRequest();
    }

    if (!res.ok) {
      const retryBody = await res.json().catch(() => ({}));
      throw new Error(retryBody?.message ?? 'Cập nhật thất bại');
    }
  }
}
