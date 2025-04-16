import { Scene, Vector3, MeshBuilder, StandardMaterial, Color3 } from "@babylonjs/core";

export class Level2 {
    private scene: Scene;
    private canvas: HTMLCanvasElement;

    constructor(scene: Scene, canvas: HTMLCanvasElement) {
        this.scene = scene;
        this.canvas = canvas;
        this.init();
    }

    private init() {
        console.log("🔨 Création du niveau 2...");

        // Exemple de configuration pour le niveau 2
        const ground = MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, this.scene);
        const groundMaterial = new StandardMaterial("groundMaterial", this.scene);
        groundMaterial.diffuseColor = new Color3(0.5, 0.5, 0.5);
        ground.material = groundMaterial;

        const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 2 }, this.scene);
        sphere.position = new Vector3(0, 1, 0);

        console.log("✅ Niveau 2 prêt !");
    }
}
