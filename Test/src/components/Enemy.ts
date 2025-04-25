import { Scene, Vector3, SceneLoader, StandardMaterial, Color3, Ray, AbstractMesh, Quaternion, MeshBuilder, PointLight,Mesh } from "@babylonjs/core";
import { PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core";
import { Player } from "./Player";

export class Enemy {
    private scene: Scene;
    private mesh: AbstractMesh | null = null;
    private capsule: AbstractMesh | null = null; // Capsule physique de l'ennemi
    private light: PointLight | null = null; // Lumière autour de l'ennemi
    private health: number;
    private lastShotTime: number = 0;
    private enemyProjectiles: Mesh[] = []; // Liste des projectiles de l'ennemi

    constructor(scene: Scene, position: Vector3, health: number) {
        this.scene = scene;
        this.health = health;

        SceneLoader.ImportMeshAsync("", "/models/", "3d-crayon/source/Crayon 3D.glb", this.scene).then((result) => {
            this.mesh = result.meshes[0];
            this.mesh.position = position;
            this.mesh.rotationQuaternion = Quaternion.Identity();
            this.mesh.scaling = new Vector3(10, 10, 10);

            // Ajout de la capsule physique
            this.capsule = MeshBuilder.CreateCapsule("enemyCapsule", { height: 8, radius: 3.5 }, this.scene);
            this.capsule.position = position;
            this.capsule.visibility = 0; // Rendre la capsule invisible
            new PhysicsAggregate(this.capsule, PhysicsShapeType.CAPSULE, { mass: 0 }, this.scene);

            // Ajout d'une lumière ponctuelle autour de l'ennemi
            this.light = new PointLight("enemyLight", this.mesh.position.clone(), this.scene);
            this.light.intensity = 2.0; // Augmenter l'intensité pour plus de visibilité
            this.light.range = 50; // Augmenter la portée pour couvrir une plus grande zone
            this.light.diffuse = new Color3(1, 0, 0); // Couleur rouge pour la lumière
            this.light.specular = new Color3(1, 1, 1); // Couleur spéculaire blanche

            // Mise à jour de la position de la lumière pour suivre le mesh
            this.scene.onBeforeRenderObservable.add(() => {
                if (this.mesh && this.light) {
                    this.light.position = this.mesh.position.clone();
                }
            });
        });
    }

    getMesh() {
        return this.mesh;
    }

    getCapsule(): AbstractMesh | null {
        return this.capsule;
    }

    getHealth() {
        return this.health;
    }

    public dispose() {
        if (this.mesh) {
            this.mesh.dispose();
            this.mesh = null;
        }
        if (this.capsule) {
            this.capsule.dispose();
            this.capsule = null;
        }
        if (this.light) {
            this.light.dispose(); // Supprime la lumière
            this.light = null;
        }
        console.log("👾 Ennemi complètement supprimé !");
    }

    reduceHealth(amount: number) {
        this.health = Math.max(0, this.health - amount);
        console.log(`👾 Ennemi touché ! Santé restante : ${this.health}`);
        if (this.health <= 0) {
            this.dispose(); // Supprime complètement l'ennemi
        }
    }

    shootAtPlayer(scene: Scene, playerPosition: Player) {
        const currentTime = performance.now();
        if (currentTime - this.lastShotTime < 1500) return; // Tir toutes les 2 secondes
        this.lastShotTime = currentTime;

        if (!this.mesh) {
            console.error("❌ Enemy mesh is null. Cannot create ray.");
            return;
        }
        // Vérifie la ligne de vue directe vers le joueur
        
        const playerPos = playerPosition.getCapsulePosition(); // ou getMesh().position si besoin
        const ray = new Ray(this.mesh.position, playerPos.subtract(this.mesh.position).normalize());
        const direction = playerPos.subtract(this.mesh.position).normalize();
        const hit = scene.pickWithRay(ray, (mesh) => mesh.name === "wall");
        if (hit && hit.pickedMesh) return; // Si un mur bloque la vue, ne pas tirer

        const capsule = MeshBuilder.CreateCapsule("enemyCapsuleProjectile", { height: 1, radius: 0.5 }, scene);
        capsule.visibility = 0;
        capsule.position = this.mesh.position.add(direction.scale(2));
        new PhysicsAggregate(capsule, PhysicsShapeType.CAPSULE, { mass: 0.1 }, scene);

        const projectile = MeshBuilder.CreateSphere("enemyProjectile", { diameter: 1 }, scene);
        projectile.position = new Vector3(0, 0, 0);
        const material = new StandardMaterial("projectileMat", scene);
        material.diffuseColor = new Color3(1, 0, 0); // Rouge
        projectile.material = material;
        projectile.parent = capsule;
        const physicsBody = capsule.physicsBody;
        if (physicsBody) {
            physicsBody.setLinearVelocity(direction.scale(80));//vitesse balle
        }
        capsule.metadata = { velocity: direction.scale(20), lifetime: 3 };
        this.enemyProjectiles.push(capsule);

        // Déplacement du projectile
        const deltaTime = scene.getEngine().getDeltaTime() / 1000;
        projectile.position.addInPlace(capsule.metadata.velocity.scale(deltaTime));
        this.scene.registerBeforeRender(() => {
            projectile.rotation.y += 0.05;
            projectile.rotation.x += 0.05;
        });
        scene.registerBeforeRender(() => {
            this.updateEnemyProjectiles(playerPosition);
        });  
    }

    public updateEnemyProjectiles(player: Player) {
        const delta = this.scene.getEngine().getDeltaTime() / 1000;
    
        this.enemyProjectiles = this.enemyProjectiles.filter(proj => {
            if (!proj) return false;
    
            const velocity = proj.metadata?.velocity;
            if (!velocity) return false;
    
            proj.position.addInPlace(velocity.scale(delta));
            proj.metadata.lifetime -= delta;
    
            // Ici tu peux faire collision avec le joueur, ex :
            const playerCapsule = player.getCapsule();
            if (playerCapsule && playerCapsule.intersectsMesh(proj, false)) {
                player.reduceHealth?.(10); // ou comme tu veux
                proj.dispose();
                return false;
            }
    
            if (proj.position.length() > 1000 || proj.metadata.lifetime <= 0) {
                proj.dispose();
                return false;
            }
    
            return true;
        });
    }
}
