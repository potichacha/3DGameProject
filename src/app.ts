import { GameEngine } from "./core/GameEngine";
import { Level0 } from "./scenes/Level0";
import { Level1 } from "./scenes/Level1";

export class Game {
    private engine: GameEngine;

    constructor(canvas: HTMLCanvasElement) {
        this.engine = new GameEngine(canvas, (scene) => {
            console.log("🔄 Initialisation du niveau 0...");
            const level0 = new Level0(scene, canvas);

            // Passe au Level1 une fois le Level0 terminé
            level0.onLevelComplete(() => {
                console.log("🔄 Passage au niveau 1...");
                level0.disposeLevel(); // Assurez-vous que Level0 est bien nettoyé
                setTimeout(() => {
                    new Level1(scene, canvas); // Ajout d'un délai pour éviter les conflits
                }, 500); // Délai de 500ms
            });
        });
    }
}