import { Scene, Vector3, SceneLoader, Quaternion, MeshBuilder, Mesh, FollowCamera, Ray, StandardMaterial, Color3 } from "@babylonjs/core";
import { PhysicsAggregate, PhysicsShapeType, PhysicsMotionType, AnimationGroup } from "@babylonjs/core";
import "@babylonjs/loaders/glTF";

export class Player {
    private scene: Scene;
    private playerMesh!: Mesh;
    private physicsCapsule!: Mesh;
    private physics!: PhysicsAggregate;
    private animationGroup: AnimationGroup[] = [];
    private meshLoaded: boolean = false;
    private health: number = 100;

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

    getCapsule() {
        return this.physicsCapsule;
    }

    getAnimationGroups() {
        return this.animationGroup;
    }

    getHealth() {
        return this.health;
    }

    reduceHealth(amount: number) {
        this.health = Math.max(0, this.health - amount);
        console.log(`🛡️ Joueur touché ! Santé restante : ${this.health}`);

        const redIntensity = (100 - this.health) / 100;
        const material = this.playerMesh.material as StandardMaterial;
        if (material) {
            material.diffuseColor = new Color3(1, 1 - redIntensity, 1 - redIntensity);
        }
    }

    private createMesh(startPosition: Vector3) {
        SceneLoader.ImportMeshAsync("", "./src/assets/models/", "finaleSinj.glb", this.scene).then((result) => {
            console.log("🔍 Meshes importés :", result.meshes);
            this.animationGroup = result.animationGroups;
            console.log("🔍 Animations importées :", this.animationGroup);

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

            this.playerMesh.scaling = new Vector3(1.5, 1.5, 1.5);
            this.playerMesh.rotationQuaternion = Quaternion.FromEulerAngles(0, Math.PI, 0);

            this.physicsCapsule = MeshBuilder.CreateCapsule("playerCapsule", {
                height: 8,
                radius: 3.5,
            }, this.scene);
            this.physicsCapsule.visibility = 0;
            this.physicsCapsule.position = startPosition;
            this.physicsCapsule.rotationQuaternion = Quaternion.Identity();

            this.physics = new PhysicsAggregate(this.physicsCapsule, PhysicsShapeType.CAPSULE, {
                mass: 5,
                restitution: 0,
                friction: 0.8
            }, this.scene);
            this.physics.body.setMotionType(PhysicsMotionType.DYNAMIC);

            this.physics.body.setMassProperties({
                inertia: new Vector3(0, 1, 0),
            });

            this.physics.body.setAngularVelocity(new Vector3(0, 1, 0));

            this.playerMesh.position = new Vector3(0, -4, 0);
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

    public checkForObstacles(followCamera: FollowCamera, lastInvisibleWall: Mesh | null) {
        const cameraPosition = followCamera.position;
        const playerPosition = this.getCapsule().position;

        const direction = playerPosition.subtract(cameraPosition).normalize();
        const ray = new Ray(cameraPosition, direction, 25);

        const hit = this.scene.pickWithRay(ray, (mesh) => mesh.name === "wall");

        if (hit && hit.pickedMesh) {
            const wall = hit.pickedMesh;

            if (lastInvisibleWall && lastInvisibleWall !== wall) {
                lastInvisibleWall.isVisible = true;
            }

            wall.isVisible = false;
            lastInvisibleWall = wall as Mesh;
        } else if (lastInvisibleWall) {
            lastInvisibleWall.isVisible = true;
            lastInvisibleWall = null;
        }
    }
}
