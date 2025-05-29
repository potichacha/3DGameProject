# Projet 3D Game Programming
## Projet réalisé par Sacha Chantoiseau, Jawel Briki et Mehdi Mansour

## Inspiration
Pour ce projet, le thème du concours nous a fait penser au rêve fantastique, mais également au cauchemar. Nous avons donc développé notre jeu autour de ce thème.\
Pour notre personnage, nous avons créé un singe, car c’est un animal qui, dans les mondes fantastiques, est souvent drôle. De plus, nous voulions ajouter une touche personnelle à notre projet (un délire humoristique propre à notre groupe).\
Dans le premier niveau, le joueur incarne un personnage qui s’endort et commence à rêver. Il vit alors une expérience immersive dans ses rêves.\
Pour le deuxième niveau, nous avons voulu créer une ambiance pesante tout en conservant une atmosphère fantastique, avec des personnages drôles et surréalistes. Nous avons conçu un labyrinthe pour accentuer le côté oppressant du niveau, renforçant ainsi l’effet cauchemar. Une musique a également été choisie pour correspondre à l’ambiance souhaitée.\
Dans le troisième niveau, nous avons créé un jeu de plateforme dans les nuages. Pour ce niveau, nous voulions instaurer une ambiance légère, en lien avec l’expression "être dans les nuages".\

## Projet
Ce projet consiste à réaliser un jeu en 3D dans lequel on joue un personnage qui doit sortir de ses cauchemars, modélisés sur plusieurs niveaux.

Niveau 1: Labyrinthe (généré procéduralement) - Objectif: récupérer des éléments à collecter gardés par des ennemis\
Niveau 2: Jeu de plateformes (aussi générées procéduralement) - Objectif: arriver au bout en sautant sur les plateformes, attention à ne pas tomber!\
Niveau 3: Shoot 'em up (en cours de développement)\
\
Pour réaliser les différents déplacements et gérer les collisions, nous utilisons le moteur physique Havok.

## Comment jouer

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
Pour le Niveau 2, lorsque le joueur tombe, il est censé retourner au point de départ; cependant, effectuer une téléportation s'est avéré plus compliqué que cela ne semblait. Nous avons trouvé une solution sur les forums BabylonJS et l'avons appliquée.\

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
