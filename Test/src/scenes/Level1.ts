import {
    Scene, Vector3, MeshBuilder, StandardMaterial, FollowCamera, HemisphericLight,
    FreeCamera, KeyboardEventTypes, Ray, Color3, Mesh, Texture
} from "@babylonjs/core";
import { PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core";
import { Player } from "../components/Player";
import { setupControls } from "../core/InputManager";
import { MazeGenerator } from "../procedural/MazeGenerator";
import { Collectible } from "../components/Collectible";
import { HUD } from "../components/HUD";
import { Enemy } from "../components/Enemy";
import { Music } from "../music/music";
import { PNJ } from "../components/PNJ";
import { DialogManager } from "../Dialog/DialogManager";
import { MissionManager } from "../core/MissionManager";

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
    private projectiles: Mesh[] = [];
    private music: Music;
    private missionManager: MissionManager;
    private dialogManager: DialogManager;
    private pnj!: PNJ;
    private endPoint!: Mesh;
    private isDialogActive: boolean = false;
    private hasTalkedToPNJ: boolean = false;

    constructor(scene: Scene, canvas: HTMLCanvasElement) {
        this.scene = scene;
        this.canvas = canvas;
        this.hud = new HUD();
        this.music = new Music("./src/music/soundstrack/Item Bounce - Kirby Air Ride.mp3");
        this.missionManager = new MissionManager(this.hud);
        this.dialogManager = new DialogManager(scene);
        this.init();
    }

    private async init() {
        console.log("🔨 Création du niveau 1...");

        this.scene.collisionsEnabled = true;
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

        const playerStart = MazeGenerator.spawnZones.playerStart;
        this.player = new Player(this.scene, playerStart);
        await this.player.meshReady();

        this.setupFollowCamera();
        this.setupFreeCamera();
        this.setupCameraSwitch();
        this.setupShooting();

        for (const pos of MazeGenerator.spawnZones.collectibles) {
            const collectible = new Collectible(this.scene, pos, () => this.collectItem());
            this.collectibles.push(collectible);
        }

        this.spawnEnemies();

        this.pnj = new PNJ(this.scene, new Vector3(0, 0, 0));

        setupControls(this.player);

        // Initialise le dialogue d'intro
        this.dialogManager.initIntroDialog(this.scene, this.pnj, this.hud, () => {
            // Appelé uniquement après la fin de l'intro
            this.missionManager.setMission("Talk to the PNJ");
            this.pnj.enableInteraction(() => this.handlePNJInteraction(), () => this.isDialogActive);
        });

        this.updateScene();

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
        this.followCamera.lockedTarget = this.player.getCapsule();
        this.followCamera.radius = 25;
        this.followCamera.heightOffset = 9;
        this.followCamera.rotationOffset = 0;
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
        window.addEventListener("keydown", (event) => {
            if (event.key.toLowerCase() === "f") {
                this.shootProjectile();
            }
        });

        this.scene.onBeforeRenderObservable.add(() => {
            this.updateProjectiles();
        });
    }

    private shootProjectile() {
        const playerPosition = this.player.getCapsule().position.clone();
        let forwardVector = this.player.getCapsule().forward.normalize();
        forwardVector = forwardVector.scale(-1);

        const projectile = MeshBuilder.CreateSphere("projectile", { diameter: 0.5 }, this.scene);
        projectile.position = playerPosition.add(forwardVector.scale(2));

        const material = new StandardMaterial("projectileMat", this.scene);
        material.diffuseColor = new Color3(0, 0, 1);
        projectile.material = material;

        const velocity = forwardVector.scale(20);
        projectile.metadata = { velocity };

        this.projectiles.push(projectile);
    }

    private updateGameStateAndHUD() {
        const playerPosition = this.player.getCapsulePosition();

        if (!this.dialogManager.hasSeenIntro()) {
            // Pas encore vu l’intro : ne rien afficher
            this.hud.hideCounter();
            this.hud.hideDistance();
            this.hud.updateMission("");
            return;
        }

        if (!this.hasTalkedToPNJ) {
            const pnjPosition = this.pnj.getPosition();
            if (pnjPosition && playerPosition) {
                const dist = Vector3.Distance(playerPosition, pnjPosition);
                this.hud.updateMission("Parler à l'inconnu");
                this.hud.updateDistance(dist, "PNJ");
                this.hud.showDistance();
                this.hud.hideCounter();
            }
            return;
        }

        if (this.collectedCount < this.totalCollectibles) {
            const closest = this.getClosestCollectible();
            if (closest && playerPosition) {
                const dist = Vector3.Distance(playerPosition, closest.getPosition());
                this.hud.updateMission("Collecter les collectibles");
                this.hud.updateDistance(dist, "Collectible le plus proche");
                this.hud.showCollectiblesHUD();
                this.hud.update(this.collectedCount, this.totalCollectibles);
            }
            return;
        }

        // Tous les collectibles récupérés
        if (!this.endPoint) {
            this.spawnEndZone(); // La zone est créée ici dynamiquement
        }

        const distToEnd = Vector3.Distance(playerPosition, this.endPoint.position);
        this.hud.updateMission("Aller à la zone de fin");
        this.hud.updateDistance(distToEnd, "Zone de fin");
        this.hud.showDistance();
        this.hud.hideCounter();
    }

    private updateScene() {
        this.scene.onBeforeRenderObservable.add(() => {
            this.updateGameStateAndHUD(); // Remplace updateHUDForMission
            this.collectibles.forEach(collectible => collectible.checkCollision(this.player.getCapsule()));
            this.updateProjectiles();
            this.updateEnemies();
            this.music.playMusic();
        });
    }

    private collectItem() {
        if (this.collectedCount < this.totalCollectibles) {
            this.collectedCount++;
            this.hud.update(this.collectedCount, this.totalCollectibles);

            if (this.collectedCount === this.totalCollectibles) {
                this.hud.hideCollectiblesHUD();
                this.spawnEndZone();
            }
        }
    }

    private handlePNJInteraction() {
        this.isDialogActive = true;
        this.pnj.setVisible(false); // Masque le PNJ pendant le dialogue

        if (!this.hasTalkedToPNJ) {
            this.dialogManager.startPNJDialog([
                "Bonjour, étranger. Vous êtes perdu ?",
                "Collectez les objets pour sortir.",
                "Bonne chance !"
            ], () => {
                this.isDialogActive = false;
                this.pnj.setVisible(true); // Réaffiche le PNJ après le dialogue
                this.hasTalkedToPNJ = true;
                this.missionManager.setMission("Collect the collectibles");
            });
        } else {
            this.dialogManager.startPNJDialog([
                "Allez, qu'est-ce que tu attends ?",
                "Va chercher ces collectibles !"
            ], () => {
                this.isDialogActive = false;
                this.pnj.setVisible(true); // Réaffiche le PNJ après le dialogue
            });
        }
    }

    private getClosestCollectible(): Collectible | null {
        let closest: Collectible | null = null;
        let minDistance = Infinity;

        for (const collectible of this.collectibles) {
            const dist = Vector3.Distance(this.player.getCapsule().position, collectible.getPosition());
            if (dist < minDistance && collectible.getPosition().length() > 0) {
                closest = collectible;
                minDistance = dist;
            }
        }

        return closest;
    }

    private spawnEnemies() {
        const minDistanceBetweenEnemies = 8; // Augmentation de la distance minimale entre les ennemis
        const spawnRadius = 8; // Rayon autour du collectible pour le spawn aléatoire
        const maxAttempts = 20; // Limite de tentatives pour éviter une boucle infinie

        for (const collectiblePos of MazeGenerator.spawnZones.collectibles) {
            let spawned = 0;
            const maxEnemiesPerZone = 3; // Nombre maximum d'ennemis par zone
            const angleStep = (2 * Math.PI) / maxEnemiesPerZone; // Répartition uniforme en cercle
            const baseAngle = Math.random() * 2 * Math.PI; // Angle de départ aléatoire

            while (spawned < maxEnemiesPerZone) {
                let attempts = 0;

                while (attempts < maxAttempts) {
                    attempts++;

                    // Calcul de la position en cercle avec une variation de distance
                    const angle = baseAngle + angleStep * spawned;
                    const distance = 5 + Math.random() * 3; // Rayon entre 5 et 8
                    const offsetX = Math.cos(angle) * distance;
                    const offsetZ = Math.sin(angle) * distance;
                    const pos = new Vector3(collectiblePos.x + offsetX, 6.2, collectiblePos.z + offsetZ);

                    // Vérifie si la position est dans un mur ou trop proche d'un autre ennemi
                    const isInWall = MazeGenerator.isWallPosition(pos.x, pos.z);
                    const tooClose = this.enemies.some(enemy => {
                        const mesh = enemy.getMesh();
                        return mesh && Vector3.Distance(mesh.position, pos) < minDistanceBetweenEnemies;
                    });

                    if (!isInWall && !tooClose) {
                        const enemy = new Enemy(this.scene, pos, 100);
                        this.enemies.push(enemy);
                        spawned++;
                        break; // Passe au prochain ennemi
                    }
                }

                if (attempts >= maxAttempts) {
                    console.warn(`⚠️ Impossible de placer un ennemi après ${maxAttempts} tentatives.`);
                    break; // Arrête si trop de tentatives échouent
                }
            }
        }
    }

    private updateEnemies() {
        const delta = this.scene.getEngine().getDeltaTime() / 1000;
        for (const enemy of this.enemies) {
            const mesh = enemy.getMesh();
            if (!mesh) continue;
            const dirToPlayer = this.player.getCapsule().position.subtract(mesh.position).normalize();
            const ray = new Ray(mesh.position, dirToPlayer);
            const hit = this.scene.pickWithRay(ray, m => m === this.player.getCapsule());
            if (hit && hit.pickedMesh) {
                enemy.shootAtPlayer(this.scene, this.player.getCapsule().position);
            }
        }
    }

    private updateProjectiles() {
        const delta = this.scene.getEngine().getDeltaTime() / 1000;

        this.projectiles = this.projectiles.filter(proj => {
            if (!proj) return false;
            const velocity = proj.metadata.velocity;
            proj.position.addInPlace(velocity.scale(delta));

            for (const enemy of this.enemies) {
                const capsule = enemy.getCapsule();
                if (capsule && capsule.intersectsMesh(proj, false)) {
                    enemy.reduceHealth(50); // Réduit la santé de l'ennemi
                    proj.dispose(); // Supprime le projectile
                    if (enemy.getHealth() <= 0) {
                        const enemyMesh = enemy.getMesh();
                        if (enemyMesh) {
                            enemyMesh.dispose(); // Supprime l'ennemi de la scène
                        }
                        this.enemies = this.enemies.filter(e => e !== enemy); // Supprime l'ennemi de la liste
                    }
                    return false; // Supprime le projectile de la scène
                }
            }

            if (proj.position.length() > 1000) {
                proj.dispose();
                return false;
            }

            return true;
        });
    }

    private spawnEndZone() {
        this.endPoint = MeshBuilder.CreateDisc("endZone", { radius: 5 }, this.scene);

        // Place la zone de fin à la position initiale du joueur
        const playerStart = MazeGenerator.spawnZones.playerStart.clone();
        this.endPoint.position = new Vector3(playerStart.x, 0.1, playerStart.z);

        const mat = new StandardMaterial("endZoneMat", this.scene);
        mat.diffuseColor = new Color3(0, 1, 0);
        this.endPoint.material = mat;
        this.endPoint.isPickable = true;

        // Création du pop-up
        const endZoneHint = document.createElement("div");
        endZoneHint.style.position = "absolute";
        endZoneHint.style.bottom = "50px";
        endZoneHint.style.left = "50%";
        endZoneHint.style.transform = "translateX(-50%)";
        endZoneHint.style.padding = "10px 20px";
        endZoneHint.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        endZoneHint.style.color = "white";
        endZoneHint.style.fontFamily = "Arial, sans-serif";
        endZoneHint.style.fontSize = "18px";
        endZoneHint.style.borderRadius = "5px";
        endZoneHint.style.display = "none";
        endZoneHint.innerText = "Appuyez sur E pour passer au niveau suivant";
        document.body.appendChild(endZoneHint);

        this.scene.onBeforeRenderObservable.add(() => {
            const dist = Vector3.Distance(this.player.getCapsule().position, this.endPoint.position);
            this.hud.updateDistance(Math.round(dist), "Zone de fin");

            // Affiche ou masque le pop-up en fonction de la distance
            if (dist < 5) {
                endZoneHint.style.display = "block";
            } else {
                endZoneHint.style.display = "none";
            }
        });

        window.addEventListener("keydown", (event) => {
            if (event.key.toLowerCase() === "e") {
                const dist = Vector3.Distance(this.player.getCapsule().position, this.endPoint.position);
                if (dist < 5) {
                    console.log("🎉 Niveau terminé !");
                    endZoneHint.style.display = "none"; // Masque le pop-up
                    this.loadLevel2(); // Charge le niveau 2
                }
            }
        });
    }

    private loadLevel2() {
        console.log("🔄 Chargement du niveau 2...");
        import("./Level2").then(({ Level2 }) => {
            new Level2(this.scene, this.canvas); // Initialise le niveau 2
        }).catch((error) => {
            console.error("❌ Erreur lors du chargement du niveau 2 :", error);
        });
    }

    private endLevel() {
        console.log("🏆 Félicitations, vous avez terminé le niveau !");
    }
}