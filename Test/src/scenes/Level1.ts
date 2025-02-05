import { Scene, Vector3, MeshBuilder, StandardMaterial, FollowCamera, HemisphericLight } from "@babylonjs/core";
import { PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core";
import { Player } from "../components/Player";
import { setupControls } from "../core/InputManager";
import { MazeGenerator } from "../procedural/MazeGenerator"; // 📌 Import du générateur de labyrinthe

export class Level1 {
    private scene: Scene;
    private player!: Player;
    private camera!: FollowCamera;

    constructor(scene: Scene) {
        this.scene = scene;
        this.init();
    }

    private init() {
        console.log("🔨 Création du niveau 1...");

        // ✅ Ajouter une lumière
        new HemisphericLight("light1", new Vector3(0, 1, 0), this.scene);

        // ✅ Créer le sol (même taille que le labyrinthe)
        const groundSize = 20;
        const ground = MeshBuilder.CreateGround("ground", { width: groundSize, height: groundSize }, this.scene);
        const groundMaterial = new StandardMaterial("groundMaterial", this.scene);
        ground.material = groundMaterial;

        // ✅ Ajouter la physique au sol
        new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0 }, this.scene);

        // ✅ Générer le labyrinthe
        MazeGenerator.generate(this.scene);

        // ✅ Ajouter le joueur et le placer dans une zone dégagée
        this.player = new Player(this.scene, new Vector3(-8, 1, -8));

        // ✅ Ajouter la caméra qui suit le joueur
        this.camera = new FollowCamera("FollowCamera", new Vector3(0, 5, -10), this.scene);
        this.camera.lockedTarget = this.player.getMesh();
        this.camera.radius = 8;
        this.camera.heightOffset = 3;
        this.camera.cameraAcceleration = 0.1;
        this.camera.maxCameraSpeed = 10;
        this.scene.activeCamera = this.camera;

        // ✅ Gérer les inputs
        setupControls(this.player.getPhysics());

        // ✅ Mise à jour de la caméra pour qu'elle reste derrière la sphère
        this.scene.onBeforeRenderObservable.add(() => {
            const playerPos = this.player.getMesh().position;
            const playerRotation = this.player.getMesh().rotation.y;

            const offsetX = Math.sin(playerRotation) * -this.camera.radius;
            const offsetZ = Math.cos(playerRotation) * -this.camera.radius;

            this.camera.position = new Vector3(
                playerPos.x + offsetX,
                playerPos.y + this.camera.heightOffset,
                playerPos.z + offsetZ
            );

            this.camera.rotationOffset = -playerRotation * (180 / Math.PI);
        });

        console.log("✅ Niveau 1 prêt !");
    }
}