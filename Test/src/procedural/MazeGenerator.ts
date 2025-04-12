import { Scene, MeshBuilder, StandardMaterial, Texture, Vector3, PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core";

export class MazeGenerator {
    static mazeGrid: string[] = Array(51).fill(null).map(() => Array(51).fill("1").join(''));

    static readonly wallHeight = 50;
    static readonly cellSize = 20;

    /* Fisher-Yates shuffle */
    static shuffleArray(array: any[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            let temp: any = array[j];
            array[j] = array[i];
            array[i] = temp;
        }
    }

    private static carvePath(row: number, col: number, maze: string[], visited: boolean[][]) {
        if (row < 1 || row >= 50 || col < 1 || col >= 50 || visited[row][col]) {
            return; // Out of bounds or already visited
        }

        maze[row] = maze[row].substring(0, col) + "0" + maze[row].substring(col + 1);
        visited[row][col] = true;

        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        this.shuffleArray(directions);

        for (const [dx, dy] of directions) {
            const newRow = row + dx * 2;
            const newCol = col + dy * 2;

            if (newRow > 0 && newRow < 50 && newCol > 0 && newCol < 50 && !visited[newRow][newCol]) {
                maze[row + dx] = maze[row + dx].substring(0, col + dy) + '0' + maze[row + dx].substring(col + dy + 1);
                this.carvePath(newRow, newCol, maze, visited);
            }
        }
    }

    static generate() {
        const maze: string[] = Array(51).fill(null).map(() => Array(51).fill("1").join(''));
        const visited: boolean[][] = Array(51).fill(null).map(() => Array(51).fill(false));

        const startRow = 1;
        const startCol = 1;
        this.carvePath(startRow, startCol, maze, visited);

        this.mazeGrid = maze;
    }

    static deploy(scene: Scene) {
        const wallMaterial = new StandardMaterial("wallMaterial", scene);
        //wallMaterial.diffuseTexture = new Texture("./src/assets/textures/nuage.avif", scene);
        wallMaterial.diffuseTexture = new Texture("./src/assets/textures/Deepslate.webp", scene);
        wallMaterial.diffuseTexture.wrapU = Texture.WRAP_ADDRESSMODE;
        wallMaterial.diffuseTexture.wrapV = Texture.WRAP_ADDRESSMODE;
        

        MazeGenerator.generate();

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
        (material.diffuseTexture as Texture).uScale = 1;
        (material.diffuseTexture as Texture).vScale = 1;
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
