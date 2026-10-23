// Réglages communs à tous les articles
export default {
  layout: "layouts/article.njk",
  permalink: (data) => `/blog/${data.page.fileSlug}/`,
  eleventyComputed: {
    activeNav: (data) => data.track,
    activeCat: (data) => data.category,
  },
};
