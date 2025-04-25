# Projet 3D Game Programming
## Projet réalisé par Sacha Chantoiseau, Jawel Briki et Mehdi Mansour

## Comment jouer


## Projet
Ce projet consiste à réaliser un jeu en 3D dans lequel on joue un personnage qui doit sortir de ses cauchemars, modélisés sur plusieurs niveaux.

Niveau 1: Labyrinthe (généré procéduralement) - Objectif: récupérer des éléments à collecter gardés par des ennemis\
Niveau 2: Jeu de plateformes (aussi générées procéduralement) - Objectif: arriver au bout en sautant sur les plateformes, attention à ne pas tomber!\
Niveau 3: Shoot 'em up (en cours de développement)\
\
Pour réaliser les différents déplacements et gérer les collisions, nous utilisons le moteur physique Havok.

#### <ins>Commandes du joueur</ins> :
```
Avancer : Z
Reculer : S
Tourner à droite : D
Tourner à gauche : Q
Sauter : Espace
```

### Difficultés rencontrées
Nous avons eu énormément de problèmes avec la librairie Havok au début car le projet ne reconnaissait pas le fichier wasm. Nous avons donc décidé de l'importer via le CDN.\
Pour le Niveau 2, lorsque le joueur tombe, il est censé retourner au point de départ; cependant, effectuer une téléportation s'est avéré plus compliqué que cela ne semblait. Nous avons trouvé une solution sur les forums BabylonJS et l'avons appliquée.

## Elements du Jeu

- [x] Menu
- [x] Niveau d'introduction
- [x] Niveau 1
- [x] Niveau 2
- [ ] Niveau 3

### Détail des éléments manquants
- Fluidifier la transition entre les niveaux et s'assurer de l'absence de bugs liés à la destruction/recréation des mesh
- Niveau 2: ajouter le PNJ d'explication du niveau
- Potentiel niveau final: combat de boss?
- Système de sauvegarde (non prioritaire, si le reste fonctionne bien alors peut-être)

# Merci pour votre attention
L'Equipe Sinj Corp
