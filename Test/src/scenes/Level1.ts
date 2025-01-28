import { Scene, MeshBuilder, Vector3 } from "babylonjs";

export class Level1 {
    private player;

    constructor(private scene: Scene) {
        this.init();
    }

    private init() {
        // Ajouter un sol
        const ground = MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, this.scene);

        // Ajouter un cube représentant le joueur
        this.player = MeshBuilder.CreateBox("player", { size: 1 }, this.scene);
        this.player.position = new Vector3(0, 0.5, 0);

        // Ajouter des obstacles (exemple : murs d’un labyrinthe)
        const wall1 = MeshBuilder.CreateBox("wall1", { width: 1, height: 2, depth: 5 }, this.scene);
        wall1.position = new Vector3(2, 1, 0);

        // Initialiser les contrôles du joueur
        this.setupPlayerControls();
    }

    private setupPlayerControls() {
        window.addEventListener("keydown", (event) => {
            const step = 0.5; // Distance de déplacement par pression de touche
    
            switch (event.key) {
                case "ArrowUp":
                case "z":
                    this.player.position.z -= step; // Déplacement vers le haut
                    break;
                case "ArrowDown":
                case "s":
                    this.player.position.z += step; // Déplacement vers le bas
                    break;
                case "ArrowLeft":
                case "q":
                    this.player.position.x -= step; // Déplacement vers la gauche
                    break;
                case "ArrowRight":
                case "d":
                    this.player.position.x += step; // Déplacement vers la droite
                    break;
            }
        });
    }
    
}
