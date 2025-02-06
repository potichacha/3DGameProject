import { Scene, MeshBuilder, StandardMaterial, Texture, Vector3, PhysicsAggregate, PhysicsShapeType, Color3 } from "@babylonjs/core";

export class MazeGenerator {
    static mazeGrid: string[] = [
        "11111111111111111111111111111111111111111111111111",
        "10000000000000000000000000000000000000000000000001",
        "10111111111111101111111111111111101111111111111001",
        "10100000000000100000000000000000100000000000001001",
        "10101111111011101111111011111111101111111011101001",
        "10100000001000000000001000000000100000001000001001",
        "10101111101011111111101011111111101011101011101001",
        "10100000001000000000101000000000001000001000001001",
        "10111111101111111011101111111011111111011111111001",
        "10000000000000000000000000000000000000000000000001",
        "11111111111111111111111111111111111111111111111111"
    ];

    static readonly wallHeight = 15;
    static readonly cellSize = 20;

    static generate(scene: Scene) {
        const wallMaterial = new StandardMaterial("wallMaterial", scene);
        wallMaterial.diffuseTexture = new Texture("/assets/textures/walls/brick.jpg", scene);
        wallMaterial.specularColor = new Color3(0, 0, 0);

        for (let z = 0; z < this.mazeGrid.length; z++) {
            for (let x = 0; x < this.mazeGrid[z].length; x++) {
                if (this.mazeGrid[z][x] === "1") {
                    this.createWall(scene, x, z, wallMaterial);
                }
            }
        }
    }

    private static createWall(scene: Scene, x: number, z: number, material: StandardMaterial) {
        const wall = MeshBuilder.CreateBox("wall", { width: this.cellSize, height: this.wallHeight, depth: this.cellSize }, scene);
        wall.position = new Vector3(
            x * this.cellSize - (this.mazeGrid[0].length * this.cellSize) / 2,
            this.wallHeight / 2,
            z * this.cellSize - (this.mazeGrid.length * this.cellSize) / 2
        );
        wall.material = material;
        wall.checkCollisions = true;

        new PhysicsAggregate(wall, PhysicsShapeType.BOX, { mass: 0 }, scene);
    }

    // ✅ EXPORT de la fonction `isWallPosition`
    static isWallPosition(x: number, z: number): boolean {
        const gridX = Math.round((x + (this.mazeGrid[0].length * this.cellSize) / 2) / this.cellSize);
        const gridZ = Math.round((z + (this.mazeGrid.length * this.cellSize) / 2) / this.cellSize);

        return this.mazeGrid[gridZ] !== undefined && this.mazeGrid[gridZ][gridX] === "1";
    }
}

// ✅ Assure-toi que la fonction est bien exportée
export function isWallPosition(x: number, z: number): boolean {
    return MazeGenerator.isWallPosition(x, z);
}
