import {
    Scene,
    Vector3,
    MeshBuilder,
    StandardMaterial,
    Color3,
    HemisphericLight,
    PhysicsAggregate,
    PhysicsShapeType,
    AbstractMesh,
    TransformNode,
    Mesh,
    Texture,
    Color4,
    Quaternion,
    PhysicsBody,
    PhysicsMotionType,
    FollowCamera
} from "@babylonjs/core";
import { Player } from "../components/Player";
import { setupControls } from "../core/InputManager";
import { HUD } from "../components/HUD";

export class Level2 {
    private scene: Scene;
    private canvas: HTMLCanvasElement;
    private player!: Player;
    private hud!: HUD;
    private startPoint: Vector3 = new Vector3(0, 6, -10); // TODO: A changer
    private endZone!: AbstractMesh;
    private platforms: AbstractMesh[] = [];
    private deathZoneY: number = -20;
    private levelComplete: boolean = false;
    private renderObserver: any = null;
    private followCamera!: FollowCamera;

    constructor(scene: Scene, canvas: HTMLCanvasElement) {
        this.scene = scene;
        this.canvas = canvas;

        this.clearPreviousLevel();

        this.hud = new HUD();
        this.init();
    }

    private clearPreviousLevel() {
        console.log("🧹 Clearing previous level elements...");

        // --- Camera Cleanup ---
        const existingFollowCam = this.scene.getCameraByName("FollowCamera");
        if (existingFollowCam) {
            console.log("Disposing existing FollowCamera...");
            if (this.scene.activeCamera === existingFollowCam) {
                this.scene.activeCamera = null;
            }
            existingFollowCam.dispose();
        }
        const existingFreeCam = this.scene.getCameraByName("FreeCamera");
         if (existingFreeCam) {
             console.log("Disposing existing FreeCamera...");
             existingFreeCam.dispose();
         }


        const meshesToKeep = ["playerRoot", "playerCapsule", "FollowCamera", "FreeCamera",  "__root__"]; // Removed camera names from here
        const meshesToDispose = this.scene.meshes.filter(mesh =>
            !meshesToKeep.includes(mesh.name) &&
            !mesh.name.startsWith("corps_Sphere") &&
            !mesh.name.toLowerCase().includes("skybox")
        );
        console.log(`Attempting to dispose ${meshesToDispose.length} meshes.`);
        meshesToDispose.forEach(mesh => {
             if (mesh.physicsBody) {
                 try { mesh.physicsBody.dispose(); } catch (e) { console.warn(`Physics body dispose error: ${e}`); }
             }
             try { mesh.dispose(); } catch (e) { console.warn(`Mesh dispose error: ${e}`); }
        });


        const lightsToDispose = this.scene.lights.filter(light => light.name !== "level2Light"); // Keep potential new light
        lightsToDispose.forEach(light => light.dispose());

         if (this.hud && typeof this.hud.resetHUD === 'function') {
             console.log("Resetting existing HUD (if any)...");
             this.hud.resetHUD();
         } else {
             const counterElement = document.querySelector("div[style*='top: 20px; left: 50%;']");
             const missionElement = document.querySelector("div[style*='top: 20px; right: 20px;']");
             const distanceElement = document.querySelector("div[style*='top: 60px; right: 20px;']");
             const healthBarContainer = document.querySelector("div[style*='top: 20px; left: 20px;']");
             counterElement?.remove();
             missionElement?.remove();
             distanceElement?.remove();
             healthBarContainer?.remove();
         }

        console.log("✅ Previous level cleared.");
    }


    private async init() {
        console.log("🚀 Initializing Level 2: Simple Platformer...");
        this.levelComplete = false;

        if (!this.scene.getLightByName("level2Light")) {
             new HemisphericLight("level2Light", new Vector3(0, 1, 0), this.scene);
        }
        this.scene.clearColor = new Color4(0.2, 0.5, 0.8, 1.0);

        this.createPlatforms();

        let playerCapsule = this.scene.getMeshByName("playerCapsule") as Mesh;
        if (!playerCapsule) {
            console.log("Creating new player instance for Level 2...");
            this.player = new Player(this.scene, this.startPoint);
            await this.player.meshReady();
        } else if (!this.player) {
             console.warn("Player capsule exists, but instance reference missing. Creating new.");
             this.player = new Player(this.scene, this.startPoint);
             await this.player.meshReady();
        } else {
             console.log("Reusing player instance.");
             await this.player.meshReady();
        }

        this.resetPlayer();
        this.setupFollowCamera();
        setupControls(this.player);

        if (this.hud) {
             this.hud.updateMission("Reach the green platform!");
             this.hud.hideCounter?.();
             this.hud.showDistance?.();
             this.hud.updatePlayerHealth?.(this.player.getHealth());
        } else {
            console.error("HUD not initialized for Level 2!");
        }

        if (this.renderObserver) {
            this.scene.onBeforeRenderObservable.remove(this.renderObserver);
        }
        this.renderObserver = this.scene.onBeforeRenderObservable.add(() => {
            if (this.levelComplete) return;
            this.checkPlayerPosition();
            this.updateHUD();
        });

        console.log("✅ Level 2 Initialized!");
    }

    private setupFollowCamera() {
        const existingCam = this.scene.getCameraByName("FollowCamera");
        if (existingCam) {
            console.log("Disposing existing FollowCamera before creating new one...");
             if (this.scene.activeCamera === existingCam) {
                 this.scene.activeCamera = null;
             }
             existingCam.dispose();
        }

        this.followCamera = new FollowCamera("FollowCamera", new Vector3(0, 15, -45), this.scene);

        const playerCapsule = this.player?.getCapsule();
        if (playerCapsule) {
            this.followCamera.lockedTarget = playerCapsule;
        }

        this.followCamera.radius = 25;
        this.followCamera.heightOffset = 9;
        this.followCamera.rotationOffset = 0;
        this.followCamera.cameraAcceleration = 0.5;
        this.followCamera.maxCameraSpeed = 10;
        this.followCamera.inputs.clear();

        this.scene.activeCamera = this.followCamera;
        console.log("📷 FollowCamera setup complete and activated.");
    }


    private createPlatforms() {
        // TODO: faire une génération procédurale des plateformes à la place du hardcode
        this.platforms.forEach(p => {
             if (p.physicsBody) p.physicsBody.dispose();
             p.dispose();
         });
        this.platforms = [];
         if (this.endZone) {
            if (this.endZone.physicsBody) this.endZone.physicsBody.dispose();
            this.endZone.dispose();
         }
        const platformMaterial = new StandardMaterial("platformMat", this.scene);
        platformMaterial.diffuseColor = new Color3(0.6, 0.6, 0.6);
        const endMaterial = new StandardMaterial("endMat", this.scene);
        endMaterial.diffuseColor = new Color3(0, 1, 0);
        const startPlatform = this.createPlatform("startPlatform", new Vector3(0, 5, -10), new Vector3(10, 1, 10), platformMaterial);
        this.platforms.push(startPlatform);
        this.platforms.push(this.createPlatform("plat1", new Vector3(0, 5, 0), new Vector3(5, 1, 5), platformMaterial));
        this.platforms.push(this.createPlatform("plat2", new Vector3(10, 5, 10), new Vector3(5, 1, 5), platformMaterial));
        this.platforms.push(this.createPlatform("plat3", new Vector3(0, 5, 20), new Vector3(5, 1, 5), platformMaterial));
        this.platforms.push(this.createPlatform("plat4", new Vector3(-10, 5, 30), new Vector3(5, 1, 5), platformMaterial));
        this.endZone = this.createPlatform("endPlatform", new Vector3(-10, 5, 45), new Vector3(10, 1, 10), endMaterial);
        this.platforms.push(this.endZone);
        console.log("🏗️ Platforms created.");
    }

    private createPlatform(name: string, position: Vector3, size: Vector3, material: StandardMaterial): AbstractMesh {
        const platform = MeshBuilder.CreateBox(name, { width: size.x, height: size.y, depth: size.z }, this.scene);
        platform.position = position;
        platform.material = material;
        platform.checkCollisions = true;
        try {
            new PhysicsAggregate(platform, PhysicsShapeType.BOX, { mass: 0 }, this.scene);
        } catch (e) {
            console.error(`Failed physics for ${name}: ${e}`);
        }
        return platform;
    }

    private checkPlayerPosition() {
        if (this.levelComplete || !this.player || typeof this.player.getCapsule !== 'function') return;
        const playerCapsule = this.player.getCapsule();
        if (!playerCapsule) return;
        const playerPos = this.player.getCapsulePosition();
        if (!playerPos) return;

        if (playerPos.y < this.deathZoneY) {
            console.log("💀 Player fell! Resetting...");
            this.resetPlayer();
            return;
        }

        if (this.endZone && playerCapsule.intersectsMesh(this.endZone, false)) {
            console.log("🎉 Level 2 Complete!");
            this.levelComplete = true;
            this.player.stopMovement();
            if (this.hud) {
                 this.hud.updateMission("Level Complete!");
                 this.hud.hideDistance?.();
            }
            setTimeout(() => this.loadNextLevel(), 1000);
        }
    }

    private resetPlayer() {
        if (this.player && typeof this.player.getPhysics === 'function' && this.player.getPhysics()?.body) {
            const playerAggregate = this.player.getPhysics();
            const playerBody = playerAggregate.body;
            const capsule = this.player.getCapsule();
            if (playerBody && capsule) {
                playerBody.setLinearVelocity(Vector3.Zero());
                playerBody.setAngularVelocity(Vector3.Zero());
                capsule.rotationQuaternion = Quaternion.Identity();
                capsule.position = this.startPoint;
                playerBody.setMotionType(PhysicsMotionType.DYNAMIC);
                console.log(`🔄 Player reset attempted. New capsule position: ${capsule.position}`);
            } else {
                 console.warn("Player capsule or physics body not found during reset.");
            }
        } else {
            console.warn("Player, physics aggregate, or physics body not ready for reset.");
        }
    }

    private updateHUD() {
        if (this.levelComplete || !this.player || !this.endZone || !this.hud || typeof this.player.getCapsule !== 'function') return;
        const playerCapsule = this.player.getCapsule();
        if (!playerCapsule) return;

        try {
            const playerPos = this.player.getCapsulePosition();
            if (!playerPos) return;

            const currentMission = this.hud.getCurrentMissionText();
            if (currentMission.includes("Reach the green platform!")) {
                const distanceToEnd = Vector3.Distance(playerPos, this.endZone.position);
                this.hud.updateDistance?.(distanceToEnd, "End Zone");
            }
            this.hud.updatePlayerHealth?.(this.player.getHealth());
        } catch (error) { console.error("HUD update error:", error); }
    }

    private disposeLevel() {
         console.log("🗑️ Disposing Level 2 resources...");
         if (this.renderObserver) {
             this.scene.onBeforeRenderObservable.remove(this.renderObserver);
             this.renderObserver = null;
         }
         this.followCamera?.dispose();

         this.platforms.forEach(p => {
             if (p.physicsBody) p.physicsBody.dispose();
             p.dispose();
         });
         this.platforms = [];

         const light = this.scene.getLightByName("level2Light");
         if (light) light.dispose();

         this.hud.removeDOMElements();

         console.log("✅ Level 2 disposed.");
     }

    private loadNextLevel() {
        // TODO: Niveau 3
    }
}