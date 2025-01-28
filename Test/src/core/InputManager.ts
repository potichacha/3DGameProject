import { Vector3, Scene, Mesh } from "babylonjs";

export class InputManager {
    private player: Mesh;

    constructor(scene: Scene, player: Mesh) {
        this.player = player;
        this.init(scene);
    }

    private init(scene: Scene) {
        window.addEventListener("keydown", (event) => {
            const step = 0.5;
            switch (event.key) {
                case "ArrowUp":
                    this.player.position.z -= step;
                    break;
                case "ArrowDown":
                    this.player.position.z += step;
                    break;
                case "ArrowLeft":
                    this.player.position.x -= step;
                    break;
                case "ArrowRight":
                    this.player.position.x += step;
                    break;
            }
        });
    }
}
