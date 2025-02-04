import { Scene, Vector3, MeshBuilder } from "@babylonjs/core";
import { PhysicsAggregate, PhysicsShapeType, PhysicsMotionType } from "@babylonjs/core";

export class Player {
    private scene: Scene;
    private playerMesh: any;
    private physics!: PhysicsAggregate;

    constructor(scene: Scene, startPosition: Vector3) {
        this.scene = scene;
        this.createPlayer(startPosition);
    }

    private createPlayer(startPosition: Vector3) {
        this.playerMesh = MeshBuilder.CreateSphere("player", { diameter: 1.5 }, this.scene);
        this.playerMesh.position = startPosition;

        this.physics = new PhysicsAggregate(this.playerMesh, PhysicsShapeType.SPHERE, { mass: 1 }, this.scene);
        this.physics.body.setMotionType(PhysicsMotionType.DYNAMIC);
    }

    getMesh() {
        return this.playerMesh;
    }

    getPhysics() {
        return this.physics;
    }
}