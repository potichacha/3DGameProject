import {
    Scene, Vector3, MeshBuilder, StandardMaterial, FollowCamera, HemisphericLight,
    FreeCamera, KeyboardEventTypes, Ray, Color3, Mesh, Texture, PointLight
} from "@babylonjs/core";
import { PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core";
import { Level } from "../scenes/Level"; // Ensure the correct path to the Level class or interface
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
import { Projectile } from "../components/Projectile";
import { SceneUtils } from "../utils/SceneUtils";

const LIGHT_INTENSITY = 1.0; // Intensité commune
const LIGHT_RANGE = 30; // Portée commune

export class Level1 extends Level {
    protected scene!: Scene;
    protected canvas!: HTMLCanvasElement;
    protected player!: Player;
    protected followCamera!: FollowCamera;
    private freeCamera!: FreeCamera;
    private topViewCamera!: FreeCamera; // Caméra vue du dessus
    private isFreeCamera: boolean = false;
    private collectibles: Collectible[] = [];
    private enemies: Enemy[] = [];
    private hud: HUD;
    private collectedCount: number = 0;
    private totalCollectibles: number = 5; // Augmenté à 5 collectibles
    private projectiles!: Projectile;
    private music: Music;
    private missionManager: MissionManager;
    private dialogManager: DialogManager;
    private pnj!: PNJ;
    private endPoint!: Mesh;
    private isDialogActive: boolean = false;
    private hasTalkedToPNJ: boolean = false;

    constructor(scene: Scene, canvas: HTMLCanvasElement) {
        super(scene, canvas);
        this.hud = new HUD();
        this.music = new Music("./src/music/soundstrack/maze.mp3");
        this.missionManager = new MissionManager(this.hud);
        this.dialogManager = new DialogManager(scene);
        this.init();
    }

    private async init() {
        console.log("🔨 Création du niveau 1...");

        this.scene.collisionsEnabled = true;

        // Lumière hémisphérique globale pour un éclairage doux
        const light = new HemisphericLight("light1", new Vector3(0, 1, 0), this.scene);
        light.intensity = 0.3; // Réduit l'intensité pour conserver l'effet sombre

        // Lumière ponctuelle mobile pour suivre le joueur
        const playerLight = new PointLight("playerLight", new Vector3(0, 10, 0), this.scene);
        playerLight.intensity = LIGHT_INTENSITY; // Utilisation de la constante
        playerLight.range = LIGHT_RANGE; // Utilisation de la constante

        // Ajout d'un effet de brouillard pour renforcer l'ambiance sombre
        this.scene.fogMode = Scene.FOGMODE_EXP; //ici pour enlever le fog
        this.scene.fogDensity = 0.02; // Ajustez pour plus ou moins de visibilité
        this.scene.fogColor = new Color3(0, 0, 0); // Noir pour un effet sombre

        const groundSize = 1000;
        const ground = MeshBuilder.CreateGround("ground", { width: groundSize, height: groundSize }, this.scene);
        ground.checkCollisions = true;

        const groundMaterial = new StandardMaterial("groundMaterial", this.scene);
        groundMaterial.diffuseTexture = new Texture("./src/assets/textures/cloud2.jpg", this.scene);
        ground.material = groundMaterial;
        (groundMaterial.diffuseTexture as Texture).uScale = 25;
        (groundMaterial.diffuseTexture as Texture).vScale = 25;

        new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0 }, this.scene);

        MazeGenerator.deploy(this.scene);

        const playerStart = MazeGenerator.spawnZones.playerStart;
        this.player = new Player(this.scene, playerStart,"SinjUltime.glb",this.hud,1);
        this.projectiles = new Projectile(this.scene, this.player, this.enemies);
        await this.player.meshReady();

        super.setupFollowCamera();
        this.setupFreeCamera();
        this.setupTopViewCamera();
        this.setupCameraSwitch();

        for (const pos of MazeGenerator.spawnZones.collectibles) {
            const collectible = new Collectible(this.scene, pos, () => this.collectItem());
            this.collectibles.push(collectible);
        }

        this.spawnEnemies();

        this.pnj = new PNJ(this.scene, new Vector3(0, 1, 0));

        setupControls(this.player);
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
        this.dialogManager.startIntroMonologue(() => {
            this.missionManager.setMission("Trouver quelqu’un...");
            this.pnj.enableInteraction(() => this.handlePNJInteraction(), () => this.isDialogActive);
        });
        console.log("✅ Niveau 1 prêt !");
    }

    private setupFreeCamera() {
        this.freeCamera = new FreeCamera("FreeCamera", new Vector3(0, 10, 0), this.scene);
        this.freeCamera.attachControl(this.canvas, true);
        this.freeCamera.speed = 5;
        this.freeCamera.detachControl();
    }

    private setupTopViewCamera() {
        this.topViewCamera = new FreeCamera("TopViewCamera", new Vector3(0, 50, 0), this.scene); // Hauteur ajustée à 40
        this.topViewCamera.setTarget(new Vector3(0, 0, 0)); // Regarde vers le bas
        this.topViewCamera.mode = FreeCamera.ORTHOGRAPHIC_CAMERA; // Vue orthographique pour un effet "carte"
        this.topViewCamera.attachControl(this.canvas, true);
        this.topViewCamera.detachControl(); // Par défaut, elle n'est pas active
    }

    private setupCameraSwitch() {
        this.scene.onKeyboardObservable.add((kbInfo) => {
            if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
                if (kbInfo.event.key.toLowerCase() === "c") {
                    this.toggleFreeCamera();
                } else if (kbInfo.event.key.toLowerCase() === "v") {
                    this.switchToTopViewCamera();
                }
            } else if (kbInfo.type === KeyboardEventTypes.KEYUP && kbInfo.event.key.toLowerCase() === "v") {
                this.switchToFollowCamera();
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

    private switchToTopViewCamera() {
        if (this.topViewCamera) {
            this.scene.activeCamera = this.topViewCamera;
            this.topViewCamera.position = this.player.getCapsule().position.add(new Vector3(0, 50, 0)); // Ajuste la hauteur à 40
            this.topViewCamera.setTarget(this.player.getCapsule().position);
            this.topViewCamera.attachControl();
        }
    }

    private switchToFollowCamera() {
        if (this.followCamera) {
            this.scene.activeCamera = this.followCamera;
            this.followCamera.attachControl();
        }
    }

    private handlePNJInteraction() {
        this.isDialogActive = true;
        this.pnj.setVisible(false);

        if (!this.hasTalkedToPNJ) {
            this.dialogManager.startFirstPNJDialog(() => {
                this.isDialogActive = false;
                this.pnj.setVisible(true);
                this.hasTalkedToPNJ = true;
                this.missionManager.setMission("Collect the collectibles");
                //this.loadLevel2(); pour passer direct au level2 (debug)
            });
        } else if (this.collectedCount >= this.totalCollectibles) {
            this.dialogManager.startAllCollectedDialog(() => {
                this.isDialogActive = false;
                this.pnj.setVisible(true);
                this.missionManager.setMission("Atteindre la zone de fin");
            });
        } else {
            this.dialogManager.startFirstPNJDialog(() => {
                this.isDialogActive = false;
                this.pnj.setVisible(true);
            });
        }
    }

    private updateGameStateAndHUD() {
        const playerPosition = this.player.getCapsulePosition();

        if (!this.dialogManager.hasSeenIntro()) {
            // Pas encore vu l’intro : ne rien afficher
            this.hud.hideCounter();
            this.hud.hideDistance();
            this.hud.updateMission(""); // Efface la mission
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
                this.hud.updateMission("Collecter les collectibles"); // Affiche uniquement si nécessaire
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
            this.updateGameStateAndHUD();
            this.collectibles.forEach(collectible => collectible.checkCollision(this.player.getCapsule()));
            this.projectiles.updateProjectiles();
            this.updateEnemies();

            // Déplace la lumière ponctuelle pour suivre le joueur
            const playerLight = this.scene.getLightByName("playerLight") as PointLight;
            if (playerLight) {
                playerLight.position = this.player.getCapsule().position.clone().add(new Vector3(0, 10, 0));
            }
            if(this.player.getHealth() <= 0) {
                //MazeGenerator.deploy(this.scene); //A modifier ici <-------------------------------------------------------
            }
        });
        window.addEventListener("keydown", () => {
            this.music.playMusic();
        }, { once: true });
        window.addEventListener("click", () => {
            this.music.playMusic();
        }, { once: true });
    }

    private collectItem() {
        if (this.collectedCount < this.totalCollectibles) {
            this.collectedCount++;
            this.hud.update(this.collectedCount, this.totalCollectibles);

            if (this.collectedCount === this.totalCollectibles) {
                this.hud.hideCollectiblesHUD();

                // Téléportation du joueur près du PNJ
                const pnjPosition = this.pnj.getPosition();
                const teleportPosition = new Vector3(pnjPosition.x + 1, pnjPosition.y, pnjPosition.z);
                this.player.getCapsule().position = teleportPosition;
                console.log(`📍 Joueur téléporté près du PNJ à la position : ${teleportPosition}`);

                // Mise à jour de la mission
                this.missionManager.setMission("Parler à l'inconnu pour continuer");

                // Spawn de la zone de fin près du joueur
                this.spawnEndZoneNearPlayer();
            }
        }
    }

    private spawnEndZoneNearPlayer() {
        this.endPoint = MeshBuilder.CreateDisc("endZone", { radius: 5 }, this.scene);

        // Place la zone de fin à proximité du joueur
        const playerPosition = this.player.getCapsulePosition();
        this.endPoint.position = new Vector3(playerPosition.x, 0.1, playerPosition.z + 5);

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
        const minDistanceBetweenEnemies = 10; // Ajusté pour la taille réduite
        const maxEnemiesPerZone = 4; // Augmenté pour équilibrer avec 5 collectibles

        for (const collectiblePos of MazeGenerator.spawnZones.collectibles) {
            let spawned = 0;
            const angleStep = (2 * Math.PI) / maxEnemiesPerZone;
// Rayon autour du collectible pour le spawn aléatoire
            const maxAttempts = 20; // Limite de tentatives pour éviter une boucle infinie

            while (spawned < maxEnemiesPerZone) {
                let attempts = 0;

                while (attempts < maxAttempts) {
                    attempts++;

                    // Calcul de la position en cercle avec une variation de distance
                    const angle = angleStep * spawned;
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
        for (const enemy of this.enemies) {
            const mesh = enemy.getMesh();
            if (!mesh) continue;
            const dirToPlayer = this.player.getCapsule().position.subtract(mesh.position).normalize();
            const ray = new Ray(mesh.position, dirToPlayer);
            const hit = this.scene.pickWithRay(ray, m => m === this.player.getCapsule());
            if (hit && hit.pickedMesh) {
                enemy.shootAtPlayer(this.scene, this.player);
            }
        }
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
        SceneUtils.clearScene(this.scene);
        import("./Level2").then(({ Level2 }) => { // Correction du chemin vers Level2B
            new Level2(this.scene, this.canvas); // Initialise le niveau 2
        }).catch((error) => {
            console.error("❌ Erreur lors du chargement du niveau 2 :", error);
        });
    }
}