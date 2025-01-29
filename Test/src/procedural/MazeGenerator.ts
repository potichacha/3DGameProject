import { Scene, MeshBuilder, StandardMaterial, Texture, Vector3, PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core";

export class MazeGenerator {
    static generate(scene: Scene) {
        const wallMaterial = new StandardMaterial("wallMaterial", scene);
        wallMaterial.diffuseTexture = new Texture("/assets/textures/walls/brick.jpg", scene);

        const mazeGrid = [
            "1111111111",
            "1000000001",
            "1011111101",
            "1001000101",
            "1111010101",
            "1000010001",
            "1011111101",
            "1000000001",
            "1111111111"
        ];

        const wallHeight = 2;
        const cellSize = 2;

        for (let z = 0; z < mazeGrid.length; z++) {
            for (let x = 0; x < mazeGrid[z].length; x++) {
                if (mazeGrid[z][x] === "1") {
                    const wall = MeshBuilder.CreateBox("wall", { width: cellSize, height: wallHeight, depth: cellSize }, scene);
                    wall.position = new Vector3(x * cellSize - 9, wallHeight / 2, z * cellSize - 9);
                    wall.material = wallMaterial;

                    // Ajouter la physique aux murs
                    new PhysicsAggregate(wall, PhysicsShapeType.BOX, { mass: 0 }, scene);
                }
            }
        }
    }
}
