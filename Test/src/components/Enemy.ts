import { Scene, Vector3, SceneLoader, StandardMaterial, Color3, Ray, AbstractMesh, Quaternion,MeshBuilder } from "@babylonjs/core";
import { PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core";

export class Enemy {
    private scene: Scene;
    private mesh: AbstractMesh | null = null;
    private health: number;
    private lastShotTime: number = 0;

    constructor(scene: Scene, position: Vector3, health: number) {
        this.scene = scene;
        this.health = health;

        SceneLoader.ImportMeshAsync("", "./src/assets/models/", "3d-crayon/source/Crayon 3D.glb", this.scene).then((result) => {
            //const rootMesh = result.meshes[0];
            this.mesh = result.meshes[0];
            this.mesh.position = new Vector3(position.x, position.y, position.z);
            this.mesh.rotationQuaternion = Quaternion.Identity();

            // Si besoin tu peux ajuster le scale ici :
            this.mesh.scaling= new Vector3(10, 10, 10); // facultatif

            // Physique
            new PhysicsAggregate(this.mesh, PhysicsShapeType.CAPSULE, { mass: 0 }, this.scene);
        });
    }

    getMesh() {
        return this.mesh;
    }

    getHealth() {
        return this.health;
    }

    reduceHealth(amount: number) {
        this.health = Math.max(0, this.health - amount);
        console.log(`👾 Ennemi touché ! Santé restante : ${this.health}`);
        if (this.health <= 0 && this.mesh) {
            this.mesh.dispose();
            this.mesh = null;
            console.log("👾 Ennemi éliminé !");
        }
    }

    shootAtPlayer(scene: Scene, playerPosition: Vector3) {
        const currentTime = performance.now();
        if (currentTime - this.lastShotTime < 2000) return; // Tir toutes les 2 secondes
        this.lastShotTime = currentTime;

        if (!this.mesh) {
            console.error("❌ Enemy mesh is null. Cannot create ray.");
            return;
        }
        // Vérifie la ligne de vue directe vers le joueur
        const ray = new Ray(this.mesh.position, playerPosition.subtract(this.mesh.position).normalize());
        const hit = scene.pickWithRay(ray, (mesh) => mesh.name === "wall");
        if (hit && hit.pickedMesh) return; // Si un mur bloque la vue, ne pas tirer

        // Crée un projectile (petite sphère rouge)
        const projectile = MeshBuilder.CreateSphere("enemyProjectile", { diameter: 0.5 }, scene);

        const material = new StandardMaterial("projectileMat", scene);
        material.diffuseColor = new Color3(1, 0, 0); // Rouge
        projectile.material = material;

        // Direction vers la position du joueur
        const direction = playerPosition.subtract(this.mesh.position).normalize();

        // Définir la vitesse des projectiles des ennemis à 20 (comme les vôtres)
        const velocity = direction.scale(20); // Vitesse du projectile
        projectile.metadata = { velocity };

        // Déplacement du projectile
        scene.onBeforeRenderObservable.add(() => {
            const deltaTime = scene.getEngine().getDeltaTime() / 1000;
            projectile.position.addInPlace(velocity.scale(deltaTime));

            // Supprime le projectile s'il touche un mur ou sort de la scène
            const ray = new Ray(projectile.position, velocity.normalize());
            const hit = scene.pickWithRay(ray, (mesh) => mesh.name === "wall");
            if (hit && hit.pickedMesh) {
                projectile.dispose();
            }

            // Supprime le projectile s'il sort de la scène
            if (projectile.position.length() > 1000) {
                projectile.dispose();
            }
        });
    }
}
