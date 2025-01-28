import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3 } from "babylonjs";

export class GameEngine {
    private engine: Engine;
    private scene: Scene;

    constructor(private canvas: HTMLCanvasElement) {
        this.engine = new Engine(canvas, true);
        this.scene = new Scene(this.engine);

        // Initialisation de la scène par défaut
        this.init();
    }

    private init() {
        // Ajouter une caméra simple
        const camera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 10, Vector3.Zero(), this.scene);
        camera.attachControl(this.canvas, true);

        // Ajouter une lumière simple
        new HemisphericLight("Light", new Vector3(0, 1, 0), this.scene);

        // Lancer la boucle de rendu
        this.engine.runRenderLoop(() => this.scene.render());
    }

    public getScene(): Scene {
        return this.scene;
    }
}
