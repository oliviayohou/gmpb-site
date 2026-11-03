// La page FAQ n'est publiée que si « FAQ en ligne » est coché dans le back office
// (Textes du site → Page FAQ). En aperçu local, elle reste toujours visible.
export default {
  permalink: (data) =>
    (data.faq && data.faq.online) || process.env.ELEVENTY_RUN_MODE !== "build" ? "/faq/" : false,
};
