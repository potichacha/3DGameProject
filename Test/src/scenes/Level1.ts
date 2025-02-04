import { Scene, Vector3, MeshBuilder, StandardMaterial, FollowCamera, HemisphericLight } from "@babylonjs/core";
import { PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core";
import { Player } from "../components/Player";
import { setupControls } from "../core/InputManager";

export class Level1 {
    private scene: Scene;
    private player!: Player;

    constructor(scene: Scene) {
        this.scene = scene;
        this.init();
    }

    private init() {
        console.log("🔨 Création du niveau 1...");

        // ✅ Ajouter une lumière
        new HemisphericLight("light1", new Vector3(0, 1, 0), this.scene);

        // ✅ Créer le sol
        const ground = MeshBuilder.CreateGround("ground", { width: 20, height: 20 }, this.scene);
        const groundMaterial = new StandardMaterial("groundMaterial", this.scene);
        ground.material = groundMaterial;

            // ✅ Ajouter la physique au sol
            new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0 }, this.scene);

        // ✅ Ajouter le joueur
        this.player = new Player(this.scene, new Vector3(0, 1, 0));

        // ✅ Ajouter la caméra qui suit le joueur
        const camera = new FollowCamera("FollowCamera", new Vector3(0, 5, -10), this.scene);
        camera.lockedTarget = this.player.getMesh(); // La caméra suit le joueur
        this.scene.activeCamera = camera;

        // ✅ Gérer les inputs
        setupControls(this.player.getPhysics());
    }
}