async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("API request failed");
    throw error;
  }
  return res.json();
}

export { fetcher };