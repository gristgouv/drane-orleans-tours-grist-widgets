# Un widget Grist pour valider les saisies de formulaire avant insertion

Bonjour à tous,

Je partage un widget personnalisé Grist qu'on a développé pour combler un manque qu'on rencontrait régulièrement : **pouvoir valider des saisies de formulaire avec des règles précises (regex, longueurs, min/max, formats email/téléphone/URL, contraintes d'unicité…) avant que la ligne n'arrive dans la table**.

Le widget s'appelle **form-validator**. Il est en HTML pur, autonome, à héberger n'importe où (GitLab Pages, GitHub Pages, serveur statique) et à coller comme « Widget personnalisé » sur la table cible.

Repo : <https://forge.apps.education.fr/drane-orleans-tours/widget-grist> (fichier `form-validator.html`).

## Le problème

Grist a un formulaire natif (`Form view`) qu'on adore : on publie un lien, n'importe qui peut le remplir sans compte. Parfait pour les inscriptions, sondages, demandes diverses.

**Ce qui manque** dans le formulaire natif : la validation côté saisie. On peut bien dire qu'un champ est requis ou qu'il est de type `Numeric`, mais on ne peut pas dire « cette colonne doit être un email », « ce code doit matcher `^[A-Z]{2}\d{4}$` », « cette adresse ne peut pas exister deux fois dans la table », ou encore « ce champ ne s'affiche que si la case précédente est cochée ». Conséquence : on récolte des données moches qu'il faut nettoyer après coup.

## La solution en 3 modes

Le widget propose **trois manières de s'en servir**, qu'on peut combiner.

### Mode 1 — Saisie validée dans Grist par un éditeur connecté
On ajoute le widget sur la table avec accès « Full ». Le widget génère automatiquement un formulaire à partir du schéma de la table, applique les règles de validation qu'on a configurées (panneau ⚙), et n'insère la ligne que si tout est OK. Pratique pour les agents internes qui saisissent en masse : on a un retour visuel immédiat (✓ vert ou ✗ rouge) en sortie de champ, une barre de progression, et un INSERT bloqué tant que ce n'est pas conforme.

### Mode 2 — Combiner avec le formulaire Grist natif
On garde le formulaire natif pour la **collecte publique** (parce que c'est lui qui sait gérer l'auth anonyme propre via les Access Rules). Le widget, lui, génère **une colonne formule Python** qui rejoue les mêmes règles. Toute ligne entrée dans la table — y compris via le formulaire natif — voit sa colonne `Validation` calculée : `''` si tout va bien, sinon le détail des erreurs (« Email : adresse invalide ; Téléphone : longueur < 6 »). On peut filtrer, trier, mettre en forme conditionnelle. C'est notre filet de sécurité côté serveur. Un bouton dans le panneau ⚙ génère ou met à jour cette colonne automatiquement via `applyUserActions`.

### Mode 3 — Lien public autonome
Pour les cas où on veut un formulaire public **avec validation côté saisie** (pas seulement post-hoc), le widget peut s'ouvrir hors de Grist. Le panneau ⚙ produit une URL du type `…/form-validator.html#cfg=…` où le fragment contient la config en base64 (titre, schéma, règles, message de succès). Le visiteur ouvre l'URL → formulaire → validation locale → `POST /api/docs/{docId}/tables/{tableId}/records` directement sur l'API REST de Grist. Pré-requis côté doc : Public Access + Access Rules qui n'autorisent que `Create` sur la table cible (la procédure est documentée dans le widget elle-même, dans un bloc d'aide repliable).

## Ce qu'on peut faire concrètement

Pour chaque colonne de la table, on peut configurer :

- **Format prédéfini** : email, téléphone, URL (avec regex et message d'erreur fournis).
- **Regex personnalisée** : pattern JS prioritaire sur le format.
- **Bornes** : valeur min/max pour les numériques, longueur min/max pour les textes.
- **Champ requis** : avec message personnalisable.
- **Doublons interdits** : refus si la valeur existe déjà dans la table.
- **Unicité composite** : ex. la paire `[Nom, Prénom]` ne peut pas exister deux fois.
- **Logique conditionnelle** (`showIf`) : « afficher ce champ uniquement si `form.Type == 'Particulier'` ».
- **Filtre des valeurs** pour les colonnes `Ref` / `RefList` (ex. ne proposer que les références où `choice.Statut == 'Actif'`).
- **Apparence du champ** : auto (radio si ≤ 5 choix, chips pour ChoiceList, sinon menu), ou bien explicitement select / radio / cases à cocher / auto-complétion.
- **Description / aide** : un texte d'explication sous chaque label.
- **Blocs de texte libres** entre les champs ou en tête/pied du formulaire.
- **Réordonnancement** des champs (boutons ↑↓).
- **Exclure** une colonne du formulaire (elle reste dans la table mais n'est pas demandée à la saisie).

Côté UX du saisisseur, ça fait :
- Validation à la volée avec ✓ / ✗ en sortie de champ.
- Barre de progression « 4 / 7 champs renseignés ».
- Compteur de caractères pour les champs avec longueur max.
- Placeholders intelligents (`nom.prenom@exemple.fr` pour les emails, `06 12 34 56 78` pour les téléphones, etc.).
- Chips cliquables pour les ChoiceList plutôt qu'un horrible `<select multiple>`.
- Auto-focus sur le premier champ en mode standalone.

## Pour essayer

1. Récupérez `form-validator.html` depuis [le repo](https://forge.apps.education.fr/drane-orleans-tours/widget-grist).
2. Hébergez-le (le plus simple : un fork du repo + GitLab Pages, ça met l'URL à dispo en quelques minutes).
3. Dans Grist, sur votre table : Widget personnalisé → URL → `form-validator.html` → Accès **Full**.
4. Cliquez sur ⚙ en haut à droite du widget pour ouvrir le panneau de configuration.

Le README du repo détaille les Access Rules à mettre en place pour le mode public et la liste complète des options.

## Limitations / points d'attention

- Pas de support des `Attachments` (pas d'upload de fichier).
- Le mode public dépend des en-têtes CORS de votre instance Grist (par défaut OK pour Grist hébergé, à vérifier en self-host si vous avez un reverse-proxy).
- Les contraintes d'unicité font un fetch de la table avant chaque soumission : prévoir un peu de latence sur les très grosses tables.
- Si le visiteur désactive JS dans le mode public, la validation côté saisie est contournée. La **colonne formule Python** (mode 2) reste le garde-fou côté serveur, raison pour laquelle on conseille de combiner les deux dès qu'il y a un enjeu sur la qualité des données.

Si vous testez et que vous tombez sur un bug ou si vous avez une idée de feature qui pourrait être utile à d'autres, n'hésitez pas à ouvrir une issue sur le repo ou à me répondre ici.

Bonne saisie validée à tous 🙂
