// Configuration Eleventy — Grand Marketing, Petit Budget
// Transforme les articles (Markdown) et les modèles en pages HTML dans _site/

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

function slugify(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function (eleventyConfig) {
  // ---------- Fichiers copiés tels quels ----------
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/images": "images" });
  eleventyConfig.addPassthroughCopy({ "src/admin": "admin" });
  eleventyConfig.addPassthroughCopy({ "src/favicon.svg": "favicon.svg" });

  // ---------- Brouillons : visibles en local, jamais publiés ----------
  eleventyConfig.addPreprocessor("brouillons", "md", (data) => {
    if (data.draft && process.env.ELEVENTY_RUN_MODE === "build") {
      return false;
    }
  });

  // ---------- Markdown : identifiants sur les intertitres (pour le sommaire) ----------
  eleventyConfig.amendLibrary("md", (md) => {
    md.set({ html: true, typographer: true });
    const defaultOpen = md.renderer.rules.heading_open || ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
    md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      if (token.tag === "h2" || token.tag === "h3") {
        const text = tokens[idx + 1].children.map((t) => t.content).join("");
        token.attrSet("id", slugify(text));
      }
      return defaultOpen(tokens, idx, options, env, self);
    };
  });

  // ---------- Collection des articles (du plus récent au plus ancien) ----------
  eleventyConfig.addCollection("articles", (api) =>
    api.getFilteredByGlob("src/articles/**/*.md").sort((a, b) => b.date - a.date)
  );

  // ---------- Filtres utilisés dans les modèles ----------
  eleventyConfig.addFilter("dateFr", (d) => {
    const date = new Date(d);
    return `${date.getUTCDate()} ${MOIS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
  });
  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString().slice(0, 10));
  eleventyConfig.addFilter("slug", slugify);

  eleventyConfig.addFilter("byTrack", (items, track) => (items || []).filter((a) => a.data.track === track));
  eleventyConfig.addFilter("byCategory", (items, cat) => (items || []).filter((a) => a.data.category === cat));
  eleventyConfig.addFilter("exceptUrl", (items, url) => (items || []).filter((a) => a.url !== url));
  eleventyConfig.addFilter("findBySlug", (items, slug) => (items || []).find((a) => a.fileSlug === slug));
  eleventyConfig.addFilter("featuredFirst", (items) => {
    const list = items || [];
    return list.find((a) => a.data.featured) || list[0];
  });
  eleventyConfig.addFilter("category", (slug, categories) =>
    (categories || []).find((c) => c.slug === slug) || { slug, name: slug, color: "#AE8AEA", description: "" }
  );

  // Temps de lecture : ~200 mots par minute (texte + chapô + étapes)
  eleventyConfig.addFilter("readingTime", (article) => {
    const d = article.data || {};
    const steps = (d.steps || []).map((s) => `${s.title || ""} ${s.text || ""}`).join(" ");
    const raw = String(article.rawInput || article.content || "");
    const text = `${raw} ${d.chapo || ""} ${steps}`.replace(/<[^>]+>/g, " ");
    const words = text.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  });

  // Sommaire : liste des intertitres H2 du contenu rendu
  eleventyConfig.addFilter("toc", (html) => {
    const out = [];
    const re = /<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g;
    let m;
    while ((m = re.exec(html || ""))) out.push({ id: m[1], text: m[2].replace(/<[^>]+>/g, "") });
    return out;
  });

  eleventyConfig.addFilter("absoluteUrl", (path, base) => {
    // Tolère une adresse saisie sans « https:// » ou avec un « / » final
    let b = String(base || "").trim().replace(/\/+$/, "");
    if (b && !/^https?:\/\//i.test(b)) b = "https://" + b;
    try { return new URL(path || "/", b + "/").href; } catch { return path; }
  });
  // Textes du back office : retours à la ligne, paragraphes et listes « - » conservés
  eleventyConfig.addFilter("rich", (str) => {
    const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const lines = String(str || "").replace(/\r\n?/g, "\n").trim().split("\n").map((l) => l.trim());
    let out = "";
    let prev = null; // "text" | "li" | "gap"
    for (const line of lines) {
      if (!line) {
        if (prev && prev !== "gap") { out += '<span class="rich-gap"></span>'; prev = "gap"; }
        continue;
      }
      const m = line.match(/^[-–•*]\s+(.*)$/);
      if (m) {
        out += '<span class="rich-li">' + esc(m[1]) + "</span>";
        prev = "li";
      } else {
        if (prev === "text") out += "<br>";
        out += esc(line);
        prev = "text";
      }
    }
    return out;
  });
  eleventyConfig.addFilter("truncate", (str, n = 155) => {
    const s = String(str || "").replace(/\s+/g, " ").trim();
    return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s;
  });
  eleventyConfig.addFilter("json", (v) => JSON.stringify(v));
  eleventyConfig.addFilter("head", (arr, n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter("jsonScript", (v) => JSON.stringify(v).replace(/</g, "\\u003c"));
  // Garde les deux derniers mots ensemble (évite une coupure disgracieuse dans un grand titre)
  eleventyConfig.addFilter("nowrapLast", (str) => {
    const esc = String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const words = esc.trim().split(/\s+/);
    if (words.length < 3) return esc;
    const tail = words.splice(-2).join(" ");
    return words.join(" ") + ' <span class="nowrap">' + tail + "</span>";
  });

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: false, // le texte des articles reste du texte, jamais du code
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md"],
  };
}
