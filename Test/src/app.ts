import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight,Texture, Color3,Mesh, MeshBuilder,StandardMaterial } from "@babylonjs/core";

class App {
    constructor() {
        // create the canvas html element and attach it to the webpage
        var canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);

        // initialize babylon scene and engine
        var engine = new Engine(canvas, true);
        var scene = new Scene(engine);

        const ground = MeshBuilder.CreateGround("ground", { width: 1000, height: 1000 });
        const groundMaterial = new StandardMaterial("groundMaterial", scene);
        groundMaterial.diffuseTexture = new Texture("textures/grass.jpg", scene);
        groundMaterial.specularColor = new Color3(3, 0.6, 1.1);
        groundMaterial.diffuseColor = new Color3(3.5, 1.5, 0.5);
        ground.material = groundMaterial;

        var camera: ArcRotateCamera = new ArcRotateCamera("Camera", 11,1.2, 200, Vector3.Zero(), scene);
        camera.attachControl(canvas, true);
        var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(0, 1, 1), scene);
        var sphere: Mesh = MeshBuilder.CreateSphere("sphere", { diameter: 10 }, scene);
        sphere.position.y = 5;

        // hide/show the Inspector
        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
                if (scene.debugLayer.isVisible()) {
                    scene.debugLayer.hide();
                } else {
                    scene.debugLayer.show();
                }
            }
        });

        // run the main render loop
        engine.runRenderLoop(() => {
            scene.render();
        });
    }
}
new App();