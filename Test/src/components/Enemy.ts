import { Scene, Vector3, MeshBuilder, StandardMaterial, Color3 } from "@babylonjs/core";
import { PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core";

export class Enemy {
    private scene: Scene;
    private mesh: any;

    constructor(scene: Scene, position: Vector3) {
        this.scene = scene;

        // 📌 Création de l'ennemi (sphère rouge)
        this.mesh = MeshBuilder.CreateSphere("enemy", { diameter: 2 }, this.scene);
        this.mesh.position = position;

        // 📌 Matériau rouge pour l'ennemi
        const material = new StandardMaterial("enemyMat", this.scene);
        material.diffuseColor = Color3.Red();
        this.mesh.material = material;

        // 📌 Ajouter la physique (immobile pour l'instant)
        new PhysicsAggregate(this.mesh, PhysicsShapeType.SPHERE, { mass: 0 }, this.scene);
    }

    getMesh() {
        return this.mesh;
    }
}