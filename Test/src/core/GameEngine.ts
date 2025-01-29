import { Scene, Engine, Vector3 } from "@babylonjs/core";
import HavokPhysics from "@babylonjs/havok";

export class GameEngine {
    private scene: Scene;
    private engine: Engine;
    private havok: any;

    constructor(canvas: HTMLCanvasElement, callback: (scene: Scene) => void) {
        this.engine = new Engine(canvas, true);
        this.scene = new Scene(this.engine);

        this.initPhysics().then(() => {
            console.log("✅ Havok chargé avec succès.");
            callback(this.scene); // Démarre le jeu après l'initialisation
            this.engine.runRenderLoop(() => {
                this.scene.render();
            });
        }).catch((error) => {
            console.error("❌ Erreur lors du chargement de Havok :", error);
        });

        window.addEventListener("resize", () => {
            this.engine.resize();
        });
    }

    async initPhysics() {
        console.log("⏳ Chargement de Havok...");
        this.havok = await HavokPhysics(); // Pas besoin de wasmUrl
        this.scene.enablePhysics(new Vector3(0, -9.81, 0), new this.havok.PhysicsPlugin());
    }

    getScene(): Scene {
        return this.scene;
    }
}
