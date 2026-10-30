// Petit « aiguilleur » placé devant le site :
// 1. renvoie les anciennes adresses de pages vers les nouvelles ;
// 2. si l'option est activée dans le back office, renvoie toute autre adresse
//    (ancien domaine, www.) vers l'adresse officielle du site, sur la même page.
// Tout le reste est servi tel quel depuis le dossier du site construit.

const PATHS = {
  "/grand-marketing": "/gros-budget/",
  "/grand-marketing/": "/gros-budget/",
};

async function readConfig(env, request) {
  try {
    const res = await env.ASSETS.fetch(new URL("/redirect-config.json", request.url));
    if (res.ok) return await res.json();
  } catch (e) {}
  return { enabled: false, target: "" };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Adresse de démonstration Cloudflare : jamais redirigée
    const isWorkersDev = url.hostname.endsWith(".workers.dev");

    if (!isWorkersDev) {
      const cfg = await readConfig(env, request);
      if (cfg.enabled && cfg.target) {
        let target;
        try { target = new URL(cfg.target); } catch (e) { target = null; }
        if (target && url.hostname !== target.hostname) {
          const dest = new URL(url.pathname + url.search, target.origin);
          if (PATHS[url.pathname]) dest.pathname = PATHS[url.pathname];
          return Response.redirect(dest.toString(), 301);
        }
      }
    }

    if (PATHS[url.pathname]) {
      return Response.redirect(new URL(PATHS[url.pathname] + url.search, url.origin).toString(), 301);
    }

    return env.ASSETS.fetch(request);
  },
};
