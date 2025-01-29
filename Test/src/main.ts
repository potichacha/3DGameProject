import { GameEngine } from "./core/GameEngine";
import { Level1 } from "./scenes/Level1";

// Récupérer l'élément canvas
const canvas = document.getElementById("gameCanvas");

if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
    console.error("L'élément avec l'ID 'gameCanvas' n'est pas un <canvas> ou n'existe pas.");
} else {
    // Initialiser le moteur de jeu et attendre que Havok soit chargé
    new GameEngine(canvas, (scene) => {
        console.log("🔄 Havok chargé, chargement du niveau 1...");
        new Level1(scene);
    });
}
