import { GameEngine } from "./core/GameEngine";
import { Level1 } from "./scenes/Level1";

// Récupérer l'élément canvas
const canvas = document.getElementById("gameCanvas");

if (canvas instanceof HTMLCanvasElement) {
    const engine = new GameEngine(canvas);

    // Charger le niveau 1
    new Level1(engine.getScene());
} else {
    console.error("L'élément avec l'ID 'gameCanvas' n'est pas un <canvas> ou n'existe pas.");
}
