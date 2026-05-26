# Widget-Grist

Collection de widgets personnalisés pour [Grist](https://www.getgrist.com/), développée par la DRANE d'Orléans-Tours. Chaque widget est un fichier HTML autonome à coller comme « Widget personnalisé » dans Grist (URL).

Catalogue complet : ouvrez [`index.html`](index.html) en local ou via votre déploiement GitLab Pages — il liste les widgets et permet de copier directement l'URL à coller dans Grist.

## Widgets disponibles

| Widget | Fichier | Description courte |
|---|---|---|
| **Formulaire validé** | [`form-validator.html`](form-validator.html) | Formulaire de saisie avec validation. **Voir détail ci-dessous.** |
| Assistant Dataviz D3.js | [`d3js-assistant.html`](d3js-assistant.html) | Parcours guidé pour choisir le bon graphique D3.js. |
| Scatterplot D3.js | [`d3js-scatterplot.html`](d3js-scatterplot.html) | Nuage de points configurable. |
| Donut D3.js | [`d3js-donut.html`](d3js-donut.html) | Graphique donut configurable. |
| Bar Chart D3.js | [`d3js-bar-chart.html`](d3js-bar-chart.html) | Diagramme en barres configurable. |
| Radar D3.js | [`d3js-radar.html`](d3js-radar.html) | Radar / toile d'araignée configurable. |
| Catalogue / Galerie de fiches | [`widget-cards.html`](widget-cards.html) | Affichage des lignes Grist en cartes (recherche, filtres, vue détail). |
| Tableau de bord KPI | [`widget-kpi.html`](widget-kpi.html) | Grille de cartes KPI configurables (agrégations, filtres conditionnels, objectif, tendance vs période). |

---

# Widget **Formulaire validé** (form-validator)

Transforme une table Grist en formulaire de saisie avec validation des données avant insertion. Trois modes d'usage, combinables.

## Modes d'usage

### Mode 1 — Saisie validée par un éditeur Grist connecté
- Ajoutez le widget sur une table dans Grist (URL → `form-validator.html`, accès **Full**).
- Le widget génère automatiquement un formulaire à partir du schéma de la table.
- L'éditeur saisit, le widget valide (regex, types, longueur, etc.), puis insère via `grist.selectedTable.create`.
- Cas d'usage : interface de saisie ergonomique pour les agents internes, plus stricte que la grille Grist par défaut.

### Mode 2 — Validation post-hoc d'un formulaire Grist natif
- Vous gardez le **formulaire Grist natif** (publié) pour la collecte publique (qui se fait sans login).
- Depuis le panneau ⚙ du widget, cliquez sur **« Créer / Mettre à jour la colonne de validation »** : ça génère une **colonne formule Python** qui rejoue les mêmes règles que celles configurées dans le widget.
- Toute ligne ajoutée à la table (par n'importe quel canal, y compris le formulaire natif) a sa colonne `Validation` calculée : `''` si tout est valide, sinon le détail des erreurs.
- Cas d'usage : feedback de qualité côté éditeur Grist sans complexifier le formulaire vu par le visiteur.

### Mode 3 — Lien public autonome (visiteur non connecté)
- Le widget peut s'ouvrir **hors de Grist** via une URL spéciale (`form-validator.html#cfg=…`).
- Le bandeau « Lien public » dans le panneau ⚙ génère cette URL : elle contient en base64 le titre, le schéma, les règles de validation, le message de succès et l'URL du document Grist.
- Quand un visiteur ouvre le lien : formulaire affiché, validation locale, soumission via `POST /api/docs/{docId}/tables/{tableId}/records?utm_source=grist-forms` (endpoint REST standard de Grist).
- **Pré-requis côté Grist** : voir [Access Rules pour le mode public](#access-rules-pour-le-mode-public). Sans ça, l'INSERT anonyme est refusé.
- Cas d'usage : formulaire public hors d'un formulaire Grist natif, par exemple intégré sur un site qui n'a pas accès à Grist.

## Fonctionnalités

### Validation automatique par type
Détection des types Grist : `Text`, `Numeric`, `Int`, `Date`, `DateTime`, `Bool`, `Choice`, `ChoiceList`, `Ref`, `RefList`. La validation de type est appliquée d'office (un nombre dans un champ `Numeric`, une date valide dans `Date`, une référence existante pour `Ref`, etc.).

### Surcharges par colonne (panneau ⚙)
Pour chaque colonne, configurez :

| Option | Effet |
|---|---|
| **Label affiché** | Override le nom Grist visible dans le formulaire. |
| **Description / aide** | Texte d'aide sous le label. |
| **Apparence** | `auto` (défaut), `select`, `radio`, `chips`, `checkbox`, `autocomplete`. |
| **Format prédéfini** | `email`, `phone`, `url` (avec regex et message par défaut). |
| **Regex personnalisée** | Pattern JS, prioritaire sur le format. |
| **Valeur min / max** | Bornes pour `Numeric` / `Int`. |
| **Longueur min / max** | Bornes pour `Text` / `Any`. |
| **Message d'erreur** | Override le message par défaut. |
| **Filtre des valeurs** (`Ref`/`RefList`) | Limite les options proposées (ex. `choice.Statut == 'Actif'`). |
| **Logique conditionnelle** (`showIf`) | Le champ ne s'affiche que si une condition est vraie (ex. `form.Type == 'Particulier'`). |
| **Inclure dans le formulaire** | Décocher = la colonne reste dans la table mais n'apparaît pas pour le saisisseur. |
| **Champ obligatoire** | Vide → erreur (sauf pour `Bool` où ça signifie « doit être coché »). |
| **Interdire les doublons** | Refuse une valeur déjà présente dans la table (vérification au moment de la soumission). |

### Contraintes composites & blocs de texte
- **Contraintes d'unicité composites** : un groupe de colonnes ne peut pas avoir la même combinaison de valeurs deux fois (ex. `[Nom, Prenom]`).
- **Blocs de texte libres** : insérer des paragraphes explicatifs entre les champs ou en tête/pied de formulaire.

### Validation à la volée
- Indicateurs **✓** (vert) / **✗** (rouge) à droite du label de chaque champ, qui apparaissent après le premier *focus-out* (état `touched`).
- **Barre de progression** : « X / Y champs renseignés » + pourcentage, en haut du formulaire.
- **Compteur de caractères** pour les inputs avec `maxLength`.
- Les champs masqués par `showIf` sont **exclus du décompte**.

### UX d'entrée
- **Apparences automatiques** : `Choice` avec ≤ 5 options → boutons radio ; `ChoiceList` → chips cliquables ; sinon menu déroulant ou auto-complétion sur demande.
- **Placeholders intelligents** : `nom.prenom@exemple.fr` pour les emails, `06 12 34 56 78` pour les téléphones, `https://www.exemple.fr` pour les URLs.
- **Auto-focus** du premier champ en mode standalone.
- **Affichage des sections avancées** (validation / showIf) **masquable** depuis le bandeau en tête du panneau ⚙ — pratique pour un panneau épuré quand on n'utilise pas ces options.

## Installation

1. **Hébergez le fichier** [`form-validator.html`](form-validator.html) sur n'importe quel hébergeur statique (GitLab Pages, GitHub Pages, serveur web, etc.).
2. Dans Grist, sur la table cible :
   - Ajoutez un **« Widget personnalisé »** (Custom widget).
   - Collez l'URL de `form-validator.html`.
   - Sélectionnez l'accès **« Full »** (le widget a besoin de lire les métadonnées des colonnes et d'insérer des lignes).

## Access Rules pour le mode public

Pré-requis pour que le **lien public** fonctionne avec un visiteur non connecté. Procédure officielle, inspirée de [`gristlabs/grist-form-submit`](https://github.com/gristlabs/grist-form-submit) :

1. **Ouvrir Access Rules** (icône bouclier dans le panneau latéral gauche du document).
2. **Special Rules** : décochez **« Allow editors to edit structure »**.
3. **Default Rules** : ajoutez une règle :
   - Condition : `user.Access != OWNER`
   - Permission : **Deny All** (les 4 cases R, U, C, D en rouge).
4. **Add Table Rules** sur la table cible :
   - Condition : *laissez vide* (= « Everyone »).
   - Permission : cliquez deux fois sur **C (Create)** pour la passer en vert. Les autres restent à `—` (héritent du Deny par défaut).
5. **Save** en haut à droite.
6. Menu **Share** → **Manage Users** → activez **Public access** avec le rôle **Editor**.

Résultat : un visiteur anonyme ne peut **rien lire** dans le document, et peut **uniquement INSERT** dans la table du formulaire.

## Limitations connues

- Les colonnes de type `Attachments` ne sont pas supportées (pas d'upload de fichiers dans le widget).
- Le mode public ne s'applique pas aux documents Grist auto-hébergés qui auraient un reverse-proxy retirant les en-têtes CORS — à tester sur votre instance avant déploiement.
- Si JavaScript est désactivé chez le visiteur, la validation client est contournée. La **colonne formule Python** (mode 2) reste votre filet de sécurité côté serveur.
- Les contraintes d'unicité sont vérifiées par fetch de la table avant chaque soumission : sur très grosses tables (> 50 000 lignes), cela peut être lent.

## Crédits

Développé pour la DRANE d'Orléans-Tours.
S'appuie sur l'API plugin Grist ([docs.getgrist.com/grist-plugin-api.js](https://docs.getgrist.com/grist-plugin-api.js)) et sur les conventions de soumission de formulaires de [`gristlabs/grist-form-submit`](https://github.com/gristlabs/grist-form-submit).
