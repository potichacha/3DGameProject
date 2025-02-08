import { Scene, Vector3, MeshBuilder, StandardMaterial, FollowCamera, HemisphericLight, FreeCamera, KeyboardEventTypes, Ray, Color3 } from "@babylonjs/core";
import { PhysicsAggregate, PhysicsShapeType, PhysicsMotionType } from "@babylonjs/core";
import { Player } from "../components/Player";
import { setupControls } from "../core/InputManager";
import { MazeGenerator, isWallPosition } from "../procedural/MazeGenerator";
import { Collectible } from "../components/Collectible";
import { HUD } from "../components/HUD";
import { Enemy } from "../components/Enemy";

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

    constructor(scene: Scene, canvas: HTMLCanvasElement) {
        this.scene = scene;
        this.canvas = canvas;
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

        MazeGenerator.deploy(this.scene);

        this.player = new Player(this.scene, new Vector3(-20, 5, -10));
        console.log("🛠️ Joueur ajouté à la scène.");

        await this.player.meshReady();

        this.setupFollowCamera();
        this.setupFreeCamera();
        this.setupCameraSwitch();

        this.spawnCollectibles();
        this.spawnEnemies();
        setupControls(this.player.getPhysics());

        this.scene.onBeforeRenderObservable.add(() => {
            this.collectibles.forEach(collectible => collectible.checkCollision(this.player.getMesh()));
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
        //const ray = new Ray(playerPosition, cameraPosition.subtract(playerPosition).normalize());

        //console.log("pos camera",this.followCamera.position);
        //dconsole.log("pos player",this.player.getMesh().position);

        //Vérifier les intersections avec le rayon
        const hit = this.scene.pickWithRay(ray, (mesh) => {
            //On ne veut pas détecter la caméra ou le joueur comme intersection
            return mesh !== this.player.getMesh(); 
        });
    
        if (hit) {
            // S'il y a une collision, on fait quelque chose, par exemple ajuster la position de la caméra
            if (hit.pickedMesh) {
                console.log("Obstacle détecté : ", hit.pickedMesh.name);
                if(hit.pickedMesh.name === "wall"){
                    this.followCamera.radius = 12;
                }
                else{
                    this.followCamera.radius = 25;
                }
            }
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