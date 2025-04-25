import { GameEngine } from "./core/GameEngine";
import { Menu } from "./scenes/Menu";

const canvas = document.getElementById("gameCanvas");

if (!(canvas instanceof HTMLCanvasElement)) {
    console.error("❌ ERREUR : 'gameCanvas' introuvable ou n'est pas un <canvas>.");
    throw new Error("gameCanvas is missing or not a <canvas>.");
}

// ✅ Maintenant TypeScript sait que c'est un `HTMLCanvasElement`
new GameEngine(canvas, (scene) => {
    console.log("🔄 Havok chargé, lancement du menu...");
    new Menu(scene, canvas); // Lance le Menu au démarrage
    //new Level1(scene, canvas); // Lance le Level1 au démarrage
});