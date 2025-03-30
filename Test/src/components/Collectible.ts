import { Scene, Vector3, MeshBuilder, StandardMaterial, Color3, AbstractMesh } from "@babylonjs/core";

export class Collectible {
    private scene: Scene;
    private mesh: AbstractMesh | null; // ✅ Inclure null dans le type
    private onCollect: () => void; // Fonction appelée quand on ramasse l'objet

    constructor(scene: Scene, position: Vector3, onCollect: () => void) {
        this.scene = scene;
        this.onCollect = onCollect;

        // 📌 Création du collectible (petite sphère brillante)
        this.mesh = MeshBuilder.CreateSphere("collectible", { diameter: 1 }, this.scene);
        this.mesh.position = position;

        // 📌 Matériau coloré pour le rendre visible
        const material = new StandardMaterial("collectibleMat", this.scene);
        material.diffuseColor = Color3.Yellow();
        this.mesh.material = material;

        // 📌 Désactiver les collisions physiques pour éviter les rebonds
        this.mesh.checkCollisions = false;
    }

    getPosition(): Vector3 {
        return this.mesh ? this.mesh.position : Vector3.Zero(); // Retourne la position ou un vecteur nul
    }

    checkCollision(playerCapsule: AbstractMesh) {
        if (!this.mesh) return; // Evite une double suppression

        // Vérifie si les bounding boxes se chevauchent
        if (this.mesh.intersectsMesh(playerCapsule, false)) {
            console.log("✅ Collectible ramassé !");
            this.mesh.dispose(); // Supprime l'objet
            this.mesh = null; // Empêche un double appel
            this.onCollect(); // Appelle la fonction pour mettre à jour le compteur
        }
    }
}