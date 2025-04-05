import { Scene, Vector3, MeshBuilder, StandardMaterial, FollowCamera, HemisphericLight, FreeCamera, KeyboardEventTypes, Ray, Color3, Mesh, Texture } from "@babylonjs/core";
import { PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core";
import { Player } from "../components/Player";
import { setupControls } from "../core/InputManager";
import { MazeGenerator, isWallPosition } from "../procedural/MazeGenerator";
import { Collectible } from "../components/Collectible";
import { HUD } from "../components/HUD";
import { Enemy } from "../components/Enemy";
import { Music } from "../music/music";

export class Level1 {
    private scene: Scene;
    private canvas!: HTMLCanvasElement;
    private player!: Player;
    private followCamera!: FollowCamera;
    private freeCamera!: FreeCamera;
    private isFreeCamera: boolean = false;
    private collectibles: Collectible[] = [];
    private enemies: Enemy[] = [];
    private hud!: HUD;
    private collectedCount: number = 0;
    private totalCollectibles: number = 3;
    private lastInvisibleWall: Mesh | null = null;
    private projectiles: Mesh[] = [];
    private music!: Music;
    private currentMission: string = "Introduction";
    private dialogs: string[] = [];
    private pnj!: Mesh;
    private endPoint!: Mesh;
    private dialogBox: HTMLElement | null = null;
    private dialogIndex: number = 0;
    private dialogActive: boolean = false;

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

        const groundMaterial = new StandardMaterial("groundMaterial", this.scene);
        groundMaterial.diffuseTexture = new Texture("./src/assets/textures/nuage.avif", this.scene);
        ground.material = groundMaterial;
        (groundMaterial.diffuseTexture as Texture).uScale = 25;
        (groundMaterial.diffuseTexture as Texture).vScale = 25;

        new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0 }, this.scene);

        MazeGenerator.deploy(this.scene);

        this.player = new Player(this.scene, new Vector3(-20, 5, -10));
        await this.player.meshReady();

        this.setupFollowCamera();
        this.setupFreeCamera();
        this.setupCameraSwitch();
        this.setupShooting();

        this.spawnCollectibles();
        this.spawnEnemies();
        setupControls(this.player);

        this.initMissions();

        this.scene.onBeforeRenderObservable.add(() => {
            this.collectibles.forEach(collectible => collectible.checkCollision(this.player.getCapsule()));
            this.updateHUDWithDistance();
            this.player.checkForObstacles(this.followCamera, this.lastInvisibleWall);
            this.updateProjectiles();
            this.updateEnemies();
            this.music.playMusic();
            this.checkMissionProgress();
        });

        window.addEventListener("keydown", (ev) => {
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.key === "I") {
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
        this.followCamera.inputs.clear();
        this.scene.activeCamera = this.followCamera;
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
            this.scene.activeCamera = this.freeCamera;
            this.freeCamera.attachControl();
        } else {
            this.scene.activeCamera = this.followCamera;
            this.freeCamera.detachControl();
        }
    }

    private setupShooting() {
        // Écouteur pour détecter l'appui sur la touche "F" pour tirer
        window.addEventListener("keydown", (event) => {
            if (event.key.toLowerCase() === "f") { // Appuie sur la touche "F"
                this.shootProjectile();
            }
        });

        // Met à jour les projectiles à chaque frame
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

    private spawnCollectibles() {
        let spawned = 0;
        const minDistanceFromWalls = 3;
        const minDistanceFromPlayer = 50; // ✅ Collectibles spawn beaucoup plus loin du joueur
        const minDistanceBetweenCollectibles = 10;

        while (spawned < this.totalCollectibles) {
            const pos = this.getValidPositionInMaze(minDistanceFromWalls, minDistanceFromPlayer);

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
    }

    private getValidPositionInMaze(minDistanceFromWalls: number, minDistanceFromPlayer: number): Vector3 {
        let valid = false;
        let position: Vector3 = new Vector3(0, 1, 0);
        let attempts = 0; // ✅ Compteur de tentatives
        while (!valid) {
            attempts++;
            if (attempts > 100) {
                console.warn("Impossible de trouver une position valide après plusieurs tentatives !");
                return position;
            }

            const x = Math.floor(Math.random() * 50) * 2 - 50;
            const z = Math.floor(Math.random() * 50) * 2 - 50;
            position = new Vector3(x, 1, z);

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
            this.collectedCount++;
            this.hud.update(this.collectedCount, this.totalCollectibles);

            if (this.collectedCount === this.totalCollectibles) {
                this.hud.hideCollectiblesHUD();
            }
        }
    }

    private updateHUDWithDistance() {
        if (this.collectibles.length === 0) {
            this.hud.updateDistance(0);
            return;
        }

        let closestDistance = Infinity;

        for (const collectible of this.collectibles) {
            if (!collectible.getPosition()) continue;
            const dist = Vector3.Distance(this.player.getCapsule().position, collectible.getPosition());
            if (dist < closestDistance) {
                closestDistance = dist;
            }
        }

        this.hud.updateDistance(Math.round(closestDistance));
    }

    private spawnEnemies() {
        const minDistanceFromWalls = 3;
        const minDistanceFromPlayer = 70; // Les ennemis spawnent loin du joueur
        const minDistanceBetweenEnemies = 15;

        // Spawner des ennemis autour des collectibles
        this.collectibles.forEach((collectible) => {
            for (let i = 0; i < 2; i++) {
                const collectiblePosition = collectible.getPosition();
                const offset = new Vector3(
                    Math.random() * 6 - 3,
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

        // Spawner des ennemis aléatoirement dans le labyrinthe
        let spawnedInMaze = 0;
        while (spawnedInMaze < 5) {
            const pos = this.getValidPositionInMaze(minDistanceFromWalls, minDistanceFromPlayer);

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
    }

    private updateEnemies() {
        const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;

        this.enemies.forEach((enemy) => {
            const enemyMesh = enemy.getMesh();

            const directionToPlayer = this.player.getCapsule().position.subtract(enemyMesh.position).normalize();
            const ray = new Ray(enemyMesh.position, directionToPlayer);
            const hit = this.scene.pickWithRay(ray, (mesh) => mesh === this.player.getCapsule());

            if (hit && hit.pickedMesh) {
                enemy.shootAtPlayer(this.scene, this.player.getCapsule().position);
            }
        });
    }

    private updateProjectiles() {
        const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;

        this.projectiles = this.projectiles.filter((projectile) => {
            if (!projectile) return false;

            const velocity = projectile.metadata.velocity;
            projectile.position.addInPlace(velocity.scale(deltaTime));

            for (const enemy of this.enemies) {
                if (enemy.getMesh().intersectsMesh(projectile, false)) {
                    enemy.reduceHealth(50);
                    projectile.dispose();
                    return false;
                }
            }

            if (projectile.position.length() > 1000) {
                projectile.dispose();
                return false;
            }

            return true;
        });
    }

    private setupDialogBox() {
        this.dialogBox = document.createElement("div");
        this.dialogBox.style.position = "absolute";
        this.dialogBox.style.bottom = "20px";
        this.dialogBox.style.left = "50%";
        this.dialogBox.style.transform = "translateX(-50%)";
        this.dialogBox.style.padding = "20px";
        this.dialogBox.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        this.dialogBox.style.color = "white";
        this.dialogBox.style.fontFamily = "Arial, sans-serif";
        this.dialogBox.style.fontSize = "18px";
        this.dialogBox.style.borderRadius = "10px";
        this.dialogBox.style.display = "none";
        document.body.appendChild(this.dialogBox);

        // Ajoutez un écouteur pour passer au texte suivant avec "Espace"
        window.addEventListener("keydown", (event) => {
            if (this.dialogActive && event.key === " ") { // Appuie sur "Espace"
                this.advanceDialog();
            }
        });
    }

    private startDialog(dialogs: string[], onComplete: () => void) {
        this.dialogs = dialogs;
        this.dialogIndex = 0;
        this.dialogActive = true;

        if (this.dialogBox) {
            this.dialogBox.innerText = `${this.dialogs[this.dialogIndex]} (Press Space to skip)`;
            this.dialogBox.style.display = "block";
        }

        // Empêche le joueur de bouger pendant le dialogue
        this.scene.onBeforeRenderObservable.clear();

        // Stocke la fonction à exécuter une fois le dialogue terminé
        this.dialogBox!.dataset.onComplete = onComplete.toString();
    }

    private advanceDialog() {
        this.dialogIndex++;
        if (this.dialogIndex < this.dialogs.length) {
            if (this.dialogBox) {
                this.dialogBox.innerText = `${this.dialogs[this.dialogIndex]} (Press Space to skip)`;
            }
        } else {
            // Fin du dialogue
            this.dialogActive = false;
            if (this.dialogBox) {
                this.dialogBox.style.display = "none";
            }

            // Réactive les interactions
            setupControls(this.player); // ✅ Réactive les contrôles du joueur
            this.scene.onBeforeRenderObservable.add(() => {
                this.collectibles.forEach(collectible => collectible.checkCollision(this.player.getCapsule()));
                this.updateHUDWithDistance();
                this.player.checkForObstacles(this.followCamera, this.lastInvisibleWall);
                this.updateProjectiles();
                this.updateEnemies();
                this.music.playMusic();
                this.checkMissionProgress();
            });

            // Exécute la fonction de fin de dialogue
            const onComplete = this.dialogBox!.dataset.onComplete;
            if (onComplete) eval(onComplete)();
        }
    }

    private initMissions() {
        this.setupDialogBox();

        // Démarre le premier dialogue
        this.startDialog(
            ["Bienvenue dans le jeu !", "Votre première mission est de parler au PNJ."],
            () => {
                this.currentMission = "Talk to the PNJ";
                this.hud.updateMission(this.currentMission);
                this.spawnPNJ();
            }
        );
    }

    private spawnPNJ() {
        this.pnj = MeshBuilder.CreateSphere("pnj", { diameter: 2 }, this.scene);
        const playerPosition = this.player.getCapsule().position;
        this.pnj.position = new Vector3(playerPosition.x + 5, 1, playerPosition.z + 5); // ✅ PNJ spawn proche mais pas trop près

        const material = new StandardMaterial("pnjMat", this.scene);
        material.diffuseColor = new Color3(0, 0, 1); // Bleu
        this.pnj.material = material;

        // Vérifie si le joueur est proche du PNJ
        this.scene.onBeforeRenderObservable.add(() => {
            const distance = Vector3.Distance(this.player.getCapsule().position, this.pnj.position);
            if (distance < 5) {
                this.hud.updateMission("Press 'E' to talk to the PNJ");

                // Ajoute un écouteur pour interagir avec le PNJ
                window.addEventListener("keydown", (event) => {
                    if (event.key.toLowerCase() === "e") {
                        this.startDialog(
                            ["Bonjour, aventurier !", "Votre mission est de collecter tous les objets."],
                            () => {
                                this.currentMission = "Collect all items";
                                this.hud.updateMission(this.currentMission);
                            }
                        );
                    }
                });
            }
        });
    }

    private checkMissionProgress() {
        // Ajoutez ici la logique pour vérifier la progression des missions
    }
}