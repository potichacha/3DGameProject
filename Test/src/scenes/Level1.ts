import {
    Scene, Vector3, MeshBuilder, StandardMaterial, FollowCamera, HemisphericLight,
    FreeCamera, KeyboardEventTypes, Ray, Color3, Mesh, Texture, DynamicTexture, PointLight, SceneLoader
} from "@babylonjs/core";
import { PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core";
import { Level } from "../scenes/Level";
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

const LIGHT_INTENSITY = 1.0;
const LIGHT_RANGE = 30;

export class Level1 extends Level {
    protected scene!: Scene;
    protected canvas!: HTMLCanvasElement;
    protected player!: Player;
    protected followCamera!: FollowCamera;
    private freeCamera!: FreeCamera;
    private topViewCamera!: FreeCamera;
    private isFreeCamera: boolean = false;
    private collectibles: Collectible[] = [];
    private enemies: Enemy[] = [];
    private hud: HUD;
    private collectedCount: number = 0;
    private totalCollectibles: number = 5;
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
        this.music = new Music("./src/music/soundstrack/Item Bounce - Kirby Air Ride.mp3");
        this.missionManager = new MissionManager(this.hud);
        this.dialogManager = new DialogManager(scene);
        this.init();
    }

    private async init() {
        this.scene.collisionsEnabled = true;

        const light = new HemisphericLight("light1", new Vector3(0, 1, 0), this.scene);
        light.intensity = 0.3;

        const playerLight = new PointLight("playerLight", new Vector3(0, 10, 0), this.scene);
        playerLight.intensity = LIGHT_INTENSITY;
        playerLight.range = LIGHT_RANGE;

        this.scene.fogDensity = 0.02;
        this.scene.fogColor = new Color3(0, 0, 0);

        const ground = MeshBuilder.CreateGround("ground", { width: 1000, height: 1000 }, this.scene);
        ground.checkCollisions = true;
        const groundMaterial = new StandardMaterial("groundMaterial", this.scene);
        groundMaterial.diffuseTexture = new Texture("./src/assets/textures/cloud2.jpg", this.scene);
        ground.material = groundMaterial;
        (groundMaterial.diffuseTexture as Texture).uScale = 25;
        (groundMaterial.diffuseTexture as Texture).vScale = 25;
        new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0 }, this.scene);

        MazeGenerator.deploy(this.scene);

        // Charger les meshes pour le niveau 1
        await SceneLoader.AppendAsync("./src/assets/models/", "level1_environment.glb", this.scene);
        console.log("🔍 Meshes du niveau 1 chargés !");
        const environmentMesh = this.scene.getMeshByName("__root__");
        if (environmentMesh) {
            environmentMesh.scaling = new Vector3(1.5, 1.5, 1.5);
            environmentMesh.position = new Vector3(0, 0, 0);
        }

        const playerStart = MazeGenerator.spawnZones.playerStart;
        console.log("📍 Position de départ du joueur :", playerStart);
        this.player = new Player(this.scene, playerStart, "sinj.glb");
        await this.player.meshReady();

        // Vérifiez si le joueur spawn dans un mur
        if (MazeGenerator.isWallPosition(playerStart.x, playerStart.z)) {
            console.warn("🚨 Le joueur spawn dans un mur ! Déplacement vers une position dégagée...");
            const safePosition = MazeGenerator.getRandomEmptyPosition();
            this.player.getCapsule().position = safePosition;
            console.log("✅ Position corrigée :", safePosition);
        }

        console.log("📍 Nouveau player position:", this.player.getCapsulePosition()); // Debugging log
        this.player.getCapsule().visibility = 1; // Temporarily make the capsule visible for debugging

        this.setupFollowCamera();
        this.scene.onKeyboardObservable.clear(); // Ensure clean slate for keyboard events
        setupControls(this.player); // Reattach controls with proper speed

        for (const pos of MazeGenerator.spawnZones.collectibles) {
            const collectible = new Collectible(this.scene, pos, () => this.collectItem());
            this.collectibles.push(collectible);
        }

        this.spawnEnemies();
        this.pnj = new PNJ(this.scene, new Vector3(0, 1, 0));
        setupControls(this.player);

        this.dialogManager.startIntroMonologue(() => {
            this.missionManager.setMission("Trouver quelqu’un...");
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
    }

    protected setupFollowCamera() {
        this.followCamera = new FollowCamera("FollowCamera", new Vector3(0, 0, 0), this.scene);
        this.followCamera.lockedTarget = this.player.getCapsule();
        this.followCamera.radius = 20;
        this.followCamera.heightOffset = 8;
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

    private setupTopViewCamera() {
        this.topViewCamera = new FreeCamera("TopViewCamera", new Vector3(0, 50, 0), this.scene);
        this.topViewCamera.setTarget(new Vector3(0, 0, 0));
        this.topViewCamera.mode = FreeCamera.ORTHOGRAPHIC_CAMERA;
        this.topViewCamera.attachControl(this.canvas, true);
        this.topViewCamera.detachControl();
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
            this.topViewCamera.position = this.player.getCapsule().position.add(new Vector3(0, 50, 0));
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

    private updateScene() {
        this.scene.onBeforeRenderObservable.add(() => {
            this.updateGameStateAndHUD();
            this.collectibles.forEach(collectible => collectible.checkCollision(this.player.getCapsule()));
            this.projectiles.updateProjectiles();
            this.updateEnemies();
            const playerLight = this.scene.getLightByName("playerLight") as PointLight;
            if (playerLight) {
                playerLight.position = this.player.getCapsule().position.clone().add(new Vector3(0, 10, 0));
            }
        });
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

    private spawnEndZone() {
        this.endPoint = MeshBuilder.CreateDisc("endZone", { radius: 5 }, this.scene);
        const playerStart = MazeGenerator.spawnZones.playerStart.clone();
        this.endPoint.position = new Vector3(playerStart.x, 0.1, playerStart.z);
        const mat = new StandardMaterial("endZoneMat", this.scene);
        mat.diffuseColor = new Color3(0, 1, 0);
        this.endPoint.material = mat;
        this.endPoint.isPickable = true;

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
            endZoneHint.style.display = dist < 5 ? "block" : "none";
        });

        window.addEventListener("keydown", (event) => {
            if (event.key.toLowerCase() === "e") {
                const dist = Vector3.Distance(this.player.getCapsule().position, this.endPoint.position);
                if (dist < 5) {
                    console.log("🎉 Niveau terminé !");
                    endZoneHint.style.display = "none";
                    this.loadLevel2();
                }
            }
        });
    }

    private updateGameStateAndHUD() {
        const playerPosition = this.player.getCapsulePosition();

        if (!this.dialogManager.hasSeenIntro()) {
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

        if (!this.endPoint) {
            this.spawnEndZone();
        }

        const distToEnd = Vector3.Distance(playerPosition, this.endPoint.position);
        this.hud.updateMission("Aller à la zone de fin");
        this.hud.updateDistance(distToEnd, "Zone de fin");
        this.hud.showDistance();
        this.hud.hideCounter();
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
                enemy.shootAtPlayer(this.scene, this.player);
            }
        }
    }

    private spawnEnemies() {
        const minDistanceBetweenEnemies = 10; // Ajusté pour la taille réduite
        const maxEnemiesPerZone = 4; // Augmenté pour équilibrer avec 5 collectibles

        for (const collectiblePos of MazeGenerator.spawnZones.collectibles) {
            let spawned = 0;
            const angleStep = (2 * Math.PI) / maxEnemiesPerZone;

            const spawnRadius = 8; // Rayon autour du collectible pour le spawn aléatoire
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

    private loadLevel2() {
        console.log("🔄 Chargement du niveau 2...");

        SceneUtils.clearScene(this.scene); // 🔥 Nettoie la scène Babylon.js

        import("./Level2").then(({ Level2 }) => {
            new Level2(this.scene, this.canvas);
        }).catch((error) => {
            console.error("❌ Erreur lors du chargement du niveau 2 :", error);
        });
    }

    private endLevel() {
        console.log("🏆 Félicitations, vous avez terminé le niveau !");
    }
}
