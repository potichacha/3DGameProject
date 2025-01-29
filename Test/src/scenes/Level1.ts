import { Scene, MeshBuilder, StandardMaterial, Texture, Vector3, PhysicsAggregate, PhysicsShapeType, ArcRotateCamera } from "@babylonjs/core";
import { MazeGenerator } from "../procedural/MazeGenerator";
import { InputManager } from "../core/InputManager";
import { Player } from "../components/Player";

export class Level1 {
    private scene: Scene;
    private player!: Player;

    constructor(scene: Scene) {
        this.scene = scene;
        this.init();
    }

    private init() {
        // **Créer une caméra**
        const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 3, 10, new Vector3(0, 1, 0), this.scene);
        camera.attachControl(true);
        this.scene.activeCamera = camera;

        // **Créer le sol du labyrinthe**
        const ground = MeshBuilder.CreateGround("ground", { width: 20, height: 20 }, this.scene);
        const groundMaterial = new StandardMaterial("groundMaterial", this.scene);
        groundMaterial.diffuseTexture = new Texture("/assets/textures/ground/labyrinth.jpg", this.scene);
        ground.material = groundMaterial;

        // Ajouter la physique au sol
        new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0 }, this.scene);

        // **Générer le labyrinthe**
        MazeGenerator.generate(this.scene);

        // **Créer le joueur**
        this.player = new Player(this.scene, new Vector3(0, 1, 0));

        // **Gérer les inputs**
        new InputManager(this.scene, this.player.getMesh());
    }
}
