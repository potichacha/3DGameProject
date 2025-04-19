import { Scene, Vector3,FollowCamera } from "@babylonjs/core";
import { Player } from "../components/Player";
export abstract class Level {
    protected followCamera!: FollowCamera;
    protected player!: Player;
    protected scene: Scene;
    protected canvas: HTMLCanvasElement;

    constructor(scene: Scene, canvas: HTMLCanvasElement) {
        this.scene = scene;
        this.canvas = canvas;
    }
    
    protected setupFollowCamera() {
        this.followCamera = new FollowCamera("FollowCamera", new Vector3(0, 0, 0), this.scene);
        this.followCamera.lockedTarget = this.player.getCapsule();
        this.followCamera.radius = 20; // Rapproche légèrement la caméra
        this.followCamera.heightOffset = 8; // Ajuste la hauteur
        this.followCamera.rotationOffset = 0;
        this.followCamera.cameraAcceleration = 0.5;
        this.followCamera.maxCameraSpeed = 10;
        this.followCamera.inputs.clear();
        this.scene.activeCamera = this.followCamera;
    }
}