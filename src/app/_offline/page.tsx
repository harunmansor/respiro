export const metadata = { title: "Offline — Freedive" };

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 text-5xl">🌊</div>
      <h1 className="text-2xl font-semibold tracking-tight text-foam-100">
        You’re offline
      </h1>
      <p className="mt-3 text-foam-200/70">
        This page isn’t cached yet. Reconnect to load it — pages you’ve already
        visited stay available offline.
      </p>
    </main>
  );
}
