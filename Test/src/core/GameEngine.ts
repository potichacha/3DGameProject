import { ArcRotateCamera, Engine, Scene, Vector3 } from "@babylonjs/core";
// @ts-ignore
import HavokPhysics from "https://cdn.babylonjs.com/havok/HavokPhysics_es.js";
import { HavokPlugin } from "@babylonjs/core/Physics/v2";

export class GameEngine {
    private engine: Engine;
    private scene: Scene;

    constructor(canvas: HTMLCanvasElement, onReady: (scene: Scene) => void) {
        this.engine = new Engine(canvas, true);
        this.scene = new Scene(this.engine);

        // 📷 Ajout d'une caméra
        const camera = new ArcRotateCamera("camera", Math.PI / 2, Math.PI / 4, 10, Vector3.Zero(), this.scene);
        camera.attachControl(canvas, true);

        this.initPhysics().then(() => {
            console.log("✅ Physique activée !");
            onReady(this.scene);
        });

        this.engine.runRenderLoop(() => {
            //console.log("🔄 Frame rendue");
            this.scene.render();
        });

        window.addEventListener("resize", () => this.engine.resize());
    }

    private async initPhysics() {
        console.log("⏳ Chargement de Havok...");
        const havok = await HavokPhysics(); // Chargement du moteur physique Havok
        const physicsPlugin = new HavokPlugin(true, havok);
        this.scene.enablePhysics(new Vector3(0, -9.81, 0), physicsPlugin);
        console.log("✅ Havok chargé avec succès !");
    }

    getScene(): Scene {
        return this.scene;
    }

    private handleEnemyMesh(enemyMesh: any) {
        if (!enemyMesh) {
            console.error("❌ enemyMesh is null. Cannot proceed with the operation.");
            return;
        }
        // Add operations on enemyMesh here
    }
}
