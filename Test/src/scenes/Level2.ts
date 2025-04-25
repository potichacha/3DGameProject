import {
    Scene,
    Vector3,
    HemisphericLight,
    MeshBuilder,
    FollowCamera,
    StandardMaterial,
    PointLight,
    Texture,
    Quaternion, // Import Quaternion
    AbstractMesh // Import AbstractMesh
} from "@babylonjs/core";
import { Level } from "./Level";
import { Player } from "../components/Player";
import { PlatformGenerator, PlatformGenerationResult } from "../procedural/PlatformGenerator";
import { setupControls } from "../core/InputManager";
import { HUD } from "../components/HUD";
import {Music} from "../music/music";
// Assuming SceneUtils might be used later

export class Level2 extends Level {
    // Properties remain the same
    protected scene!: Scene;
    protected canvas!: HTMLCanvasElement;
    protected player!: Player | null;
    protected followCamera!: FollowCamera;
    private platformGenerator: PlatformGenerator;
    private platformData!: PlatformGenerationResult;
    private hud: HUD;
    private playerLight!: PointLight;
    private skybox!: AbstractMesh; // Keep track of skybox
    private globalLight!: HemisphericLight; // Keep track of light
    private updateObserver: any = null;
    private fallDetectionObserver: any = null; // Observer for fall detection
    private music: Music = new Music("./public/music/akanegakubo.mp3");

    constructor(scene: Scene, canvas: HTMLCanvasElement) {
        super(scene, canvas);
        this.hud = new HUD(); // Create HUD instance
        this.platformGenerator = new PlatformGenerator(this.scene);
        this.player = null; // Initialize player as null
        this.init();
    }

    private init() {
        console.log("🔨 Initializing Level 2...");
        this.scene.collisionsEnabled = true;

        // Setup lighting
        this.globalLight = new HemisphericLight("light1", new Vector3(0, 1, 0), this.scene);
        this.globalLight.intensity = 0.9;

        this.playerLight = new PointLight("playerLight", new Vector3(0, 10, 0), this.scene);
        this.playerLight.intensity = 1.0;
        this.playerLight.range = 50; // Increased range slightly
        this.playerLight.setEnabled(false); // Initially disabled until player spawns

        // Setup skybox
        const groundMaterial = new StandardMaterial("groundMaterial", this.scene);
                groundMaterial.diffuseTexture = new Texture("./public/textures/cloud2.jpg", this.scene);
        this.skybox = MeshBuilder.CreateBox("skyBox", { size: 1500.0 }, this.scene);
        this.skybox.material = groundMaterial;

        // Define start position for platform generation
        const platformStartPosition = new Vector3(0, 10, 0);

        // Generate platforms using the generator
        // *** REMOVED OVERRIDES: Now uses defaults from PlatformGenerator for easier jumps/bigger platforms ***
        this.platformData = this.platformGenerator.generatePlatforms(
            30,                      // Specify number of platforms (e.g., 30)
            platformStartPosition    // Specify the start position
            // Let minJumpDistance, maxJumpDistance, maxHeightChange,
            // minPlatformSize, maxPlatformSize, startPlatformSize, endPlatformSize
            // use the new defaults defined in PlatformGenerator.ts
        );

        // Ensure player setup happens after scene is ready
        this.scene.executeWhenReady(async () => {
            if (this.player) return; // Don't initialize player twice

            // Calculate spawn position above the start platform
            const startPlatformMesh = this.platformData.startPlatform;
            const platformTopY = startPlatformMesh.position.y + (startPlatformMesh.getBoundingInfo().boundingBox.extendSize.y); // More accurate top Y
            const playerSpawnHeightOffset = 5; // Lowered offset slightly
            const playerInitialPosition = new Vector3(
                startPlatformMesh.position.x,
                platformTopY + playerSpawnHeightOffset,
                startPlatformMesh.position.z
            );

            // Create player instance
            this.player = new Player(this.scene, playerInitialPosition, "SinjUltimeV2.glb", this.hud, 2); // Use appropriate mesh name
            await this.player.meshReady();

            if (!this.player || !this.player.getCapsule()) {
                 console.error("Player or player capsule not available after meshReady");
                 return;
            }

            // Setup camera and controls
            this.setupFollowCameraInternal(); // Renamed internal setup function
            setupControls(this.player); // Setup player controls (using defaults from InputManager)
            this.playerLight.setEnabled(true); // Enable light now that player exists

            // Initialize HUD and game state
            this.hud.updateMission("Reach the green end platform!"); // Update mission text
            this.setupFallDetection(); // Add fall detection logic
            this.startUpdateLoop(); // Start the main update loop for HUD etc.
            this.resetPlayerPosition(); // Ensure player starts correctly positioned

            window.addEventListener("keydown", () => {
                this.music.playMusic();
            }, { once: true });
            window.addEventListener("click", () => {
                this.music.playMusic();
            }, { once: true });
            console.log("✅ Level 2 Initialized Successfully");
        });
    }

     // Sets up the follow camera targeting the player
     private setupFollowCameraInternal() {
         if (!this.player || !this.player.getCapsule()) {
            console.error("Cannot setup camera, player or capsule missing.");
            return;
         };
         // Dispose existing camera if necessary
         const existingCamera = this.scene.getCameraByName("FollowCam");
         if (existingCamera) {
            existingCamera.dispose();
         }

         this.followCamera = new FollowCamera("FollowCam", new Vector3(0, 0, 0), this.scene); // Use unique name
         this.followCamera.lockedTarget = this.player.getCapsule(); // Target the physics capsule
         this.followCamera.radius = 35; // Distance from target
         this.followCamera.heightOffset = 18; // Height relative to target
         this.followCamera.rotationOffset = 0; // Angle offset
         this.followCamera.cameraAcceleration = 0.1; // Smoothing factor
         this.followCamera.maxCameraSpeed = 15; // Max speed
         this.followCamera.inputs.clear(); // Remove default inputs if any
         // this.followCamera.attachControl(this.canvas, true); // Attach controls if needed, usually not for FollowCamera
         this.scene.activeCamera = this.followCamera; // Set as the active camera
     }

    // Adds an observer to reset the player if they fall too low
    private setupFallDetection() {
        // Clear previous observer if exists
        if (this.fallDetectionObserver) {
            this.scene.onBeforeRenderObservable.remove(this.fallDetectionObserver);
        }
        // Add new observer
        this.fallDetectionObserver = this.scene.onBeforeRenderObservable.add(() => {
            if (this.player && this.player.getCapsulePosition().y < -50) { // Increased fall distance threshold
                console.log("Player fell! Resetting position...");
                this.resetPlayerPosition();
            }
        });
    }

    // Resets the player to the start platform
    private resetPlayerPosition() {
        if (!this.player || !this.platformData || !this.platformData.startPlatform) return;

        const startPlatform = this.platformData.startPlatform;
        const startPlatformPosition = startPlatform.position;
        const platformTopY = startPlatformPosition.y + startPlatform.getBoundingInfo().boundingBox.extendSize.y;
        const respawnYOffset = 3; // Small offset above the platform
        const respawnPosition = new Vector3(
             startPlatformPosition.x,
             platformTopY + respawnYOffset,
             startPlatformPosition.z
        );

        console.log(`Resetting player to: ${respawnPosition}`);

        // Temporarily disable physics updates if needed (optional)
        // const body = this.player.getPhysics()?.body;
        // if (body) body.setMotionType(PhysicsMotionType.STATIC);

        this.player.stopMovement(); // Ensure no residual velocity
        this.player.disposePhysics(); // Dispose old physics aggregate

        const transformNode = this.player.getCapsule();
        if (transformNode) {
             transformNode.position = respawnPosition; // Set position directly
             transformNode.rotationQuaternion = Quaternion.Identity(); // Reset rotation
        } else {
            console.error("Player capsule not found for reset!");
            return;
        }

        // Recreate physics at the new position
        this.player.recreatePhysics(respawnPosition);

        // Re-assign camera target AFTER physics recreation and position update
        if (this.followCamera && this.player.getCapsule()) {
            this.followCamera.lockedTarget = this.player.getCapsule();
            // Force camera update if needed (might not be necessary)
             this.scene.render(); // Force a render to potentially help camera update
        } else {
            console.warn("Could not re-lock camera target after reset.");
        }
         // Re-enable dynamic motion if disabled earlier (optional)
         // if (body) body.setMotionType(PhysicsMotionType.DYNAMIC);
    }

    // Updates the HUD elements (health, distance to end)
    private updateHUD() {
        if (!this.player || !this.hud || !this.platformData?.endPlatform) return;

        // Update health bar
        this.hud.hideHealthBar();

        // Calculate and update distance to the end platform
        const playerPos = this.player.getCapsulePosition();
        const endPlatformPos = this.platformData.endPlatform.position;
        const distanceToEnd = Vector3.Distance(playerPos, endPlatformPos);
        this.hud.updateDistance(distanceToEnd, "End Zone");
        this.hud.showDistance(); // Ensure distance is visible
        this.hud.hideCounter(); // Hide collectible counter if not needed
    }

    // Starts the main render loop observer for game logic
    private startUpdateLoop() {
         // Clear previous observer if exists
         if (this.updateObserver) {
             this.scene.onBeforeRenderObservable.remove(this.updateObserver);
         }
         // Add new observer
         this.updateObserver = this.scene.onBeforeRenderObservable.add(() => {
             if (!this.player) return; // Ensure player exists

             this.updateHUD(); // Update HUD elements

             // Update player light position
             if (this.playerLight) {
                  const capsulePos = this.player.getCapsulePosition();
                  if(capsulePos){ // Check if position is valid
                     this.playerLight.position = capsulePos.add(new Vector3(0, 5, 0)); // Offset light slightly above player
                  }
             }

             // Check for level completion
             if (this.platformData.endPlatform) {
                 const playerCapsule = this.player.getCapsule();
                 // Check intersection between player capsule and end platform
                 if (playerCapsule && playerCapsule.intersectsMesh(this.platformData.endPlatform, false)) {
                     console.log("🎉 Level 2 Complete!");
                     this.hud.updateMission("Level Complete!"); // Update mission status
                     // Stop this update loop once level is complete
                     if (this.updateObserver) {
                          this.scene.onBeforeRenderObservable.remove(this.updateObserver);
                          this.updateObserver = null; // Clear observer reference
                     }
                     // Optional: Add logic to transition to the next level or menu
                     // this.loadNextLevel();
                 }
             }
         });
    }

    // Cleans up resources specific to this level
    public disposeLevel() {
        console.log("🧹 Disposing Level 2...");

        // Remove observers
        if (this.updateObserver) {
             this.scene.onBeforeRenderObservable.remove(this.updateObserver);
             this.updateObserver = null;
        }
         if (this.fallDetectionObserver) {
             this.scene.onBeforeRenderObservable.remove(this.fallDetectionObserver);
             this.fallDetectionObserver = null;
         }

        // Dispose HUD elements
        this.hud?.removeDOMElements();

        // Dispose player resources
        this.player?.disposePhysics();
        this.player?.getRoot()?.dispose(false, true); // Dispose root and its children meshes
        this.player?.getCapsule()?.dispose(); // Dispose capsule mesh
        this.player = null; // Clear player reference

        // Dispose camera
        this.followCamera?.dispose();

        // Dispose platforms
        this.platformData?.platforms.forEach(p => {
            p.physicsBody?.dispose(); // Dispose physics body first
            p.dispose(); // Dispose mesh
        });
        this.platformData = { platforms: [], startPlatform: null!, endPlatform: null! }; // Reset platform data


        // Dispose lights
        this.playerLight?.dispose();
        this.globalLight?.dispose();

        // Dispose skybox
        this.skybox?.dispose();

        console.log("✅ Level 2 Disposed.");
        // Note: Assumes SceneUtils.clearScene is not used if transitioning levels cleanly
    }

    // Example placeholder for loading next level
    // private loadNextLevel() {
    //     console.log("Loading next level...");
    //     this.disposeLevel();
    //     // Example: new Level3(this.scene, this.canvas);
    // }
}