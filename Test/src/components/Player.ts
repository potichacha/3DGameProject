import { Scene, Vector3, MeshBuilder, SceneLoader } from "@babylonjs/core";
import { PhysicsAggregate, PhysicsShapeType, PhysicsMotionType } from "@babylonjs/core";
import "@babylonjs/loaders/glTF";

export class Player {
    private scene: Scene;
    private playerMesh: any;
    private physics!: PhysicsAggregate;

    constructor(scene: Scene, startPosition: Vector3) {
        this.scene = scene;
        this.createPlayer(startPosition);
        //this.CreateMesh(startPosition);
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

    CreateMesh(startPosition: Vector3) {
        SceneLoader.ImportMeshAsync("", "./src/assets/models/", "finaleSinj.glb", this.scene).then((result) => {
            this.playerMesh = result.meshes[0];
            this.playerMesh.position = startPosition;

            this.physics = new PhysicsAggregate(this.playerMesh, PhysicsShapeType.CAPSULE, { mass: 1 }, this.scene);
            this.physics.body.setMotionType(PhysicsMotionType.DYNAMIC);

            console.log(this.playerMesh); // Déplacer ici pour s'assurer que le maillage est chargé
        }).catch((error) => {
            console.error("Erreur lors du chargement du maillage du joueur:", error);
        });
    }

    meshReady(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.playerMesh) {
                resolve();
            } else {
                SceneLoader.ImportMeshAsync("", "./src/assets/models/", "finaleSinj.glb", this.scene).then((result) => {
                    this.playerMesh = result.meshes[0];
                    resolve();
                }).catch((error) => {
                    reject(error);
                });
            }
        });
    }
}