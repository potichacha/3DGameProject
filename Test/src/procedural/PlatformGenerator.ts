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
        this.platformMaterial.diffuseColor = new Color3(0.6, 0.6, 0.6);
        this.platformMaterial.specularColor = new Color3(0.1, 0.1, 0.1);

        this.endPlatformMaterial = new StandardMaterial("endMat", this.scene);
        this.endPlatformMaterial.diffuseColor = new Color3(0, 1, 0);
        this.endPlatformMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
    }

    public generatePlatforms(
        count: number = 20,
        startPosition: Vector3 = new Vector3(0, 4, 0),
        minJumpDistance: number = 5,
        maxJumpDistance: number = 15,
        maxHeightChange: number = 3,
        minPlatformSize: Vector3 = new Vector3(3, 1, 3),
        maxPlatformSize: Vector3 = new Vector3(8, 1, 8)
    ): PlatformGenerationResult {

        const platforms: AbstractMesh[] = [];
        let currentPosition = startPosition.clone();
        let lastPlatformSize = new Vector3(10, 1, 10); // Start platform size

        const startPlatform = this.createPlatform("startPlatform", currentPosition, lastPlatformSize, this.platformMaterial);
        platforms.push(startPlatform);

        for (let i = 0; i < count; i++) {
            const jumpAngle = Math.random() * Math.PI * 0.8 + Math.PI * 0.1; // Bias forward
            const jumpDistance = minJumpDistance + Math.random() * (maxJumpDistance - minJumpDistance);
            const heightChange = (Math.random() * 2 - 1) * maxHeightChange;

            const nextX = currentPosition.x + Math.sin(jumpAngle) * jumpDistance;
            const nextZ = currentPosition.z + Math.cos(jumpAngle) * jumpDistance;
            const nextY = Math.max(0, currentPosition.y + heightChange); // Don't go too low

            const platformSize = new Vector3(
                minPlatformSize.x + Math.random() * (maxPlatformSize.x - minPlatformSize.x),
                minPlatformSize.y, // Keep height consistent for simplicity
                minPlatformSize.z + Math.random() * (maxPlatformSize.z - minPlatformSize.z)
            );

            currentPosition = new Vector3(nextX, nextY, nextZ);
            const newPlatform = this.createPlatform(`platform_${i}`, currentPosition, platformSize, this.platformMaterial);
            platforms.push(newPlatform);
            lastPlatformSize = platformSize;
        }

        const endPosition = currentPosition.add(new Vector3(0, 0, maxJumpDistance)); // Place end zone further
        const endPlatformSize = new Vector3(15, 1, 15);
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
        platform.checkCollisions = true;
        try {
            new PhysicsAggregate(platform, PhysicsShapeType.BOX, { mass: 0 }, this.scene);
        } catch (e) {
            console.error(`Failed physics for ${name}: ${e}`);
        }
        return platform;
    }
}