import { Scene, Vector3, SceneLoader, Quaternion, MeshBuilder, Mesh, FollowCamera, Ray, StandardMaterial, Color3, TransformNode } from "@babylonjs/core";
import { PhysicsAggregate, PhysicsShapeType, PhysicsMotionType, AnimationGroup } from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { HUD } from "../components/HUD"; // Import HUD

export class Player {
    private scene: Scene;
    private playerMesh!: Mesh;
    private playerRoot!: TransformNode;
    private physicsCapsule!: Mesh;
    private physics!: PhysicsAggregate | null;
    private animationGroup: AnimationGroup[] = [];
    private meshLoaded: boolean = false;
    private health: number = 100;
    private nameMesh!: string;
    private level!: number;
    private hud: HUD; // Add a reference to the HUD instance

    constructor(scene: Scene, startPosition: Vector3, nameMesh: string, hud: HUD,level: number) {
        this.scene = scene;
        this.nameMesh = nameMesh;
        this.hud = hud; // Initialize the HUD instance
        this.createMesh(startPosition);
        this.level = level;
    }
    getLevel() {
        return this.level;
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

    getCapsulePosition(): Vector3 {
        return this.physicsCapsule?.position.clone() || Vector3.Zero(); // Retourne une copie de la position
    }

    getAnimationGroups() {
        return this.animationGroup;
    }

    getHealth() {
        return this.health;
    }

    reduceHealth(amount: number) {
        if (this.health <= 0) {
            console.warn("⚠️ Le joueur est déjà éliminé, pas de réduction de santé.");
            return;
        }

        this.health = Math.max(0, this.health - amount);
        console.log(`🛡️ Joueur touché ! Santé restante : ${this.health}`);

        this.hud.updatePlayerHealth(this.health); // Update the HUD with the new health value

        const redIntensity = (100 - this.health) / 100;
        const material = this.playerMesh.material as StandardMaterial;
        if (material) {
            material.diffuseColor = new Color3(1, 1 - redIntensity, 1 - redIntensity);
        }

        if (this.health <= 0) {
            console.error("❌ Joueur éliminé !");
            this.stopMovement(); // Arrête tout mouvement du joueur
        }
    }

    private createMesh(startPosition: Vector3) {
        SceneLoader.ImportMeshAsync("", "./src/assets/models/", this.nameMesh, this.scene).then((result) => {
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

            this.playerRoot = new TransformNode("playerRoot", this.scene);
            this.playerRoot.metadata = { level0: true }; // 💡 Mark root as level0
            result.meshes.forEach(mesh => {
                if (mesh.name.startsWith("corps_Sphere")) {
                    mesh.parent = this.playerRoot;
                    mesh.metadata = { level0: true }; // 💡 Mark each mesh as level0
                }
                if (mesh.name.startsWith("Ch23_")) {
                    mesh.parent = this.playerRoot;
                    mesh.metadata = { level0: true }; // 💡 Mark each mesh as level0
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
            this.physicsCapsule.position = new Vector3(startPosition.x, 4, startPosition.z); // Vérifiez la hauteur (y = 4)
            this.physicsCapsule.rotationQuaternion = Quaternion.Identity();
            this.physicsCapsule.metadata = { level0: true }; // 💡 Mark capsule as level0

            this.physics = new PhysicsAggregate(this.physicsCapsule, PhysicsShapeType.CAPSULE, {
                mass: 5, // Assurez-vous que la masse est suffisante pour réagir aux forces
                restitution: 0.2, // Ajout d'un léger rebond pour le réalisme
                friction: 0.8
            }, this.scene);

            if (this.physics.body) {
                console.log("✅ Corps physique du joueur initialisé :", this.physics.body);
            } else {
                console.error("❌ Échec de l'initialisation du corps physique du joueur !");
            }

            this.physics.body.setMotionType(PhysicsMotionType.DYNAMIC);

            // ✅ Ajout d'une limite pour éviter que le joueur ne glisse
            this.physics.body.setLinearDamping(0.5); // Augmentez cette valeur (par exemple, 0.5 ou plus)
            this.physics.body.setAngularDamping(0.1); // Réduit la rotation progressivement

            // ✅ Suppression des appels incorrects
            console.log("🔍 Propriétés physiques de la capsule configurées :", {
                mass: 5,
                restitution: 0.2,
                friction: 0.8
            });

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

    public disposePhysics() {
        if (this.physics) {
            // Note: Disposing the aggregate should handle the body as well.
            this.physics.dispose();
            this.physics = null;
        }
         // If using PhysicsViewer, would hide here: viewer.hideBody(this.physics.body);
    }

    public recreatePhysics(position: Vector3) {
        // Ensure old physics is disposed if it exists
        this.disposePhysics();

        if (!this.physicsCapsule) {
            console.error("Cannot recreate physics, capsule mesh does not exist.");
            return;
        }

        // Ensure capsule is at the desired position before creating aggregate
        this.physicsCapsule.position = position;

        this.physics = new PhysicsAggregate(this.physicsCapsule, PhysicsShapeType.CAPSULE,
            {
                mass: 5, // Assurez-vous que la masse est suffisante pour réagir aux forces
                restitution: 0.2, // Ajout d'un léger rebond pour le réalisme
                friction: 0.8
            }, // Use stored options
            this.scene
        );

        if (this.physics.body) {
            this.physics.body.setMotionType(PhysicsMotionType.DYNAMIC);
            this.physics.body.setLinearDamping(0.5); // Augmentez cette valeur (par exemple, 0.5 ou plus)
            this.physics.body.setAngularDamping(0.1);

            // Reset velocities just in case
            this.physics.body.setLinearVelocity(Vector3.Zero());
            this.physics.body.setAngularVelocity(Vector3.Zero());

             // If using PhysicsViewer, would show here: viewer.showBody(this.physics.body);
        } else {
            console.error("Failed to create physics body during recreation.");
        }
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
        //const hit = this.scene.pickWithRay(ray, (mesh) => mesh.name === "wall");
        const hit = this.scene.pickWithRay(ray, (mesh) => {
            // Check if the mesh is either named "wall" or one of the specific wall names
            const wallNames = ["northWall", "southWall", "eastWall", "westWall"];
            return mesh.name === "wall" || wallNames.includes(mesh.name);
        });

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
