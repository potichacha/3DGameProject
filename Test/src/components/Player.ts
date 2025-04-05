import { Scene, Vector3, SceneLoader, Quaternion, MeshBuilder, Mesh, FollowCamera, Ray } from "@babylonjs/core";
import { PhysicsAggregate, PhysicsShapeType, PhysicsMotionType , AnimationGroup} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";

export class Player {
    private scene: Scene;
    private playerMesh!: Mesh;
    private physicsCapsule!: Mesh;
    private physics!: PhysicsAggregate;
    private meshLoaded: boolean = false;
    private animationGroup: AnimationGroup[]= [];
    private health: number = 100; // Points de vie du joueur

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
    }

    private createMesh(startPosition: Vector3) {
        SceneLoader.ImportMeshAsync("", "./src/assets/models/", "finaleSinj.glb", this.scene).then((result) => {
            console.log("🔍 Meshes importés :", result.meshes);
            this.animationGroup = result.animationGroups;
            console.log("🔍 Animation importés :", this.animationGroup);
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

            // 📌 Récupérer la hauteur max du mesh pour bien ajuster la capsule
            //Probleme ici ! on fait peut etre l'inverse ?
            /*
            let children = this.playerMesh.getChildren();//vide
            console.log("🔍 Enfants du joueur :", children);//vide
            console.log("🔍 joueur :", this.playerMesh);//joueur
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
            */

            // ✅ Création de la capsule physique
            //probleme ici
            this.physicsCapsule = MeshBuilder.CreateCapsule("playerCapsule", {
                height: 8,
                radius: 3.5,
            }, this.scene);
            this.physicsCapsule.visibility = 0;
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
            this.playerMesh.position = new Vector3(0, -8 / 2, 0); //réparer ici car maxheight est à 0 donc j'ai mis -8
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

    public checkForObstacles(followCamera: FollowCamera,lastInvisibleWall: Mesh | null) {
        const cameraPosition = followCamera.position;
        const playerPosition = this.getCapsule().position;
        
        const direction = playerPosition.subtract(cameraPosition).normalize();
        const ray = new Ray(cameraPosition, direction, 25); // Longueur du rayon de 20 unités
        const rayEnd = playerPosition.add(direction.scale(50));
        //const rayMesh = MeshBuilder.CreateLines("ray", { points: [cameraPosition, rayEnd] }, scene); //créer un rayon pour le debug
        // Vérifier les intersections avec le rayon
        const hit = this.scene.pickWithRay(ray, (mesh) => {
            // On ne veut pas détecter la caméra ou le joueur comme intersection
            return mesh !== this.getMesh() && mesh.name === "wall"; // Vérifie que c'est un mur
        });

        if (hit && hit.pickedMesh) {
            const wall = hit.pickedMesh;

            // Rendre le mur invisible
            if (lastInvisibleWall && lastInvisibleWall !== wall) {
                lastInvisibleWall.isVisible = true; // Rendre visible le dernier mur invisible
            }

            wall.isVisible = false; // Rendre le mur actuel invisible
            lastInvisibleWall = wall as Mesh; // Mettre à jour le dernier mur invisible
        } else if (lastInvisibleWall) {
            // Si aucun mur n'est détecté, rendre visible le dernier mur invisible
            lastInvisibleWall.isVisible = true;
            lastInvisibleWall = null;
        }
    }
}
