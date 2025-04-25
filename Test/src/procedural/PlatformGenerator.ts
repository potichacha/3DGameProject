import {
    Scene,
    Vector3,
    MeshBuilder,
    StandardMaterial,
    Color3,
    PhysicsAggregate,
    Texture,
    PhysicsShapeType,
    AbstractMesh
} from "@babylonjs/core";

export interface PlatformGenerationResult {
    platforms: AbstractMesh[];
    startPlatform: AbstractMesh;
    endPlatform: AbstractMesh;
}

export class PlatformGenerator {
    private scene: Scene;
    private platformMaterial: StandardMaterial;
    private endPlatformMaterial: StandardMaterial;

    constructor(scene: Scene) {
        this.scene = scene;

        // Standard material for regular platforms
        this.platformMaterial = new StandardMaterial("platformMat", this.scene);
        this.platformMaterial.diffuseTexture = new Texture("./public/textures/nuage2.jpg", this.scene);
        this.platformMaterial.specularColor = new Color3(0.2, 0.2, 0.2);

        // Distinct material for the end platform
        this.endPlatformMaterial = new StandardMaterial("endMat", this.scene);
        this.endPlatformMaterial.diffuseColor = new Color3(0.2, 0.8, 0.2); // Green
        this.endPlatformMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
    }

    /**
     * Generates a sequence of platforms for the player to traverse.
     * Modified for medium-sized platforms, easier vertical jumps, and required horizontal spacing.
     * @param count Number of intermediate platforms to generate.
     * @param startPosition The starting position for the first platform.
     * @param minJumpDistance Minimum horizontal distance between platform centers.
     * @param maxJumpDistance Maximum horizontal distance between platform centers.
     * @param maxHeightChange Maximum vertical distance change (positive or negative) between platforms.
     * @param minPlatformSize Minimum dimensions (width, height, depth) of intermediate platforms.
     * @param maxPlatformSize Maximum dimensions (width, height, depth) of intermediate platforms.
     * @param startPlatformSize Dimensions of the starting platform.
     * @param endPlatformSize Dimensions of the final (end) platform.
     * @returns An object containing the array of platforms, the start platform, and the end platform.
     */
    public generatePlatforms(
        count: number = 25, // Slightly increased count as jumps are shorter now
        startPosition: Vector3 = new Vector3(0, 10, 0),
        // *** Adjusted Jump Distances for smaller platforms ***
        minJumpDistance: number = 25,                   // Reduced min distance slightly (still guarantees gap for 12-18 size)
        maxJumpDistance: number = 35,                   // Reduced max distance slightly
        // *** Keep low height change ***
        maxHeightChange: number = 1.5,                  // Keep reduced max height change
        // *** Slightly Smaller Platform Sizes ***
        minPlatformSize: Vector3 = new Vector3(12, 2, 12),// Reduced min platform size
        maxPlatformSize: Vector3 = new Vector3(18, 2, 18),// Reduced max platform size
        startPlatformSize: Vector3 = new Vector3(30, 2, 30),// Reduced start platform size proportionally
        endPlatformSize: Vector3 = new Vector3(30, 2, 30)  // Reduced end platform size proportionally
    ): PlatformGenerationResult {

        const platforms: AbstractMesh[] = [];
        let currentPosition = startPosition.clone();
        let currentDirection = 0; // Start facing roughly forward (along Z axis)

        // Create the starting platform (using updated size)
        const startPlatform = this.createPlatform("startPlatform", currentPosition, startPlatformSize, this.platformMaterial);
        platforms.push(startPlatform);

        // Generate intermediate platforms
        for (let i = 0; i < count; i++) {
            // Limit the change in direction (remains the same)
            const angleChange = (Math.random() * Math.PI / 2) - (Math.PI / 4);
            currentDirection += angleChange;
            currentDirection = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, currentDirection));

            // Use the NEW adjusted jump distance range
            const jumpDistance = minJumpDistance + Math.random() * (maxJumpDistance - minJumpDistance);
            const heightChange = (Math.random() * 2 - 1) * maxHeightChange; // Keep low height change

            // Calculate next position based on current direction and distance (remains the same)
            const nextX = currentPosition.x + Math.sin(currentDirection) * jumpDistance;
            const nextZ = currentPosition.z + Math.cos(currentDirection) * jumpDistance;
            const nextY = Math.max(1, currentPosition.y + heightChange); // Ensure platforms don't go too low

            // Calculate platform size (using NEW smaller range)
            const platformSize = new Vector3(
                minPlatformSize.x + Math.random() * (maxPlatformSize.x - minPlatformSize.x),
                minPlatformSize.y, // Keep height consistent
                minPlatformSize.z + Math.random() * (maxPlatformSize.z - minPlatformSize.z)
            );

            currentPosition = new Vector3(nextX, nextY, nextZ);
            const newPlatform = this.createPlatform(`platform_${i}`, currentPosition, platformSize, this.platformMaterial);
            platforms.push(newPlatform);
        }

        // Generate the end platform (using updated size and distance range)
        const finalAngleChange = (Math.random() * Math.PI / 4) - (Math.PI / 8);
        const finalDirection = currentDirection + finalAngleChange;
        // Use the NEW adjusted jump distance range for final platform placement
        const finalDistance = minJumpDistance + Math.random() * (maxJumpDistance - minJumpDistance);
        const finalHeightChange = (Math.random() * 2 - 1) * maxHeightChange; // Keep low height change

        const endPosition = new Vector3(
            currentPosition.x + Math.sin(finalDirection) * finalDistance,
            Math.max(1, currentPosition.y + finalHeightChange),
            currentPosition.z + Math.cos(finalDirection) * finalDistance
        );

        // Use updated end platform size
        const endPlatform = this.createPlatform("endPlatform", endPosition, endPlatformSize, this.endPlatformMaterial);
        platforms.push(endPlatform);

        console.log(`Generated ${platforms.length} platforms. Start: ${startPlatform.position}, End: ${endPlatform.position}`);
        console.log(`Using Jump Distance Range: [${minJumpDistance}, ${maxJumpDistance}]`); // Log the distance range
        console.log(`Using Platform Size Range: [${minPlatformSize.x}x${minPlatformSize.z} - ${maxPlatformSize.x}x${maxPlatformSize.z}]`); // Log the size range


        return {
            platforms,
            startPlatform,
            endPlatform
        };
    }

    /**
     * Helper function to create a single platform mesh with physics.
     * (This function remains unchanged)
     * @param name The name for the platform mesh.
     * @param position The position of the platform.
     * @param size The dimensions (width, height, depth) of the platform.
     * @param material The material to apply to the platform.
     * @returns The created platform mesh.
     */
    private createPlatform(name: string, position: Vector3, size: Vector3, material: StandardMaterial): AbstractMesh {
        const platform = MeshBuilder.CreateBox(name, { width: size.x, height: size.y, depth: size.z }, this.scene);
        platform.position = position;
        platform.material = material;
        platform.checkCollisions = true; // Keep for raycasting if needed

        try {
            // Create physics aggregate for the platform (static body)
            const aggregate = new PhysicsAggregate(
                platform,
                PhysicsShapeType.BOX,
                { mass: 0, friction: 0.8, restitution: 0.1 }, // Static platforms have 0 mass
                this.scene
            );
            if (!aggregate.body) {
                 console.error(`Failed to create physics body for ${name}`);
            }
        } catch (e) {
            console.error(`Exception during physics aggregate creation for ${name}: ${e}`);
        }
        return platform;
    }
}