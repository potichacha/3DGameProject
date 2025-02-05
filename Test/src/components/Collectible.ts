import { Scene, Vector3, MeshBuilder, StandardMaterial, Color3 } from "@babylonjs/core";
import { PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core";

export class Collectible {
    private scene: Scene;
    private mesh: any;
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

        // 📌 Ajout de la physique (sans gravité)
        new PhysicsAggregate(this.mesh, PhysicsShapeType.SPHERE, { mass: 0 }, this.scene);
    }

    checkCollision(playerMesh: any) {
        if (!this.mesh) return; // Evite une double suppression
    
        const distance = Vector3.Distance(this.mesh.position, playerMesh.position);
        if (distance < 1.5) {
            console.log("✅ Collectible ramassé !");
            this.mesh.dispose(); // Supprime l'objet
            this.mesh = null; // Empêche un double appel
            this.onCollect(); // Appelle la fonction pour mettre à jour le compteur
        }
    }
    
}