
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is missing from the .env file.");
}

export async function apiRequest(
  endpoint,
  { method = "GET", body, headers = {}, ...options } = {},
) {
  const isFormData = body instanceof FormData;

  const response = await fetch(
    `${API_BASE_URL.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`,
    {
      ...options,
      method,
      credentials: "include",
      headers: {
        ...(!isFormData && body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
        ...headers,
      },
      ...(body !== undefined
        ? { body: isFormData ? body : JSON.stringify(body) }
        : {}),
    },
  );

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error = new Error(
      typeof data === "object" && data?.message
        ? data.message
        : `Request failed with status ${response.status}.`,
    );

    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export default apiRequest;
