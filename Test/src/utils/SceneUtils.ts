import { Scene } from "@babylonjs/core";

export class SceneUtils {
    static clearScene(scene: Scene) {
        scene.meshes.slice().forEach(mesh => mesh.dispose());
        scene.lights.slice().forEach(light => light.dispose());
        scene.cameras.slice().forEach(cam => cam.dispose());
        scene.materials.slice().forEach(mat => mat.dispose());
        scene.textures.slice().forEach(tex => tex.dispose());
        scene.onBeforeRenderObservable.clear();
        scene.onKeyboardObservable.clear();
    }

    public static softClear(scene: Scene) {
        console.log("🧹 Nettoyage doux de la scène...");

        // Supprime tous les Meshes sauf ceux marqués comme "persistants"
        scene.meshes.forEach(mesh => {
            if (!mesh.metadata?.persistent) {
                mesh.dispose(false, true);
            }
        });

        // Supprime les textures
        scene.textures.forEach(tex => tex.dispose());

        // Supprime les matériaux
        scene.materials.forEach(mat => mat.dispose());

        // Supprime les lights
        scene.lights.forEach(light => light.dispose());

        // Supprime les observables personnalisés
        scene.onBeforeRenderObservable.clear();

        console.log("✅ Nettoyage terminé.");
    }
}
