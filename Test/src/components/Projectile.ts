import { Scene,MeshBuilder,PhysicsAggregate,PhysicsShapeType,Vector3,Mesh,StandardMaterial
,Color3,DynamicTexture } from "@babylonjs/core";
import { Player } from "../components/Player";
import { Enemy } from "../components/Enemy";

export class Projectile {
    private scene: Scene;
    private player: Player;
    private projectiles: Mesh[] = [];
    private enemies: Enemy[] = [];

    public constructor(scene: Scene, player: Player) {
        this.scene = scene; 
        this.player = player;
    }

    private setupShooting1() {
        window.addEventListener("keydown", (event) => {
            if (event.key.toLowerCase() === "f") {
                this.shootProjectile1();
            }
        });

        this.scene.onBeforeRenderObservable.add(() => {
            this.updateProjectiles1();
        });
    }
    
    private shootProjectile1() {
        const playerPosition = this.player.getCapsule().position.clone();

        let forwardVector = this.player.getCapsule().forward.normalize();
        forwardVector = forwardVector.scale(-1);
        const capsuleAmo = MeshBuilder.CreateCapsule("projectileCapsule", { height: 1, radius: 0.3 }, this.scene);
        capsuleAmo.visibility = 0;
        capsuleAmo.position = playerPosition.add(forwardVector.scale(2));
        new PhysicsAggregate(capsuleAmo, PhysicsShapeType.CAPSULE, { mass: .1 }, this.scene);
        const projectile = MeshBuilder.CreateSphere("projectile", { diameter: 1 }, this.scene);
        projectile.position = new Vector3(0,0,0);
        projectile.parent = capsuleAmo;
        
        const material = new StandardMaterial("projectileMat", this.scene);
        const texture = new DynamicTexture("rainbowTex", {width: 512, height: 512}, this.scene, false);
        const ctx = texture.getContext();

        const gradient = ctx.createLinearGradient(0, 0, 512, 0);
        gradient.addColorStop(0.4, "red");
        gradient.addColorStop(0.3, "orange");
        gradient.addColorStop(0.5, "yellow");
        gradient.addColorStop(0.5, "green");
        gradient.addColorStop(0.3, "blue");
        gradient.addColorStop(0.3, "violet");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
        texture.update();

        material.diffuseTexture = texture;
        material.specularColor = new Color3(0, 0, 0);
        projectile.material = material;

        const physicsBody = capsuleAmo.physicsBody;
        if (physicsBody) {
            physicsBody.setLinearVelocity(forwardVector.scale(100));
        }

        this.scene.registerBeforeRender(() => {
            projectile.rotation.y += 0.05;
            projectile.rotation.x += 0.05;
        });
        capsuleAmo.metadata = { velocity: forwardVector.scale(20),lifetime: 5 };
        this.projectiles.push(capsuleAmo);
    }

    private updateProjectiles1() {
        const delta = this.scene.getEngine().getDeltaTime() / 1000;

        this.projectiles = this.projectiles.filter(proj => {
            if (!proj) return false;
            const velocity = proj.metadata?.velocity;
            if (!velocity) return false;
            proj.position.addInPlace(velocity.scale(delta));
            proj.metadata.lifetime -= delta;

            if (proj.metadata.lifetime <= 0) {
                proj.dispose();
                return false;
            }

            for (const enemy of this.enemies) {
                const capsule = enemy.getCapsule();
                if (capsule && capsule.intersectsMesh(proj, false)) {
                    enemy.reduceHealth(50); // Réduit la santé de l'ennemi
                    proj.dispose(); // Supprime le projectile
                    if (enemy.getHealth() <= 0) {
                        const enemyMesh = enemy.getMesh();
                        if (enemyMesh) {
                            enemyMesh.dispose(); // Supprime l'ennemi de la scène
                        }
                        this.enemies = this.enemies.filter(e => e !== enemy); // Supprime l'ennemi de la liste
                    }
                    return false; // Supprime le projectile de la scène
                }
            }

            if (proj.position.length() > 1000) {
                proj.dispose();
                return false;
            }

            return true;
        });
    }
}