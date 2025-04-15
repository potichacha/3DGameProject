import { Scene, Vector3, MeshBuilder, StandardMaterial, FollowCamera, HemisphericLight, FreeCamera, KeyboardEventTypes, Ray, Color3, Mesh, Texture } from "@babylonjs/core";
import { PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core";
import { Player } from "../components/Player";
import { setupControls } from "../core/InputManager";
import { MazeGenerator, isWallPosition } from "../procedural/MazeGenerator";
import { Collectible } from "../components/Collectible";
import { HUD } from "../components/HUD";
import { Enemy } from "../components/Enemy";
import { Music } from "../music/music";
import { PNJ } from "../components/PNJ";
import { DialogManager } from "../Dialog/DialogManager";
import { MissionManager } from "../core/MissionManager";

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
    private missionManager!: MissionManager;
    private dialogManager!: DialogManager;
    private pnj!: PNJ;
    private endPoint!: Mesh;

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

        // Création du PNJ à partir de sa propre classe
        this.pnj = new PNJ(this.scene, new Vector3(0, 0, 0));

        setupControls(this.player);

        this.dialogManager.initIntroDialog(this.scene, this.pnj, this.hud, () => {
            this.missionManager.setMission("Talk to the PNJ");
            this.pnj.enableInteraction(() => this.completeTalkToPNJMission());
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

    private updateScene() {
        this.scene.onBeforeRenderObservable.add(() => {
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

    private completeTalkToPNJMission() {
        console.log("✅ Mission 'Talk to the PNJ' terminée !");
        console.log("La méthode completeTalkToPNJMission a été appelée.");
        this.missionManager.clearMission();

        this.dialogManager.startPNJDialog([
            "Bonjour, étranger. Vous êtes perdu ?",
            "Collectez les objets pour sortir.",
            "Bonne chance !"
        ]);
    }

    private spawnEnemies() {
        const minDistanceBetweenEnemies = 2;

        for (const collectiblePos of MazeGenerator.spawnZones.collectibles) {
            let spawnedInArea = 0;

            while (spawnedInArea < 3) {
                const offsetX = Math.random() * 4 - 2;
                const offsetZ = Math.random() * 4 - 2;
                const spawnPosition = new Vector3(collectiblePos.x + offsetX, 6.2, collectiblePos.z + offsetZ);

                const isTooCloseToOtherEnemies = this.enemies.some((enemy) => {
                    const enemyMesh = enemy.getMesh();
                    if (!enemyMesh) return false;
                    const distance = Vector3.Distance(enemyMesh.position, spawnPosition);
                    return distance < minDistanceBetweenEnemies;
                });

                if (!isTooCloseToOtherEnemies) {
                    const enemy = new Enemy(this.scene, spawnPosition, 100);
                    this.enemies.push(enemy);
                    spawnedInArea++;
                }
            }
        }
    }

    private updateEnemies() {
        const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;

        this.enemies.forEach((enemy) => {
            const enemyMesh = enemy.getMesh();
            if (!enemyMesh) return;
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
                const enemyMesh = enemy.getMesh();
                if (!enemyMesh) return false;
                if (enemyMesh.intersectsMesh(projectile, false)) {
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

    private spawnEndZone() {
        this.endPoint = MeshBuilder.CreateDisc("endZone", { radius: 5 }, this.scene);
        this.endPoint.position = new Vector3(0, 0.1, 0);

        const material = new StandardMaterial("endZoneMat", this.scene);
        material.diffuseColor = new Color3(0, 1, 0);
        this.endPoint.material = material;

        this.endPoint.isPickable = true;

        if (this.scene.activeCamera) {
            const activeCamera = this.scene.activeCamera as FollowCamera;
            activeCamera.setTarget(this.endPoint.position);
        }

        this.scene.onBeforeRenderObservable.add(() => {
            const distanceToEndZone = Vector3.Distance(this.player.getCapsule().position, this.endPoint.position);
            this.hud.updateDistance(Math.round(distanceToEndZone));
        });

        window.addEventListener("keydown", (event) => {
            if (event.key.toLowerCase() === "e") {
                const distanceToEndZone = Vector3.Distance(this.player.getCapsule().position, this.endPoint.position);
                if (distanceToEndZone < 5) {
                    console.log("🎉 Niveau terminé !");
                    this.endLevel();
                }
            }
        });
    }

    private endLevel() {
        console.log("🏆 Félicitations, vous avez terminé le niveau !");
    }
}