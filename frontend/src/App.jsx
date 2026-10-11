import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function isValidUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResult(null);

    const trimmed = url.trim();
    if (!isValidUrl(trimmed)) {
      setError("Please enter a valid URL starting with http:// or https://");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed.");
      setResult(data);
    } catch (err) {
      setError(err.message || "Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <main className="mx-auto max-w-2xl px-5 py-14">
        <h1 className="text-3xl font-bold">AI Web Summarizer</h1>
        <p className="mt-1.5 mb-7 text-slate-500">
          Paste a link and get a short AI summary of the page.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 sm:flex-row">
          <input
            type="text"
            placeholder="https://example.com/article"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-3 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {loading ? "Loading..." : "Summarize"}
          </button>
        </form>

        {loading && (
          <div className="mt-6 flex items-center gap-2.5 text-slate-600">
            <span className="h-4.5 w-4.5 animate-spin rounded-full border-[3px] border-indigo-200 border-t-indigo-600" />
            Loading... reading the page and generating a summary
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-red-700">
            {error}
          </div>
        )}

        {result && (
          <article className="mt-6 rounded-xl bg-white p-6 shadow-md">
            <h2 className="mb-3 text-xl font-semibold">{result.title}</h2>
            <p className="mb-4 whitespace-pre-wrap leading-relaxed">{result.summary}</p>
            <small className="text-slate-400">
              {result.charactersRead.toLocaleString()} characters analysed
            </small>
          </article>
        )}
      </main>
    </div>
  );
}