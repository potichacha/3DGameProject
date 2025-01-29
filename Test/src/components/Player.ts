import { Scene, MeshBuilder, StandardMaterial, Vector3, PhysicsAggregate, PhysicsShapeType, Mesh } from "@babylonjs/core";

export class Player {
    private mesh: Mesh;

    constructor(scene: Scene, position: Vector3) {
        this.mesh = MeshBuilder.CreateBox("player", { size: 1 }, scene);
        this.mesh.position = position;

        const playerMaterial = new StandardMaterial("playerMaterial", scene);
        this.mesh.material = playerMaterial;

        // Ajouter la physique au joueur
        const physicsAggregate = new PhysicsAggregate(this.mesh, PhysicsShapeType.BOX, { mass: 1 }, scene);

        // Définir le type de mouvement dynamique après la création
        physicsAggregate.body.setMotionType(1); // 1 = DYNAMIC (équivalent à PhysicsMotionType.DYNAMIC)
    }

    getMesh(): Mesh {
        return this.mesh;
    }
}
