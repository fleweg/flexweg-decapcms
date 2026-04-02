# Editor Components - Blocs Structurés

Ce document décrit les composants disponibles dans l'éditeur Decap CMS pour enrichir vos articles et pages.

## Comment Utiliser les Editor Components

1. Ouvrez un article ou une page dans l'éditeur
2. Placez le curseur dans le champ "Body"
3. Cliquez sur le bouton "+" dans la barre d'outils de l'éditeur
4. Sélectionnez le composant que vous souhaitez insérer
5. Remplissez le formulaire
6. Le shortcode sera inséré automatiquement dans votre contenu

## Composants Disponibles

### 1. YouTube

Intègre une vidéo YouTube responsive.

**Champs :**
- **YouTube Video ID or URL** : Vous pouvez coller l'URL complète YouTube ou juste l'ID de la vidéo

**Formats d'URL supportés :**
- `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- `https://youtu.be/dQw4w9WgXcQ`
- `https://youtu.be/dQw4w9WgXcQ?si=EOeJ2-Ayx3M5GYz9`
- `https://www.youtube.com/embed/dQw4w9WgXcQ`
- Ou simplement l'ID : `dQw4w9WgXcQ`

**Syntaxe :**
```
{{< youtube VIDEO_ID_OR_URL >}}
```

**Exemples :**
```
{{< youtube dQw4w9WgXcQ >}}
{{< youtube https://youtu.be/eok2xwvK4Mc?si=EOeJ2-Ayx3M5GYz9 >}}
{{< youtube https://www.youtube.com/watch?v=dQw4w9WgXcQ >}}
```

**Rendu :**
- Iframe YouTube responsive (ratio 16:9)
- L'ID de la vidéo est automatiquement extrait de l'URL
- Les paramètres de tracking (comme `?si=...`) sont supprimés
- Supporte autoplay, fullscreen, etc.

---

### 2. Call to Action (CTA)

Crée un bloc d'appel à l'action avec dégradé coloré.

**Champs :**
- **Title** : Titre du CTA
- **Text** : Texte descriptif
- **Button Text** : Texte du bouton
- **Button URL** : Lien du bouton

**Syntaxe :**
```
{{< cta title="Titre" text="Description" buttonText="Cliquez ici" buttonUrl="/lien" >}}
```

**Exemple :**
```
{{< cta title="Essayez gratuitement" text="Découvrez notre solution pendant 30 jours sans engagement" buttonText="Démarrer" buttonUrl="/inscription" >}}
```

**Rendu :**
- Bloc avec dégradé violet/bleu
- Titre blanc en gras
- Texte blanc
- Bouton blanc

---

### 3. FAQ Item

Crée une question-réponse avec support schema.org pour le SEO.

**Champs :**
- **Question** : La question
- **Answer** : La réponse

**Syntaxe :**
```
{{< faq question="Question ?" answer="Réponse" >}}
```

**Exemple :**
```
{{< faq question="Comment fonctionne le service ?" answer="Notre service utilise une technologie innovante pour simplifier votre travail quotidien." >}}
```

**Rendu :**
- Card Bootstrap
- Question en bleu avec préfixe "Q:"
- Réponse en gris avec préfixe "A:"
- Balisage schema.org pour les moteurs de recherche

---

### 4. Alert

Affiche un message d'alerte avec différents niveaux de sévérité.

**Champs :**
- **Type** : `info`, `success`, `warning`, ou `danger`
- **Text** : Texte de l'alerte

**Syntaxe :**
```
{{< alert type="TYPE" text="Message" >}}
```

**Exemples :**
```
{{< alert type="info" text="Information importante à noter" >}}
{{< alert type="success" text="Opération réussie !" >}}
{{< alert type="warning" text="Attention à ce point" >}}
{{< alert type="danger" text="Erreur critique" >}}
```

**Rendu :**
- Bordure gauche colorée selon le type
- Couleurs : info (bleu), success (vert), warning (jaune), danger (rouge)

---

### 5. Image with Caption (Figure)

Insère une image avec légende optionnelle.

**Champs :**
- **Image URL** : Chemin de l'image (upload ou URL)
- **Alt Text** : Texte alternatif pour l'accessibilité
- **Caption** : Légende (optionnel)

**Syntaxe :**
```
{{< figure src="/chemin/image.jpg" alt="Description" caption="Légende" >}}
```

**Exemple :**
```
{{< figure src="/assets/img/screenshot.png" alt="Capture d'écran de l'interface" caption="Interface utilisateur version 2.0" >}}
```

**Rendu :**
- Image centrée et responsive
- Coins arrondis
- Légende en italique sous l'image (si fournie)
- Balise `<figure>` sémantique HTML5

---

## Bonnes Pratiques

1. **YouTube** : Utilisez toujours l'ID court de la vidéo, pas l'URL complète
2. **CTA** : Gardez le texte concis et l'appel à l'action clair
3. **FAQ** : Groupez plusieurs items FAQ pour créer une section complète
4. **Alert** : Utilisez avec parcimonie pour ne pas surcharger la page
5. **Figure** : Toujours fournir un texte alternatif pour l'accessibilité

## Combinaisons Utiles

### Section FAQ Complète
```markdown
## Questions Fréquentes

{{< faq question="Comment démarrer ?" answer="Créez un compte et suivez le guide de démarrage." >}}

{{< faq question="Quel est le prix ?" answer="Nous proposons plusieurs formules adaptées à vos besoins." >}}

{{< faq question="Support disponible ?" answer="Notre équipe est disponible 7j/7 par email et chat." >}}
```

### Article avec Vidéo et CTA
```markdown
## Découvrez notre solution en vidéo

{{< youtube VOTRE_VIDEO_ID >}}

{{< cta title="Prêt à commencer ?" text="Rejoignez des milliers d'utilisateurs satisfaits" buttonText="Essai gratuit" buttonUrl="/signup" >}}
```

### Alerte avec Information
```markdown
{{< alert type="info" text="Cet article a été mis à jour le 15 mars 2024" >}}

Votre contenu ici...

{{< alert type="success" text="Vous avez terminé ce tutoriel avec succès !" >}}
```

## Support Technique

Les shortcodes sont traités automatiquement lors du build :
- Dans l'éditeur : Affichés en preview
- Sur le site : Convertis en HTML optimisé
- SEO : Balises schema.org pour FAQ

Pour toute question, consultez la documentation dans `CLAUDE.md`.
