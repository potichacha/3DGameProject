import { Scene, StandardMaterial, Texture, CubeTexture } from "babylonjs";

export class AssetLoader {
    // Charger la texture du sol
    static loadGroundTexture(scene: Scene) {
        const groundMaterial = new StandardMaterial("groundMaterial", scene);
        groundMaterial.diffuseTexture = new Texture("textures/cloud.jpg", scene);
        return groundMaterial;
    }

    // Charger le Skybox (effet ciel / rêve)
    static loadSkyboxTexture(scene: Scene) {
        const skyboxMaterial = new StandardMaterial("skyBoxMaterial", scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new CubeTexture("textures/nuage.avif", scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
        return skyboxMaterial;
    }
}
