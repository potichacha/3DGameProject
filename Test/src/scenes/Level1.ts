import { Scene, Vector3, MeshBuilder, StandardMaterial, FollowCamera, HemisphericLight } from "@babylonjs/core";
import { PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core";
import { Player } from "../components/Player";
import { setupControls } from "../core/InputManager";
import { MazeGenerator } from "../procedural/MazeGenerator";
import { Collectible } from "../components/Collectible";
import { HUD } from "../components/HUD";

export class Level1 {
    private scene: Scene;
    private player!: Player;
    private camera!: FollowCamera;
    private collectibles: Collectible[] = [];
    private hud: HUD;
    private collectedCount: number = 0;
    private totalCollectibles: number = 3;

    constructor(scene: Scene) {
        this.scene = scene;
        this.hud = new HUD();
        this.init();
    }

    private init() {
        console.log("🔨 Création du niveau 1...");

        // ✅ Ajouter une lumière
        new HemisphericLight("light1", new Vector3(0, 1, 0), this.scene);

        // ✅ Créer le sol
        const groundSize = 20;
        const ground = MeshBuilder.CreateGround("ground", { width: groundSize, height: groundSize }, this.scene);
        const groundMaterial = new StandardMaterial("groundMaterial", this.scene);
        ground.material = groundMaterial;

        // ✅ Ajouter la physique au sol
        new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0 }, this.scene);

        // ✅ Générer le labyrinthe
        MazeGenerator.generate(this.scene);

        // ✅ Ajouter le joueur
        this.player = new Player(this.scene, new Vector3(-8, 1, -8));

        // ✅ Ajouter la caméra qui suit le joueur
        // ✅ Création de la caméra 3ème personne améliorée
        this.camera = new FollowCamera("FollowCamera", new Vector3(0, 5, -10), this.scene);
        this.camera.lockedTarget = this.player.getMesh();
        this.camera.radius = 8;
        this.camera.heightOffset = 2.5;
        this.camera.rotationOffset = 180; // 📌 Garde toujours la caméra derrière le joueur
        this.camera.cameraAcceleration = 0.05; // 📌 Rends les mouvements plus fluides
        this.camera.maxCameraSpeed = 8;
        this.scene.activeCamera = this.camera;

        // 📌 Mise à jour de la caméra pour qu’elle suive bien la rotation du joueur
        this.scene.onBeforeRenderObservable.add(() => {
            const playerPos = this.player.getMesh().position;
            const playerRotation = this.player.getMesh().rotation.y;

            // Calcule la position idéale derrière le joueur
            const offsetX = Math.sin(playerRotation) * -this.camera.radius;
            const offsetZ = Math.cos(playerRotation) * -this.camera.radius;

            // Applique les nouvelles coordonnées
            this.camera.position = new Vector3(
                playerPos.x + offsetX,
                playerPos.y + this.camera.heightOffset,
                playerPos.z + offsetZ
            );

            // Ajuste la rotation de la caméra pour qu’elle suive la rotation du joueur
            this.camera.rotationOffset = -playerRotation * (180 / Math.PI);
        });
   

        // ✅ Ajouter les collectibles sur le sol
        this.spawnCollectibles();

        // ✅ Gérer les inputs
        setupControls(this.player.getPhysics());

        // ✅ Vérifier les collisions avec les collectibles
        this.scene.onBeforeRenderObservable.add(() => {
            this.collectibles.forEach(collectible => collectible.checkCollision(this.player.getMesh()));
        });

        console.log("✅ Niveau 1 prêt !");
    }

    private spawnCollectibles() {
        const positions = [
            new Vector3(-4, 1, -4),
            new Vector3(6, 1, -6),
            new Vector3(0, 1, 6)
        ];

        positions.forEach(pos => {
            const collectible = new Collectible(this.scene, pos, () => this.collectItem());
            this.collectibles.push(collectible);
        });
    }

    private collectItem() {
        if (this.collectedCount < this.totalCollectibles) {
            this.collectedCount = Math.min(this.collectedCount + 1, this.totalCollectibles);
            console.log(`Collectible ramassé ! ${this.collectedCount}/${this.totalCollectibles}`);
            this.hud.update(this.collectedCount, this.totalCollectibles);
        }
    }    
}