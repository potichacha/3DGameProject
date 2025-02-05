import { GameEngine } from "./core/GameEngine";
import { Level1 } from "./scenes/Level1";

const canvas = document.getElementById("gameCanvas");

if (!(canvas instanceof HTMLCanvasElement)) {
    console.error("❌ ERREUR : 'gameCanvas' introuvable ou n'est pas un <canvas>.");
    throw new Error("gameCanvas is missing or not a <canvas>.");
}

// ✅ Maintenant TypeScript sait que c'est un `HTMLCanvasElement`
new GameEngine(canvas, (scene) => {
    console.log("🔄 Havok chargé, lancement du niveau 1...");
    new Level1(scene);
});