import { Scene, Vector3, SceneLoader, Quaternion, MeshBuilder, Mesh, FollowCamera, Ray, StandardMaterial, Color3, TransformNode } from "@babylonjs/core";
import { PhysicsAggregate, PhysicsShapeType, PhysicsMotionType, AnimationGroup } from "@babylonjs/core";
import "@babylonjs/loaders/glTF";

export class Player {
    private scene: Scene;
    private playerMesh!: Mesh;
    private playerRoot!: TransformNode;
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
    getRoot() {
        return this.playerRoot;
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
        SceneLoader.ImportMeshAsync("", "./src/assets/models/", "sinj31.glb", this.scene).then((result) => {//finaleSinj
            console.log("🔍 Meshes importés :", result.meshes);
            console.log("🔍 Meshes importés :", result);

            result.meshes.forEach((mesh, i) => {
                console.log(`🔹 Mesh ${i} — ${mesh.name}`);
                if (mesh.material) {
                    console.log(`🎨 Matériau pour ${mesh.name} :`, mesh.material.name);
                } else {
                    console.warn(`❌ Pas de matériau pour ${mesh.name}`);
                }
            });
            this.animationGroup = result.animationGroups;
            console.log("🔍 Animations importées :", this.animationGroup);

            if (result.meshes.length === 0) {
                console.error("❌ Aucun mesh chargé !");
                return;
            }
            

            //this.playerMesh = result.meshes.find(mesh => mesh.name.toLowerCase().includes("corps_Sphere_primitive0")) as Mesh || result.meshes[1] as Mesh;
            this.playerRoot = new TransformNode("playerRoot", this.scene);
            result.meshes.forEach(mesh => {
                if (mesh.name.startsWith("corps_Sphere")) {
                    mesh.parent = this.playerRoot;
                }
            });
            this.playerMesh = this.playerRoot as unknown as Mesh;


            if (!this.playerMesh) {
                console.error("❌ Erreur : Aucun mesh valide trouvé pour le joueur !");
                return;
            }

            console.log("🛠 Mesh sélectionné :", this.playerMesh.name);

            this.playerMesh.scaling = new Vector3(1.5, 1.5, 1.5);
            this.playerMesh.rotationQuaternion = Quaternion.FromEulerAngles(Math.PI / 2, Math.PI, 0);//Math.PI / 2, Math.PI, 0

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

    stopMovement() {
        if (this.physics) {
            this.physics.body.setLinearVelocity(Vector3.Zero()); // Arrête tout mouvement
            this.physics.body.setAngularVelocity(Vector3.Zero()); // Arrête toute rotation
        }
    }

    public checkForObstacles(followCamera: FollowCamera, currentlyInvisibleWall: Mesh | null): Mesh | null {
        const cameraPosition = followCamera.position;
        if (!this.physicsCapsule) {
            console.warn("Player physics capsule not ready for obstacle check.");
            return currentlyInvisibleWall; // Return the current state if not ready
        }
        const playerPosition = this.physicsCapsule.position;

        // Calculate direction and exact distance for the ray
        const direction = playerPosition.subtract(cameraPosition).normalize();
        const distance = Vector3.Distance(cameraPosition, playerPosition);

        // Ensure distance is slightly more than 0 to avoid issues with ray creation
        if (distance < 0.1) {
            // If camera and player are too close, make sure any invisible wall is visible
            if (currentlyInvisibleWall) {
                currentlyInvisibleWall.isVisible = true;
            }
            return null; // No obstruction possible
        }

        // Create the ray with the exact distance
        const ray = new Ray(cameraPosition, direction, distance);

        // Perform the raycast, only checking walls
        const hit = this.scene.pickWithRay(ray, (mesh) => mesh.name === "wall");

        let newlyInvisibleWall: Mesh | null = null;

        if (hit && hit.pickedMesh && hit.pickedMesh instanceof Mesh) {
            const hitWall = hit.pickedMesh;

            // A wall was hit by the ray
            if (currentlyInvisibleWall && currentlyInvisibleWall !== hitWall) {
                // If a *different* wall was invisible before, make it visible now.
                currentlyInvisibleWall.isVisible = true;
            }

            // Make the newly hit wall invisible and mark it as the current one.
            hitWall.isVisible = false;
            newlyInvisibleWall = hitWall;

        } else {
            // No wall was hit by the ray
            if (currentlyInvisibleWall) {
                // If a wall *was* invisible, make it visible now.
                currentlyInvisibleWall.isVisible = true;
            }
            // No wall is currently invisible
            newlyInvisibleWall = null;
        }

        // Return the wall that is now invisible (or null)
        return newlyInvisibleWall;
    }
}
