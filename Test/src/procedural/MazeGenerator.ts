import { Scene, MeshBuilder, StandardMaterial, Texture, Vector3, PhysicsAggregate, PhysicsShapeType, Color3 } from "@babylonjs/core";

export class MazeGenerator {
    static generate(scene: Scene) {
        const wallMaterial = new StandardMaterial("wallMaterial", scene);
        wallMaterial.diffuseTexture = new Texture("/assets/textures/walls/brick.jpg", scene);
        wallMaterial.specularColor = new Color3(0, 0, 0); // Évite la brillance excessive

        const mazeGrid = [
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

        const wallHeight = 15; // 📌 Murs encore plus hauts
        const cellSize = 20;  // 📌 Chaque case du labyrinthe fait 20x20 unités

        for (let z = 0; z < mazeGrid.length; z++) {
            for (let x = 0; x < mazeGrid[z].length; x++) {
                if (mazeGrid[z][x] === "1") {
                    const wall = MeshBuilder.CreateBox("wall", { width: cellSize, height: wallHeight, depth: cellSize }, scene);
                    wall.position = new Vector3(
                        x * cellSize - (mazeGrid[0].length * cellSize) / 2,
                        wallHeight / 2,
                        z * cellSize - (mazeGrid.length * cellSize) / 2
                    );
                    wall.material = wallMaterial;
                    wall.checkCollisions = true; // 📌 Empêche la caméra et le joueur de traverser les murs

                    // 📌 Ajouter la physique aux murs (évite que le joueur passe à travers)
                    new PhysicsAggregate(wall, PhysicsShapeType.BOX, { mass: 0 }, scene);
                }
            }
        }
    }
}