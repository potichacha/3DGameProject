import { GameEngine } from "./core/GameEngine";
import { Level1 } from "./scenes/Level1";

export class Game {
    private engine: GameEngine;

    constructor(canvas: HTMLCanvasElement) {
        this.engine = new GameEngine(canvas, (scene) => {
            console.log("🔄 Initialisation du niveau 1...");
            new Level1(scene, canvas); // Appelle et initialise Level1
        });
    }
}