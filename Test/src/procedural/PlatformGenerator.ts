import {
    Scene,
    Vector3,
    MeshBuilder,
    StandardMaterial,
    Color3,
    PhysicsAggregate,
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

        this.platformMaterial = new StandardMaterial("platformMat", this.scene);
        this.platformMaterial.diffuseColor = new Color3(0.7, 0.7, 0.7);
        this.platformMaterial.specularColor = new Color3(0.2, 0.2, 0.2);

        this.endPlatformMaterial = new StandardMaterial("endMat", this.scene);
        this.endPlatformMaterial.diffuseColor = new Color3(0, 1, 0);
        this.endPlatformMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
    }

    public generatePlatforms(
        count: number = 25,
        startPosition: Vector3 = new Vector3(0, 10, 0),
        minJumpDistance: number = 8,
        maxJumpDistance: number = 18,
        maxHeightChange: number = 4,
        minPlatformSize: Vector3 = new Vector3(6, 1, 6),
        maxPlatformSize: Vector3 = new Vector3(12, 1, 12),
        startPlatformSize: Vector3 = new Vector3(20, 2, 20)
    ): PlatformGenerationResult {

        const platforms: AbstractMesh[] = [];
        let currentPosition = startPosition.clone();

        const startPlatform = this.createPlatform("startPlatform", currentPosition, startPlatformSize, this.platformMaterial);
        platforms.push(startPlatform);

        for (let i = 0; i < count; i++) {
            const jumpAngle = Math.random() * Math.PI * 0.9 + Math.PI * 0.05;
            const jumpDistance = minJumpDistance + Math.random() * (maxJumpDistance - minJumpDistance);
            const heightChange = (Math.random() * 2 - 1) * maxHeightChange;

            const nextX = currentPosition.x + Math.sin(jumpAngle) * jumpDistance;
            const nextZ = currentPosition.z + Math.cos(jumpAngle) * jumpDistance;
            const nextY = Math.max(1, currentPosition.y + heightChange); // Ensure platforms don't go below Y=1

            const platformSize = new Vector3(
                minPlatformSize.x + Math.random() * (maxPlatformSize.x - minPlatformSize.x),
                minPlatformSize.y,
                minPlatformSize.z + Math.random() * (maxPlatformSize.z - minPlatformSize.z)
            );

            currentPosition = new Vector3(nextX, nextY, nextZ);
            const newPlatform = this.createPlatform(`platform_${i}`, currentPosition, platformSize, this.platformMaterial);
            platforms.push(newPlatform);
        }

        const endPosition = currentPosition.add(new Vector3(Math.sin(Math.random()*Math.PI*2) * maxJumpDistance, Math.random()*maxHeightChange, Math.cos(Math.random()*Math.PI*2) * maxJumpDistance)); // Place end zone more randomly
        const endPlatformSize = new Vector3(15, 2, 15);
        const endPlatform = this.createPlatform("endPlatform", endPosition, endPlatformSize, this.endPlatformMaterial);
        platforms.push(endPlatform);

        return {
            platforms,
            startPlatform,
            endPlatform
        };
    }

    private createPlatform(name: string, position: Vector3, size: Vector3, material: StandardMaterial): AbstractMesh {
        const platform = MeshBuilder.CreateBox(name, { width: size.x, height: size.y, depth: size.z }, this.scene);
        platform.position = position;
        platform.material = material;
        platform.checkCollisions = true; // Still useful for raycasting/simple checks if needed

        try {
            // Ensure physics aggregate is created reliably
            const aggregate = new PhysicsAggregate(platform, PhysicsShapeType.BOX, { mass: 0, friction: 0.8, restitution: 0.1 }, this.scene);
            if (!aggregate.body) {
                 console.error(`Failed to create physics body for ${name}`);
            }
        } catch (e) {
            console.error(`Exception during physics aggregate creation for ${name}: ${e}`);
        }
        return platform;
    }
}