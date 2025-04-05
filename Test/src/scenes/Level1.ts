import { Scene, Vector3, MeshBuilder, StandardMaterial, FollowCamera, HemisphericLight, FreeCamera, KeyboardEventTypes, Ray, Color3, Mesh, Texture } from "@babylonjs/core";
import { PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core";
import { Player } from "../components/Player";
import { setupControls } from "../core/InputManager";
import { MazeGenerator, isWallPosition } from "../procedural/MazeGenerator";
import { Collectible } from "../components/Collectible";
import { HUD } from "../components/HUD";
import { Enemy } from "../components/Enemy";
import {Music} from "../music/music";

export class Level1 {
    private scene: Scene;
    private canvas: HTMLCanvasElement;
    private player!: Player;
    private followCamera!: FollowCamera;
    private freeCamera!: FreeCamera;
    private isFreeCamera: boolean = false;
    private collectibles: Collectible[] = [];
    private enemies: Enemy[] = [];
    private hud: HUD;
    private collectedCount: number = 0;
    private totalCollectibles: number = 3;
    private lastInvisibleWall: any = null; // Stocke le dernier mur rendu invisible
    private projectiles: Mesh[] = []; // Liste des projectiles actifs
    private music: Music;

    constructor(scene: Scene, canvas: HTMLCanvasElement) {
        this.scene = scene;
        this.canvas = canvas;
        this.hud = new HUD();
        this.music = new Music("./src/music/soundstrack/Item Bounce - Kirby Air Ride.mp3");
        this.init();
    }

    private async init() {
        console.log("🔨 Création du niveau 1...");

        this.scene.collisionsEnabled = true;
        console.log("⚙️ Collisions activées pour la scène.");

        new HemisphericLight("light1", new Vector3(0, 1, 0), this.scene);

        const groundSize = 1000;
        const ground = MeshBuilder.CreateGround("ground", { width: groundSize, height: groundSize }, this.scene);
        ground.checkCollisions = true;
        console.log("🛠️ Sol créé et collisions activées.");

        const groundMaterial = new StandardMaterial("groundMaterial", this.scene);
        groundMaterial.diffuseTexture = new Texture("./src/assets/textures/nuage.avif", this.scene);
        ground.material = groundMaterial;
        (groundMaterial.diffuseTexture as Texture).uScale = 25;
        (groundMaterial.diffuseTexture as Texture).vScale = 25;

        const groundPhysics = new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0 }, this.scene);
        console.log("✅ Physique du sol appliquée :", groundPhysics);

        MazeGenerator.deploy(this.scene);

        this.player = new Player(this.scene, new Vector3(-20, 5, -10));
        console.log("🛠️ Joueur ajouté à la scène.");

        await this.player.meshReady();

        this.setupFollowCamera();
        this.setupFreeCamera();
        this.setupCameraSwitch();
        this.setupShooting();

        this.spawnCollectibles();
        this.spawnEnemies();
        setupControls(this.player);

        this.scene.onBeforeRenderObservable.add(() => {
            this.collectibles.forEach(collectible => collectible.checkCollision(this.player.getCapsule())); // Vérifie les collisions
            this.updateHUDWithDistance(); // Met à jour la distance dans le HUD
            //this.checkForObstacles(); // Vérifie les collisions avec les murs
            this.player.checkForObstacles(this.followCamera,this.lastInvisibleWall); // Vérifie les collisions avec les murs
            this.updateProjectiles(); // Met à jour les projectiles
            this.updateEnemies(); // Met à jour les ennemis
            this.music.playMusic(); // Joue la musique de fond
        });

        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
                if (this.scene.debugLayer.isVisible()) {
                    this.scene.debugLayer.hide();
                } else {
                    this.scene.debugLayer.show();
                }
            }
        });

        console.log("✅ Niveau 1 prêt !");
    }

    private setupFollowCamera() {
        this.followCamera = new FollowCamera("FollowCamera", new Vector3(0, 0, 0), this.scene);
        this.followCamera.lockedTarget = this.player.getMesh();
        this.followCamera.radius = 25;
        this.followCamera.heightOffset = 9;
        this.followCamera.rotationOffset = 180;
        this.followCamera.cameraAcceleration = 0.5;
        this.followCamera.maxCameraSpeed = 10;
        this.followCamera.inputs.clear(); // Désactive le contrôle manuel de la caméra

        (this.followCamera as any).ellipsoidOffset = new Vector3(2, 2, 2);
        (this.followCamera as any).checkCollisions = true;
        this.scene.collisionsEnabled = true;
        this.followCamera.minZ = 2;
        this.scene.activeCamera = this.followCamera;

        this.scene.registerBeforeRender(() => {
            this.checkForObstacles();
        });
    }

    private checkForObstacles() {
        const cameraPosition = this.followCamera.position;
        const playerPosition = this.player.getCapsule().position;

        const ray = new Ray(cameraPosition, playerPosition.subtract(cameraPosition).normalize());

        // Vérifier les intersections avec le rayon
        const hit = this.scene.pickWithRay(ray, (mesh) => {
            // On ne veut pas détecter la caméra ou le joueur comme intersection
            return mesh !== this.player.getMesh() && mesh.name === "wall"; // Vérifie que c'est un mur
        });

        if (hit && hit.pickedMesh) {
            const wall = hit.pickedMesh;

            // Rendre le mur invisible
            if (this.lastInvisibleWall && this.lastInvisibleWall !== wall) {
                this.lastInvisibleWall.isVisible = true; // Rendre visible le dernier mur invisible
            }

            wall.isVisible = false; // Rendre le mur actuel invisible
            this.lastInvisibleWall = wall; // Mettre à jour le dernier mur invisible
        } else if (this.lastInvisibleWall) {
            // Si aucun mur n'est détecté, rendre visible le dernier mur invisible
            this.lastInvisibleWall.isVisible = true;
            this.lastInvisibleWall = null;
        }
    }

    private setupFreeCamera() {
        this.freeCamera = new FreeCamera("FreeCamera", new Vector3(0, 10, 0), this.scene);
        this.freeCamera.attachControl(this.canvas, true);
        this.freeCamera.speed = 5;
        this.freeCamera.detachControl();
    }

    private setupCameraSwitch() {
        this.scene.onKeyboardObservable.add((kbInfo) => {
            if (kbInfo.type === KeyboardEventTypes.KEYDOWN && kbInfo.event.key.toLowerCase() === "c") {
                this.toggleFreeCamera();
            }
        });
    }

    private toggleFreeCamera() {
        this.isFreeCamera = !this.isFreeCamera;

        if (this.isFreeCamera) {
            console.log("🎥 Mode caméra libre activé !");
            this.scene.activeCamera = this.freeCamera;
            this.freeCamera.attachControl();
        } else {
            console.log("🎥 Mode caméra de suivi activé !");
            this.scene.activeCamera = this.followCamera;
            this.freeCamera.detachControl();
        }
    }

    private spawnCollectibles() {
        let spawned = 0;
        const minDistanceFromWalls = 3; // Distance minimale entre un collectible et un mur
        const minDistanceFromPlayer = 10; // Distance minimale entre un collectible et le joueur
        const minDistanceBetweenCollectibles = 3; // Distance minimale entre deux collectibles

        while (spawned < this.totalCollectibles) {
            const pos = this.getValidPositionInMaze(minDistanceFromWalls, minDistanceFromPlayer);

            // Vérifier que le collectible n'est pas trop proche des autres collectibles
            const isTooCloseToOtherCollectibles = this.collectibles.some((collectible) => {
                const distance = Vector3.Distance(collectible.getPosition(), pos);
                return distance < minDistanceBetweenCollectibles;
            });

            if (!isTooCloseToOtherCollectibles) {
                const collectible = new Collectible(this.scene, pos, () => this.collectItem());
                this.collectibles.push(collectible);
                spawned++;
            }
        }

        console.log(`✨ ${this.collectibles.length} collectibles placés.`);
    }

    private getValidPositionInMaze(minDistanceFromWalls: number, minDistanceFromPlayer: number): Vector3 {
        let valid = false;
        let position: Vector3 = new Vector3(0, 1, 0);

        while (!valid) {
            const x = Math.floor(Math.random() * 50) * 2 - 50; // Ajuster les limites du labyrinthe
            const z = Math.floor(Math.random() * 50) * 2 - 50;
            position = new Vector3(x, 1, z);

            // Vérifier que la position n'est pas dans un mur, respecte la distance minimale des murs,
            // et est suffisamment éloignée de la position de départ du joueur
            if (
                !isWallPosition(x, z) &&
                this.isFarFromWalls(position, minDistanceFromWalls) &&
                this.isFarFromPlayer(position, minDistanceFromPlayer)
            ) {
                valid = true;
            }
        }

        return position;
    }

    private isFarFromWalls(position: Vector3, minDistance: number): boolean {
        // Vérifie que la position est à une distance minimale des murs
        for (let dx = -minDistance; dx <= minDistance; dx++) {
            for (let dz = -minDistance; dz <= minDistance; dz++) {
                if (isWallPosition(position.x + dx, position.z + dz)) {
                    return false;
                }
            }
        }
        return true;
    }

    private isFarFromPlayer(position: Vector3, minDistance: number): boolean {
        const playerPosition = this.player.getCapsule().position;
        const distance = Vector3.Distance(position, playerPosition);
        return distance >= minDistance;
    }

    private collectItem() {
        if (this.collectedCount < this.totalCollectibles) {
            this.collectedCount = Math.min(this.collectedCount + 1, this.totalCollectibles);
            console.log(`✅ Collectible ramassé ! ${this.collectedCount}/${this.totalCollectibles}`);
            this.hud.update(this.collectedCount, this.totalCollectibles); // Met à jour le HUD

            // Masquer le HUD des collectibles si tous sont collectés
            if (this.collectedCount === this.totalCollectibles) {
                console.log("🎉 Tous les collectibles ont été ramassés !");
                this.hud.hideCollectiblesHUD();
            }
        }
    }

    private updateHUDWithDistance() {
        if (this.collectibles.length === 0) {
            this.hud.updateDistance(0); // Si aucun collectible, afficher 0
            return;
        }

        let closestCollectible: Collectible | null = null;
        let closestDistance = Infinity;

        for (const collectible of this.collectibles) {
            if (!collectible.getPosition()) continue; // Ignorer les collectibles déjà collectés
            const dist = Vector3.Distance(this.player.getCapsule().position, collectible.getPosition());
            if (dist < closestDistance) {
                closestDistance = dist;
                closestCollectible = collectible;
            }
        }

        if (closestCollectible) {
            this.hud.updateDistance(Math.round(closestDistance)); // Met à jour la distance dans le HUD
        }
    }

    private spawnEnemies() {
        const minDistanceFromWalls = 3; // Distance minimale entre un ennemi et un mur
        const minDistanceFromPlayer = 10; // Distance minimale entre un ennemi et le joueur
        const minDistanceBetweenEnemies = 5; // Distance minimale entre deux ennemis

        // Spawner 3 ennemis autour de chaque collectible
        this.collectibles.forEach((collectible) => {
            for (let i = 0; i < 3; i++) {
                const collectiblePosition = collectible.getPosition();
                const offset = new Vector3(
                    Math.random() * 6 - 3, // Position aléatoire autour du collectible
                    0,
                    Math.random() * 6 - 3
                );
                const enemyPosition = collectiblePosition.add(offset);

                if (this.isFarFromWalls(enemyPosition, minDistanceFromWalls)) {
                    const enemy = new Enemy(this.scene, enemyPosition, 100); // Ennemi avec 100 points de vie
                    this.enemies.push(enemy);
                }
            }
        });

        // Spawner 10 ennemis aléatoirement dans le labyrinthe
        let spawnedInMaze = 0;
        while (spawnedInMaze < 10) {
            const pos = this.getValidPositionInMaze(minDistanceFromWalls, minDistanceFromPlayer);

            // Vérifier que l'ennemi n'est pas trop proche des autres ennemis
            const isTooCloseToOtherEnemies = this.enemies.some((enemy) => {
                const distance = Vector3.Distance(enemy.getMesh().position, pos);
                return distance < minDistanceBetweenEnemies;
            });

            if (!isTooCloseToOtherEnemies) {
                const enemy = new Enemy(this.scene, pos, 100); // Ennemi avec 100 points de vie
                this.enemies.push(enemy);
                spawnedInMaze++;
            }
        }

        console.log(`👾 ${this.enemies.length} ennemis placés.`);
    }

    private getValidPosition(): Vector3 {
        let valid = false;
        let position: Vector3 = new Vector3(0, 1, 0);

        while (!valid) {
            const x = Math.floor(Math.random() * 50) * 20 - 500;
            const z = Math.floor(Math.random() * 50) * 20 - 500;
            position = new Vector3(x, 1, z);

            if (!isWallPosition(x, z)) {
                valid = true;
            }
        }
        return position;
    }

    // Ajoutez une méthode pour gérer les dégâts infligés au joueur
    private applyDamageToPlayer(damage: number) {
        this.player.reduceHealth(damage);
        this.hud.updatePlayerHealth(this.player.getHealth()); // Met à jour la barre de vie dans le HUD
        if (this.player.getHealth() <= 0) {
            console.log("❌ Le joueur est mort !");
            // Ajoutez ici une logique pour gérer la mort du joueur (ex: réinitialisation du niveau)
        }
    }

    private setupShooting() {
        window.addEventListener("keydown", (event) => {
            if (event.key.toLowerCase() === "f") { // Appuie sur la touche "F"
                this.shootProjectile();
            }
        });

        this.scene.onBeforeRenderObservable.add(() => {
            this.updateProjectiles();
        });
    }

    private shootProjectile() {
        const playerPosition = this.player.getCapsule().position.clone();

        // Utilisez la rotation actuelle du joueur pour calculer la direction avant
        let forwardVector = this.player.getCapsule().forward.normalize();

        // Inverser la direction
        forwardVector = forwardVector.scale(-1);

        // Vérifiez que le vecteur est correctement orienté
        console.log("⬅️ Direction inversée du tir :", forwardVector);

        // Crée un projectile (petite sphère bleue)
        const projectile = MeshBuilder.CreateSphere("projectile", { diameter: 0.5 }, this.scene);
        projectile.position = playerPosition.add(forwardVector.scale(2)); // Position initiale devant le joueur

        const material = new StandardMaterial("projectileMat", this.scene);
        material.diffuseColor = new Color3(0, 0, 1); // Bleu
        projectile.material = material;

        // Ajoute une vélocité au projectile
        const velocity = forwardVector.scale(20); // Vitesse du projectile
        projectile.metadata = { velocity }; // Stocke la vélocité dans les métadonnées

        this.projectiles.push(projectile);
    }

    private updateProjectiles() {
        const deltaTime = this.scene.getEngine().getDeltaTime() / 1000; // Temps écoulé en secondes

        this.projectiles = this.projectiles.filter((projectile) => {
            if (!projectile) return false;

            // Met à jour la position du projectile
            const velocity = projectile.metadata.velocity;
            projectile.position.addInPlace(velocity.scale(deltaTime));

            // Vérifie les collisions avec les ennemis
            for (const enemy of this.enemies) {
                if (enemy.getMesh().intersectsMesh(projectile, false)) {
                    console.log("💥 Projectile a touché un ennemi !");
                    enemy.reduceHealth(50); // Inflige 50 points de dégâts
                    projectile.dispose(); // Supprime le projectile
                    return false; // Retire le projectile de la liste
                }
            }

            // Supprime le projectile s'il sort de la scène
            if (projectile.position.length() > 1000) {
                projectile.dispose();
                return false;
            }

            return true; // Garde le projectile actif
        });
    }

    private updateEnemies() {
        const deltaTime = this.scene.getEngine().getDeltaTime() / 1000; // Temps écoulé en secondes

        this.enemies.forEach((enemy) => {
            const enemyMesh = enemy.getMesh();

            // Vérifie si l'ennemi est assigné à un collectible
            const assignedCollectible = this.getAssignedCollectible(enemyMesh.position);
            if (assignedCollectible) {
                // L'ennemi défend un collectible : léger déplacement autour du collectible
                const collectiblePosition = assignedCollectible.getPosition();
                const distanceToCollectible = Vector3.Distance(enemyMesh.position, collectiblePosition);

                if (distanceToCollectible > 5) {
                    // Si l'ennemi s'éloigne trop, le ramener près du collectible
                    const directionToCollectible = collectiblePosition.subtract(enemyMesh.position).normalize();
                    enemyMesh.position.addInPlace(directionToCollectible.scale(deltaTime * 2)); // Déplacement vers le collectible
                } else {
                    // Sinon, léger déplacement aléatoire autour du collectible
                    const randomDirection = new Vector3(
                        Math.random() * 0.5 - 0.25,
                        0,
                        Math.random() * 0.5 - 0.25
                    );
                    enemyMesh.position.addInPlace(randomDirection);
                }
            } else {
                // Déplacement aléatoire pour les ennemis éloignés des collectibles
                const randomDirection = new Vector3(
                    Math.random() * 2 - 1,
                    0,
                    Math.random() * 2 - 1
                ).normalize();
                enemyMesh.position.addInPlace(randomDirection.scale(deltaTime * 2)); // Déplacement lent
            }

            // Vérifie si l'ennemi "voit" le joueur
            const directionToPlayer = this.player.getCapsule().position.subtract(enemyMesh.position).normalize();
            const ray = new Ray(enemyMesh.position, directionToPlayer);
            const hit = this.scene.pickWithRay(ray, (mesh) => mesh === this.player.getCapsule());

            if (hit && hit.pickedMesh) {
                enemy.shootAtPlayer(this.scene, this.player.getCapsule().position);
            }
        });
    }

    private getAssignedCollectible(enemyPosition: Vector3): Collectible | null {
        // Retourne le collectible le plus proche si l'ennemi est assigné à un collectible
        for (const collectible of this.collectibles) {
            const distance = Vector3.Distance(collectible.getPosition(), enemyPosition);
            if (distance < 10) { // Considérer comme assigné si à moins de 10 unités
                return collectible;
            }
        }
        return null;
    }
}