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

    private async init() {
        console.log("🔨 Création du niveau 1...");

        // ✅ Activer la gestion des collisions pour la scène
        this.scene.collisionsEnabled = true;

        // ✅ Ajouter une lumière
        new HemisphericLight("light1", new Vector3(0, 1, 0), this.scene);

        // ✅ Créer le sol (immense labyrinthe)
        const groundSize = 1000;
        const ground = MeshBuilder.CreateGround("ground", { width: groundSize, height: groundSize }, this.scene);
        ground.checkCollisions = true; // 📌 Empêche la caméra de passer sous le sol

        const groundMaterial = new StandardMaterial("groundMaterial", this.scene);
        ground.material = groundMaterial;

        // ✅ Ajouter la physique au sol
        new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0 }, this.scene);

        // ✅ Générer le labyrinthe (avec des murs très espacés et hauts)
        MazeGenerator.generate(this.scene);

        // ✅ Ajouter le joueur
        this.player = new Player(this.scene, new Vector3(-20, 1, -20));

        // Attendre que le maillage du joueur soit prêt
        await this.player.meshReady();

        // 📌 Caméra améliorée (3ème personne, évite les murs)
        this.camera = new FollowCamera("FollowCamera", new Vector3(0, 15, -30), this.scene);
        this.camera.lockedTarget = this.player.getMesh();
        this.camera.radius = 25; // 📌 Distance augmentée
        this.camera.heightOffset = 7; // 📌 Caméra plus haute
        this.camera.cameraAcceleration = 0.08;
        this.camera.maxCameraSpeed = 15;

        // 📌 Empêche la caméra de passer à travers les murs
        (this.camera as any).checkCollisions = true;
        (this.camera as any).ellipsoid = new Vector3(1, 1, 1); // 📌 Taille de collision de la caméra
        this.camera.minZ = 2;

        this.scene.activeCamera = this.camera;

        // 📌 Mise à jour de la caméra pour suivre la rotation du joueur
        this.scene.onBeforeRenderObservable.add(() => {
            const playerPos = this.player.getMesh().position;
            const playerRotation = this.player.getMesh().rotation.y;

            // Calcule la position idéale derrière le joueur
            const offsetX = Math.sin(playerRotation) * -this.camera.radius;
            const offsetZ = Math.cos(playerRotation) * -this.camera.radius;

            // Applique les nouvelles coordonnées de la caméra
            this.camera.position = new Vector3(
                playerPos.x + offsetX,
                playerPos.y + this.camera.heightOffset,
                playerPos.z + offsetZ
            );

            // Ajuste la rotation pour suivre le joueur
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
        // 📌 Positionnement des collectibles dans l'immense labyrinthe
        const positions = [
            new Vector3(-50, 1, -50),
            new Vector3(100, 1, -100),
            new Vector3(200, 1, 50)
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