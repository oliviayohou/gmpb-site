# Grand Marketing & Petit Budget (GM.PB)

Le site de GM.PB : un site statique (Eleventy) hébergé gratuitement sur Cloudflare Pages, avec un back office (Sveltia CMS) pour écrire les articles.

---

## Mise en ligne : les étapes

### 1. Créer ton compte GitHub et ton dépôt (10 min)

1. Crée un compte gratuit sur [github.com](https://github.com).
2. Clique sur **New repository**, nomme-le `gmpb-site`, laisse-le en **Private** (ou Public, au choix), puis valide.
3. Envoie ton nom d'utilisateur GitHub à Claude : il met le code dans le dépôt pour toi.
   *Ou toi-même* : sur la page du dépôt vide, clique sur **uploading an existing file** et glisse **le contenu** du dossier `gmpb-site` (pas le dossier lui-même).

### 2. Mettre le site en ligne avec Cloudflare Pages (10 min)

1. Crée un compte gratuit sur [cloudflare.com](https://dash.cloudflare.com/sign-up).
2. Va dans **Workers & Pages** → **Create** → onglet **Pages** → **Connect to Git**, puis autorise l'accès à ton dépôt `gmpb-site`.
3. Réglages de construction :
   - **Framework preset** : *None*
   - **Build command** : `npm run build`
   - **Build output directory** : `_site`
4. Clique sur **Save and Deploy**. Après 1 à 2 minutes, ton site est en ligne (adresse actuelle : https://grandmarketing-petitbudget.fr).
5. Note cette adresse : elle remplace `https://gmpb.pages.dev` dans `src/_data/site.json` (champ `url`) et dans `src/admin/config.yml` (`site_url`, `display_url`). Claude peut s'en charger.

### 3. Te connecter au back office

1. Dans `src/admin/config.yml`, la ligne `repo:` contient déjà `oliviayohou/gmpb-site`.
2. Va sur https://grandmarketing-petitbudget.fr/admin/.
3. Clique sur **Sign In Using Access Token**. Le lien proposé ouvre GitHub avec les bonnes autorisations : choisis le dépôt `gmpb-site`, avec l'accès **Contents : Read and write**, puis génère le jeton et colle-le.
4. C'est tout : tu vois tes articles, catégories et réglages. L'interface du logiciel est en anglais, mais tous tes champs sont en français.

### 4. Brancher le formulaire de contact (2 min)

1. Va sur [web3forms.com](https://web3forms.com), entre l'adresse e-mail où tu veux recevoir les messages : tu reçois une clé.
2. Dans le back office : **Réglages du site → Réglages généraux → Clé Web3Forms**, colle la clé et publie.

### 5. Plus tard : ton nom de domaine

Achète-le (chez Cloudflare directement, ou un autre registraire), puis dans Cloudflare Pages : **Custom domains → Set up a domain**. Pense ensuite à mettre à jour l'adresse du site dans les réglages.

---

## Au quotidien

| Je veux… | Où ? |
|---|---|
| Écrire un article | Back office → **Articles Grand Marketing** ou **Articles Petit Budget** → New |
| Le garder en brouillon | Laisse **Brouillon** activé. Désactive-le pour publier. |
| Mettre un article à la une | Case **Mettre à la une sur l'accueil** |
| Activer la newsletter ou le devis | **Réglages du site → Réglages généraux** |
| Ajouter ou renommer une catégorie | **Réglages du site → Catégories** |
| Changer les textes de l'accueil ou de « À propos » | **Réglages du site → Page d'accueil / Page À propos** |
| Modifier le design | Demande à Claude |

Chaque publication met le site à jour en 1 à 2 minutes. Tout l'historique est gardé dans GitHub : on peut toujours revenir en arrière.

---

## Pour la partie technique

- `src/articles/gm/` et `src/articles/pb/` : les articles (Markdown)
- `src/_data/` : réglages, catégories, textes de l'accueil et de « À propos »
- `src/_includes/` : modèles des pages
- `src/assets/` : styles, script, polices (Anton : OFL, Aileron : CC0)
- `src/admin/config.yml` : configuration du back office

Commandes : `npm install`, puis `npm start` (aperçu local, brouillons visibles) ou `npm run build` (site final dans `_site/`, recherche Pagefind incluse).
