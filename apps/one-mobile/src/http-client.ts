export type JsonResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

// The deadline covers both connection and response body. Mutations are never retried automatically.
export async function fetchJsonResponse(
  url: string,
  options: RequestInit = {},
  timeoutMs = 15_000,
): Promise<JsonResponse> {
  const parent = options.signal;
  const controller = new AbortController();
  const cancelled = () => Object.assign(new Error('request_cancelled'), { name: 'AbortError' });
  if (parent?.aborted) throw cancelled();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let abort: () => void = () => {};
  const deadline = new Promise<never>((_, reject) => {
    abort = () => { controller.abort(); reject(cancelled()); };
    parent?.addEventListener('abort', abort, { once: true });
    timer = setTimeout(() => {
      controller.abort();
      reject(Object.assign(new Error('request_timeout'), { name: 'TimeoutError' }));
    }, timeoutMs);
  });
  try {
    const operation = (async () => {
      const response = await fetch(url, { ...options, signal: controller.signal });
      const body: unknown = await response.json().catch(() => {
        if (response.ok && response.status !== 204) throw new Error('invalid_json_response');
        return {};
      });
      return { ok: response.ok, status: response.status, json: async () => body };
    })();
    return await Promise.race([operation, deadline]);
  } finally {
    clearTimeout(timer);
    parent?.removeEventListener('abort', abort);
  }
}
