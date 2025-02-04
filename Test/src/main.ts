import { GameEngine } from "./core/GameEngine";
import { Level1 } from "./scenes/Level1";

// ✅ Vérifier que le canvas existe
const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
if (!canvas) {
    console.error("❌ ERREUR : 'gameCanvas' introuvable.");
    throw new Error("gameCanvas is missing.");
}

// ✅ Initialiser le moteur de jeu et charger le niveau après la physique
new GameEngine(canvas, (scene) => {
    console.log("🔄 Havok chargé, lancement du niveau 1...");
    new Level1(scene);
});
