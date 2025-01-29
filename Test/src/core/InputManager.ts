import { Mesh, Scene, Vector3, FollowCamera, Scalar, PhysicsBody } from "@babylonjs/core";

export class InputManager {
    private player: Mesh;
    private scene: Scene;
    private physicsBody: PhysicsBody;

    constructor(scene: Scene, player: Mesh) {
        this.scene = scene;
        this.player = player;
        this.physicsBody = player.physicsBody as PhysicsBody;

        this.init();
    }

    private init() {
        window.addEventListener("keydown", (event) => this.handleKeyDown(event));
        window.addEventListener("keyup", (event) => this.handleKeyUp(event));
        this.scene.onBeforeRenderObservable.add(() => this.update());
    }

    private inputStates: { [key: string]: boolean } = {};

    private handleKeyDown(event: KeyboardEvent) {
        this.inputStates[event.key.toLowerCase()] = true;
    }

    private handleKeyUp(event: KeyboardEvent) {
        this.inputStates[event.key.toLowerCase()] = false;
    }

    private update() {
        const force = 5;
        const rotationSpeed = 0.05;
        let movement = new Vector3(0, 0, 0);

        let forward = new Vector3(Math.sin(this.player.rotation.y), 0, Math.cos(this.player.rotation.y));

        // Déplacement avant/arrière
        if (this.inputStates["z"] || this.inputStates["arrowup"]) {
            movement.addInPlace(forward.scale(force));
        }
        if (this.inputStates["s"] || this.inputStates["arrowdown"]) {
            movement.addInPlace(forward.scale(-force));
        }

        // Rotation du joueur
        if (this.inputStates["q"] || this.inputStates["arrowleft"]) {
            this.player.rotation.y += rotationSpeed;
        }
        if (this.inputStates["d"] || this.inputStates["arrowright"]) {
            this.player.rotation.y -= rotationSpeed;
        }

        if (!movement.equals(Vector3.Zero())) {
            this.physicsBody.applyImpulse(movement, this.player.getAbsolutePosition());
        }
    }
}
