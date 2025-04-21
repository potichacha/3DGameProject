import { GameEngine } from "./core/GameEngine";
import { Level1 } from "./scenes/Level1";
import { Level0 } from "./scenes/Level0";
import { Menu } from "./scenes/Menu";
import {Level2} from "./scenes/Level2";

const canvas = document.getElementById("gameCanvas");

if (!(canvas instanceof HTMLCanvasElement)) {
    console.error("❌ ERREUR : 'gameCanvas' introuvable ou n'est pas un <canvas>.");
    throw new Error("gameCanvas is missing or not a <canvas>.");
}

// ✅ Maintenant TypeScript sait que c'est un `HTMLCanvasElement`
new GameEngine(canvas, (scene) => {
    console.log("🔄 Havok chargé, lancement du menu...");
    //new Menu(scene, canvas); // Lance le Menu au démarrage
    new Level1(scene, canvas); // Lance le Level1 au démarrage
});