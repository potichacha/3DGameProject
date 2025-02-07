import { Scene, Vector3, SceneLoader, Quaternion, MeshBuilder, Mesh } from "@babylonjs/core";
import { PhysicsAggregate, PhysicsShapeType, PhysicsMotionType } from "@babylonjs/core";
import "@babylonjs/loaders/glTF";

export class Player {
    private scene: Scene;
    private playerMesh!: Mesh;
    private physicsCapsule!: Mesh;
    private physics!: PhysicsAggregate;
    private meshLoaded: boolean = false;

    constructor(scene: Scene, startPosition: Vector3) {
        this.scene = scene;
        this.createMesh(startPosition);
    }

    getMesh() {
        return this.playerMesh;
    }

    getPhysics() {
        return this.physics;
    }

    private createMesh(startPosition: Vector3) {
        SceneLoader.ImportMeshAsync("", "./src/assets/models/", "finaleSinj.glb", this.scene).then((result) => {
            console.log("🔍 Meshes importés :", result.meshes);

            if (result.meshes.length === 0) {
                console.error("❌ Aucun mesh chargé !");
                return;
            }

            this.playerMesh = result.meshes.find(mesh => mesh.name.toLowerCase().includes("corps")) as Mesh || result.meshes[1] as Mesh;

            if (!this.playerMesh) {
                console.error("❌ Erreur : Aucun mesh valide trouvé pour le joueur !");
                return;
            }

            console.log("🛠 Mesh sélectionné :", this.playerMesh.name);

            this.playerMesh.scaling = new Vector3(2, 2, 2);
            this.playerMesh.rotationQuaternion = Quaternion.FromEulerAngles(0, Math.PI, 0);

            // 📌 Récupérer la hauteur max du mesh pour bien ajuster la capsule
            let children = this.playerMesh.getChildren();
            let maxHeight = 0;
            let maxWidth = 0;
            for (let i = 0; i < children.length; i++) {
                let child = children[i];
                let childBBInfo = (child as Mesh).getBoundingInfo();
                let childHeight = childBBInfo.boundingBox.extendSize.y * 2;
                let childWidth = childBBInfo.boundingBox.extendSize.x * 2;
                maxHeight = Math.max(maxHeight, childHeight);
                maxWidth = Math.max(maxWidth, childWidth);
            }

            console.log("📏 Taille estimée du joueur : hauteur =", maxHeight, ", largeur =", maxWidth);

            // ✅ Création de la capsule physique
            this.physicsCapsule = MeshBuilder.CreateCapsule("playerCapsule", {
                height: maxHeight,
                radius: maxWidth / 2
            }, this.scene);
            this.physicsCapsule.visibility = 0.2;
            this.physicsCapsule.position = new Vector3(startPosition.x, startPosition.y, startPosition.z);
            this.physicsCapsule.rotationQuaternion = Quaternion.Identity();

            // ✅ Ajout de la physique à la capsule
            this.physics = new PhysicsAggregate(this.physicsCapsule, PhysicsShapeType.CAPSULE, {
                mass: 5,
                restitution: 0,
                friction: 0.8
            }, this.scene);
            this.physics.body.setMotionType(PhysicsMotionType.DYNAMIC);

            // ✅ Bloquer les rotations sur X et Z pour que le joueur reste droit
            this.physics.body.setMassProperties({
                inertia: new Vector3(0, 1, 0), // Supprime l'inertie pour éviter les inclinaisons
            });

            // ✅ Autoriser seulement la rotation sur Y (pour tourner normalement)
            this.physics.body.setAngularVelocity(new Vector3(0, 1, 0));

            // ✅ Lier le mesh du joueur à la capsule physique
            this.playerMesh.position = new Vector3(0, -maxHeight / 2, 0);
            this.playerMesh.parent = this.physicsCapsule;

            console.log("✅ Joueur chargé et physique appliquée !");
            this.meshLoaded = true;

        }).catch((error) => {
            console.error("❌ Erreur lors du chargement du maillage du joueur:", error);
        });
    }

    meshReady(): Promise<void> {
        return new Promise((resolve) => {
            if (this.meshLoaded) {
                resolve();
            } else {
                const interval = setInterval(() => {
                    if (this.meshLoaded) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 100);
            }
        });
    }
}
