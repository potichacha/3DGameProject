import { Scene, Vector3, MeshBuilder, StandardMaterial, FollowCamera, HemisphericLight, FreeCamera, KeyboardEventTypes } from "@babylonjs/core";
import { PhysicsAggregate, PhysicsShapeType, PhysicsMotionType } from "@babylonjs/core";
import { Player } from "../components/Player";
import { setupControls } from "../core/InputManager";
import { MazeGenerator, isWallPosition } from "../procedural/MazeGenerator";
import { Collectible } from "../components/Collectible";
import { HUD } from "../components/HUD";
import { Enemy } from "../components/Enemy";

export class Level1 {
    private scene: Scene;
    private player!: Player;
    private followCamera!: FollowCamera;
    private freeCamera!: FreeCamera;
    private isFreeCamera: boolean = false; // 📌 Indique si la caméra libre est active
    private collectibles: Collectible[] = [];
    private enemies: Enemy[] = [];
    private hud: HUD;
    private collectedCount: number = 0;
    private totalCollectibles: number = 3;

    constructor(scene: Scene) {
        this.scene = scene;
        this.hud = new HUD();
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
        ground.material = groundMaterial;

        const groundPhysics = new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0 }, this.scene);
        console.log("✅ Physique du sol appliquée :", groundPhysics);

        MazeGenerator.generate(this.scene);

        this.player = new Player(this.scene, new Vector3(-20, 5, -20));
        console.log("🛠️ Joueur ajouté à la scène.");

        await this.player.meshReady();

        const playerPhysics = this.player.getPhysics();
        if (!playerPhysics) {
            console.error("❌ Physique du joueur non appliquée !");
        } else {
            console.log("✅ Physique du joueur appliquée :", playerPhysics);
            playerPhysics.body.setMotionType(PhysicsMotionType.DYNAMIC);
            playerPhysics.body.setLinearDamping(0.9);
            playerPhysics.body.setAngularDamping(1);
            playerPhysics.body.setMassProperties({ mass: 5 });
        }

        setTimeout(() => {
            console.log("📍 Position après 3 secondes :", this.player.getMesh().position);
        }, 3000);

        // ✅ Création de la caméra de suivi
        this.followCamera = new FollowCamera("FollowCamera", new Vector3(0, 15, -30), this.scene);
        this.followCamera.lockedTarget = this.player.getMesh();
        this.followCamera.radius = 20;
        this.followCamera.heightOffset = 20; // Positionner la caméra plus haut
        this.followCamera.rotationOffset = 180;
        this.followCamera.cameraAcceleration = 0.05;
        this.followCamera.maxCameraSpeed = 10;

        // Positionner la caméra en diagonale derrière le joueur
        this.followCamera.position = new Vector3(this.player.getMesh().position.x - 10, this.player.getMesh().position.y + 10, this.player.getMesh().position.z - 10);

        (this.followCamera as any).checkCollisions = true;
        (this.followCamera as any).ellipsoid = new Vector3(1, 1, 1);
        this.followCamera.minZ = 2;

        // ✅ Création de la caméra libre (désactivée par défaut)
        this.freeCamera = new FreeCamera("FreeCamera", new Vector3(0, 10, 0), this.scene);
        this.freeCamera.attachControl();
        this.freeCamera.speed = 5;
        this.freeCamera.detachControl(); // On la désactive au début

        // Définir la caméra active sur la FollowCamera au départ
        this.scene.activeCamera = this.followCamera;

        // ✅ Gestion du basculement entre caméras avec la touche "C"
        this.scene.onKeyboardObservable.add((kbInfo) => {
            if (kbInfo.type === KeyboardEventTypes.KEYDOWN && kbInfo.event.key.toLowerCase() === "c") {
                this.toggleFreeCamera();
            }
        });

        this.spawnCollectibles();
        this.spawnEnemies();
        setupControls(this.player.getPhysics());

        this.scene.onBeforeRenderObservable.add(() => {
            this.collectibles.forEach(collectible => collectible.checkCollision(this.player.getMesh()));
        });

        console.log("✅ Niveau 1 prêt !");
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
        while (spawned < this.totalCollectibles) {
            const pos = this.getValidPosition();
            const collectible = new Collectible(this.scene, pos, () => this.collectItem());
            this.collectibles.push(collectible);
            spawned++;
        }
        console.log(`✨ ${this.collectibles.length} collectibles placés.`);
    }

    private spawnEnemies() {
        const enemyPositions = 3;
        let spawned = 0;

        while (spawned < enemyPositions) {
            const pos = this.getValidPosition();
            const enemy = new Enemy(this.scene, pos);
            this.enemies.push(enemy);
            spawned++;
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

    private collectItem() {
        if (this.collectedCount < this.totalCollectibles) {
            this.collectedCount = Math.min(this.collectedCount + 1, this.totalCollectibles);
            console.log(`✅ Collectible ramassé ! ${this.collectedCount}/${this.totalCollectibles}`);
            this.hud.update(this.collectedCount, this.totalCollectibles);
        }
    }
}
