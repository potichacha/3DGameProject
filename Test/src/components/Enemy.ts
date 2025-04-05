import { Scene, Vector3, MeshBuilder, StandardMaterial, Color3, Ray, AbstractMesh, Quaternion } from "@babylonjs/core";
import { PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core";

export class Enemy {
    private scene: Scene;
    private mesh!: AbstractMesh; // Ajout de "!" pour indiquer qu'il sera initialisé plus tard
    private health: number;
    private lastShotTime: number = 0; // Temps du dernier tir

    constructor(scene: Scene, position: Vector3, health: number) {
        this.scene = scene;
        this.health = health;

        // 📌 Création de l'ennemi (capsule rouge)
        this.mesh = MeshBuilder.CreateCapsule("enemyCapsule", {
            height: 8, // Même hauteur que le joueur
            radius: 3.5, // Même rayon que le joueur
        }, this.scene);
        this.mesh.position = position;
        this.mesh.rotationQuaternion = Quaternion.Identity();

        // 📌 Matériau rouge pour l'ennemi
        const material = new StandardMaterial("enemyMat", this.scene);
        material.diffuseColor = Color3.Red();
        this.mesh.material = material;

        // 📌 Ajouter la physique (capsule physique)
        new PhysicsAggregate(this.mesh, PhysicsShapeType.CAPSULE, { mass: 0 }, this.scene);
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
        if (this.health <= 0) {
            this.mesh.dispose(); // Supprime l'ennemi de la scène
            console.log("👾 Ennemi éliminé !");
        }
    }

    shootAtPlayer(scene: Scene, playerPosition: Vector3) {
        const currentTime = performance.now();
        if (currentTime - this.lastShotTime < 2000) return; // Tir toutes les 2 secondes
        this.lastShotTime = currentTime;

        // Vérifie la ligne de vue directe vers le joueur
        const ray = new Ray(this.mesh.position, playerPosition.subtract(this.mesh.position).normalize());
        const hit = scene.pickWithRay(ray, (mesh) => mesh.name === "wall");
        if (hit && hit.pickedMesh) return; // Si un mur bloque la vue, ne pas tirer

        // Crée un projectile (petite sphère rouge)
        const projectile = MeshBuilder.CreateSphere("enemyProjectile", { diameter: 0.5 }, scene);
        projectile.position = this.mesh.position.clone();

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
        });
    }
}