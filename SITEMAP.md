# Sitemap Configuration

Le générateur de site statique Flexweg génère automatiquement un fichier `sitemap.xml` à la racine du site pour améliorer le référencement SEO.

## Fonctionnement

Le sitemap est généré automatiquement à chaque build et inclut :
- La page d'accueil
- Toutes les pages statiques (dans `content/pages/`)
- Tous les articles (dans `content/articles/`)
- La page index des articles

## Configuration

### URL du site

L'URL de base du site doit être configurée dans `config/site.json` (champ `url`) ou via l'admin panel dans **Site Configuration > Site Settings > Site URL**.

Cette URL est utilisée pour :
- Générer toutes les URLs dans `sitemap.xml`
- Référencer le sitemap dans `robots.txt`

**Exemple** :
```json
{
  "url": "https://flexweg.com"
}
```

⚠️ **Important** : N'ajoutez pas de slash final (`/`) à la fin de l'URL.

### Paramètres du sitemap

Les paramètres du sitemap sont configurables dans `config/site.json` ou via l'admin panel dans **Site Configuration > Sitemap Settings** :

```json
{
  "sitemap": {
    "enabled": true,
    "changefreq": "weekly",
    "priority": {
      "home": "1.0",
      "pages": "0.8",
      "articles": "0.6"
    }
  }
}
```

### Paramètres disponibles

#### `enabled` (boolean)
- **Par défaut** : `true`
- **Description** : Active ou désactive la génération du sitemap
- Si désactivé, aucun fichier `sitemap.xml` ne sera généré

#### `changefreq` (string)
- **Par défaut** : `"weekly"`
- **Valeurs possibles** : `"always"`, `"hourly"`, `"daily"`, `"weekly"`, `"monthly"`, `"yearly"`, `"never"`
- **Description** : Indique aux moteurs de recherche à quelle fréquence le contenu est mis à jour

#### `priority` (object)
Définit la priorité relative de chaque type de page (valeur entre 0.0 et 1.0) :

- **`home`** : Priorité de la page d'accueil (par défaut `"1.0"`)
- **`pages`** : Priorité des pages statiques (par défaut `"0.8"`)
- **`articles`** : Priorité des articles de blog (par défaut `"0.6"`)

## Structure du sitemap généré

Le fichier `sitemap.xml` suit le protocole standard des sitemaps :

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://flexweg.com/</loc>
    <lastmod>2024-03-27</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://flexweg.com/articles/mon-article.html</loc>
    <lastmod>2024-03-20</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <!-- ... autres URLs ... -->
</urlset>
```

### Champs du sitemap

- **`loc`** : URL complète de la page
- **`lastmod`** : Date de dernière modification (ISO 8601)
  - Pour les articles : date de publication de l'article
  - Pour les pages : date du dernier build ou date spécifiée dans le front-matter
- **`changefreq`** : Fréquence de mise à jour configurée
- **`priority`** : Priorité configurée selon le type de page

## Fichier robots.txt

Un fichier `robots.txt` est également généré automatiquement à la racine du site et référence le sitemap.

Le contenu est généré dynamiquement à partir de `config/site.json` :

```
User-agent: *
Allow: /

Sitemap: [URL_DU_SITE]/sitemap.xml
```

**Important** : Le fichier `robots.txt` utilise automatiquement l'URL configurée dans `config/site.json` (champ `url`). Assurez-vous que cette URL correspond bien à votre domaine de production.

**Exemple de configuration** :
```json
{
  "url": "https://flexweg.com",
  ...
}
```

Générera :
```
Sitemap: https://flexweg.com/sitemap.xml
```

## Régénération automatique

Le sitemap est automatiquement régénéré à chaque build, c'est-à-dire :
- Quand vous ajoutez un nouvel article
- Quand vous supprimez un article
- Quand vous ajoutez ou modifiez une page
- Quand vous lancez manuellement le build avec `npm run build`

En mode développement avec `npm run dev`, le sitemap est régénéré à chaque changement de fichier dans `content/`.

## Soumettre le sitemap aux moteurs de recherche

### Google Search Console
1. Accédez à [Google Search Console](https://search.google.com/search-console)
2. Sélectionnez votre propriété
3. Allez dans **Sitemaps** dans le menu de gauche
4. Ajoutez l'URL : `https://votredomaine.com/sitemap.xml`
5. Cliquez sur **Envoyer**

### Bing Webmaster Tools
1. Accédez à [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Sélectionnez votre site
3. Allez dans **Sitemaps**
4. Ajoutez l'URL : `https://votredomaine.com/sitemap.xml`
5. Cliquez sur **Soumettre**

## Désactiver le sitemap

Pour désactiver complètement la génération du sitemap :

**Via l'admin panel** :
1. Allez dans **Collections > Site Configuration > Site Settings**
2. Ouvrez la section **Sitemap Settings**
3. Décochez **Enable Sitemap**
4. Sauvegardez

**Via le fichier de configuration** :
```json
{
  "sitemap": {
    "enabled": false
  }
}
```

Le build affichera alors :
```
⏭️  Sitemap generation disabled
```

## Vérification

Après le build, vérifiez que le sitemap a été généré :

```bash
# Le fichier doit exister
ls public/sitemap.xml

# Vérifiez le contenu
cat public/sitemap.xml

# Ou ouvrez dans le navigateur (après déploiement)
# https://votredomaine.com/sitemap.xml
```

## Bonnes pratiques

1. **URL de base** : Assurez-vous que `config/site.json` contient l'URL complète de production (avec `https://`)
2. **Fréquence** : Utilisez `"weekly"` pour la plupart des sites, `"daily"` si vous publiez fréquemment
3. **Priorités** : Gardez la page d'accueil à 1.0, ajustez les autres selon l'importance relative
4. **Mise à jour** : Resoumettez le sitemap aux moteurs de recherche après des changements majeurs de structure

## Troubleshooting

**Le sitemap n'est pas généré** :
- Vérifiez que `sitemap.enabled` est à `true` dans `config/site.json`
- Vérifiez les logs du build pour des erreurs
- Assurez-vous que le dossier `public/` est accessible en écriture

**Les URLs sont incorrectes** :
- Vérifiez la valeur de `url` dans `config/site.json`
- L'URL ne doit pas avoir de slash final

**Erreur "must be between 0.0 and 1.0"** :
- Les valeurs de priorité doivent être des chaînes entre "0.0" et "1.0"
- Exemples valides : `"1.0"`, `"0.8"`, `"0.5"`, `"0.0"`
