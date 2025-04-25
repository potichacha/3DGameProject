import { Scene, MeshBuilder, StandardMaterial, Texture, Vector3, PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core";

export class MazeGenerator {
    static mazeGrid: string[] = Array(41).fill(null).map(() => Array(41).fill("1").join(''));

    static readonly wallHeight = 50;
    static readonly cellSize = 16; // Réduction de 20 % (20 * 0.8 = 16)

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
        if (row < 1 || row >= 40 || col < 1 || col >= 40 || visited[row][col]) {
            return; // Out of bounds or already visited
        }

        maze[row] = maze[row].substring(0, col) + "0" + maze[row].substring(col + 1);
        visited[row][col] = true;

        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        this.shuffleArray(directions);

        for (const [dx, dy] of directions) {
            const newRow = row + dx * 2;
            const newCol = col + dy * 2;

            if (newRow > 0 && newRow < 40 && newCol > 0 && newCol < 40 && !visited[newRow][newCol]) {
                maze[row + dx] = maze[row + dx].substring(0, col + dy) + '0' + maze[row + dx].substring(col + dy + 1);
                this.carvePath(newRow, newCol, maze, visited);
            }
        }
    }

    private static clearArea(maze: string[], centerRow: number, centerCol: number, radius: number) {
        for (let dz = -radius; dz <= radius; dz++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const row = centerRow + dz;
                const col = centerCol + dx;
                if (row >= 0 && row < maze.length && col >= 0 && col < maze[0].length) {
                    maze[row] = maze[row].substring(0, col) + "0" + maze[row].substring(col + 1);
                }
            }
        }
    }

    static spawnZones: { playerStart: Vector3, collectibles: Vector3[] } = {
        playerStart: new Vector3(0, 0, 0),
        collectibles: []
    };

    static generate() {
        const mazeSize = 41; // Réduction de 20 % (51 * 0.8 = 40.8, arrondi à 41)
        const maze: string[] = Array(mazeSize).fill(null).map(() => Array(mazeSize).fill("1").join(''));
        const visited: boolean[][] = Array(mazeSize).fill(null).map(() => Array(mazeSize).fill(false));

        // 🔹 Réserver une zone de départ au centre du labyrinthe (3x3)
        const centerRow = Math.floor(mazeSize / 2);
        const centerCol = Math.floor(mazeSize / 2);
        this.clearArea(maze, centerRow, centerCol, 1); // 3x3 zone dégagée

        this.spawnZones.playerStart = new Vector3(
            centerCol * this.cellSize - (maze[0].length * this.cellSize) / 2,
            1,
            centerRow * this.cellSize - (maze.length * this.cellSize) / 2
        );

        // 🔹 Réserver 5 zones aléatoires pour les collectibles
        const collectibleZones: { row: number, col: number }[] = [];
        const minDistanceBetweenZones = 5; // Ajusté pour la taille réduite
        const minDistanceFromPlayerSpawn = 6; // Ajusté pour la taille réduite

        while (collectibleZones.length < 5) { // Augmenté à 5 collectibles
            const row = Math.floor(Math.random() * (mazeSize / 2)) * 2 + 1;
            const col = Math.floor(Math.random() * (mazeSize / 2)) * 2 + 1;

            const tooCloseToOtherZones = collectibleZones.some(z => 
                Math.abs(z.row - row) < minDistanceBetweenZones && Math.abs(z.col - col) < minDistanceBetweenZones
            );

            const tooCloseToPlayerSpawn = Math.abs(centerRow - row) < minDistanceFromPlayerSpawn &&
                                           Math.abs(centerCol - col) < minDistanceFromPlayerSpawn;

            if (!tooCloseToOtherZones && !tooCloseToPlayerSpawn) {
                this.clearArea(maze, row, col, 1); // Reserve a 3x3 area
                collectibleZones.push({ row, col });
            }
        }

        this.spawnZones.collectibles = collectibleZones.map(({ row, col }) =>
            new Vector3(
                col * this.cellSize - (maze[0].length * this.cellSize) / 2,
                1,
                row * this.cellSize - (maze.length * this.cellSize) / 2
            )
        );

        this.carvePath(centerRow, centerCol, maze, visited);

        // 🔹 Ajouter des murs autour du labyrinthe
        for (let i = 0; i < mazeSize; i++) {
            maze[0] = maze[0].substring(0, i) + "1" + maze[0].substring(i + 1);
            maze[mazeSize - 1] = maze[mazeSize - 1].substring(0, i) + "1" + maze[mazeSize - 1].substring(i + 1);
            maze[i] = "1" + maze[i].substring(1, maze[i].length - 1) + "1";
        }

        this.mazeGrid = maze;
    }

    static deploy(scene: Scene) {
        const wallMaterial = new StandardMaterial("wallMaterial", scene);
        wallMaterial.diffuseTexture = new Texture("./public/textures/nuagenoir.jpg", scene);
        //wallMaterial.diffuseTexture = new Texture("./public/textures/Deepslate.webp", scene);
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

    static getRandomEmptyPosition(): Vector3 {
        while (true) {
            const row = Math.floor(Math.random() * this.mazeGrid.length);
            const col = Math.floor(Math.random() * this.mazeGrid[0].length);

            if (this.mazeGrid[row][col] === "0") {
                return new Vector3(
                    col * this.cellSize - (this.mazeGrid[0].length * this.cellSize) / 2,
                    0,
                    row * this.cellSize - (this.mazeGrid.length * this.cellSize) / 2
                );
            }
        }
    }
}

// ✅ Assure-toi que la fonction est bien exportée
export function isWallPosition(x: number, z: number): boolean {
    return MazeGenerator.isWallPosition(x, z);
}
