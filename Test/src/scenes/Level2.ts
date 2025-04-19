import {
    Scene,
    Vector3,
    HemisphericLight,
    Color3,
    MeshBuilder,
    StandardMaterial,
    Texture,
    PhysicsAggregate,
    PhysicsShapeType,
    FollowCamera,
    PointLight,
    PhysicsMotionType,
    Quaternion // Import Quaternion
} from "@babylonjs/core";
import { Level } from "../scenes/Level";
import { Player } from "../components/Player";
import { PlatformGenerator, PlatformGenerationResult } from "../procedural/PlatformGenerator";
import { setupControls } from "../core/InputManager";
import { AssetLoader } from "../assets/assetLoader";
import { HUD } from "../components/HUD";

export class Level2 extends Level {
    protected scene!: Scene;
    protected canvas!: HTMLCanvasElement;
    protected player!: Player | null;
    protected followCamera!: FollowCamera;
    private platformGenerator: PlatformGenerator;
    private platformData!: PlatformGenerationResult;
    private hud: HUD;
    private playerLight!: PointLight;
    private updateObserver: any = null;

    constructor(scene: Scene, canvas: HTMLCanvasElement) {
        super(scene, canvas);
        this.hud = new HUD();
        this.platformGenerator = new PlatformGenerator(this.scene);
        this.player = null;
        this.init();
    }

    private init() {
        this.scene.collisionsEnabled = true;

        const light = new HemisphericLight("light1", new Vector3(0, 1, 0), this.scene);
        light.intensity = 0.9;

        this.playerLight = new PointLight("playerLight", new Vector3(0, 10, 0), this.scene);
        this.playerLight.intensity = 1.0;
        this.playerLight.range = 50;
        this.playerLight.setEnabled(false);

        const skyboxMaterial = AssetLoader.loadSkyboxTexture(this.scene);
        const skybox = MeshBuilder.CreateBox("skyBox", { size: 1500.0 }, this.scene);
        skybox.material = skyboxMaterial;

        const platformStartPosition = new Vector3(0, 10, 0);
        const startPlatformCustomSize = new Vector3(20, 2, 20);
        const minPlatformCustomSize = new Vector3(7, 1, 7);
        const maxPlatformCustomSize = new Vector3(14, 1, 14);

        this.platformData = this.platformGenerator.generatePlatforms(
            30,
            platformStartPosition,
            10,
            20,
            6,
            minPlatformCustomSize,
            maxPlatformCustomSize,
            startPlatformCustomSize
        );

        this.scene.executeWhenReady(async () => {
            if (this.player) return;

            const platformTopY = this.platformData.startPlatform.position.y + (startPlatformCustomSize.y / 2);
            const playerSpawnHeightOffset = 10;
            const playerInitialPosition = new Vector3(
                this.platformData.startPlatform.position.x,
                platformTopY + playerSpawnHeightOffset,
                this.platformData.startPlatform.position.z
            );

            this.player = new Player(this.scene, playerInitialPosition, "sinj.glb");
            await this.player.meshReady();

            if (!this.player || !this.player.getCapsule()) {
                 console.error("Player or player capsule not available after meshReady");
                 return;
            }

            this.setupFollowCameraInternal();
            setupControls(this.player);
            this.playerLight.setEnabled(true);

            this.hud.updateMission("Reach the end platform");
            this.setupFallDetection();
            this.startUpdateLoop();
            this.resetPlayerPosition();
        });
    }

     private setupFollowCameraInternal() {
         if (!this.player || !this.player.getCapsule()) return;
         // Ensure camera doesn't exist before creating
         if (this.followCamera) {
            this.followCamera.dispose();
         }
         this.followCamera = new FollowCamera("FollowCamera", new Vector3(0, 0, 0), this.scene);
         this.followCamera.lockedTarget = this.player.getCapsule();
         this.followCamera.radius = 35;
         this.followCamera.heightOffset = 18;
         this.followCamera.rotationOffset = 0;
         this.followCamera.cameraAcceleration = 0.1;
         this.followCamera.maxCameraSpeed = 15;
         this.followCamera.inputs.clear(); // Might not be necessary if creating new
         this.scene.activeCamera = this.followCamera;
     }


    private setupFallDetection() {
        this.scene.onBeforeRenderObservable.add(() => {
            if (this.player && this.player.getCapsulePosition().y < -30) {
                this.resetPlayerPosition();
            }
        });
    }

    private resetPlayerPosition() {
        if (!this.player) return;

        const startPlatformPosition = this.platformData.startPlatform.position;
        const startPlatformHeight = this.platformData.startPlatform.getBoundingInfo().boundingBox.extendSize.y * 2;
        const platformTopY = startPlatformPosition.y + (startPlatformHeight / 2);
        const respawnYOffset = 3;
        const respawnPosition = new Vector3(
             startPlatformPosition.x,
             platformTopY + respawnYOffset,
             startPlatformPosition.z
        );

        this.player.disposePhysics();

        const transformNode = this.player.getCapsule();
        if (transformNode) {
             transformNode.position = respawnPosition;
             transformNode.rotationQuaternion = Quaternion.Identity();
        }

        this.player.recreatePhysics(respawnPosition);

        // Re-assign camera target after physics recreation
        if (this.followCamera && this.player.getCapsule()) {
            this.followCamera.lockedTarget = this.player.getCapsule();
        }
    }


    private updateHUD() {
        if (!this.player || !this.hud || !this.platformData.endPlatform) return;

        this.hud.updatePlayerHealth(this.player.getHealth());

        const playerPos = this.player.getCapsulePosition();
        const endPlatformPos = this.platformData.endPlatform.position;
        const distanceToEnd = Vector3.Distance(playerPos, endPlatformPos);
        this.hud.updateDistance(distanceToEnd, "End Zone");
        this.hud.showDistance();
        this.hud.hideCounter();
    }

    private startUpdateLoop() {
         this.updateObserver = this.scene.onBeforeRenderObservable.add(() => {
             if (!this.player) return;

             this.updateHUD();

             if (this.playerLight) {
                  const capsulePos = this.player.getCapsulePosition();
                  if(capsulePos){
                     this.playerLight.position = capsulePos.add(new Vector3(0, 5, 0));
                  }
             }

             if (this.platformData.endPlatform) {
                 const playerCapsule = this.player.getCapsule();
                 if (playerCapsule && playerCapsule.intersectsMesh(this.platformData.endPlatform, false)) {
                     console.log("Level 2 Complete!");
                     this.hud.updateMission("Level Complete!");
                     if (this.updateObserver) {
                          this.scene.onBeforeRenderObservable.remove(this.updateObserver);
                          this.updateObserver = null;
                     }
                 }
             }
         });
    }

    public disposeLevel() {
        this.hud.removeDOMElements();
        if (this.updateObserver) {
             this.scene.onBeforeRenderObservable.remove(this.updateObserver);
        }
        this.player?.disposePhysics();
        this.player?.getMesh()?.dispose();
        this.player?.getCapsule()?.dispose();
        this.followCamera?.dispose(); // Dispose camera too

        this.platformData?.platforms.forEach(p => {
            p.getPhysicsBody()?.dispose();
            p.dispose();
        });
        this.playerLight?.dispose();
        this.player = null;
    }
}