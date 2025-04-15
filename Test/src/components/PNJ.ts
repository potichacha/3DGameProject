import { Scene, MeshBuilder, StandardMaterial, Vector3, Color3, Mesh } from "@babylonjs/core";

export class PNJ {
    private scene: Scene;
    private mesh: Mesh;

    constructor(scene: Scene, position: Vector3) {
        this.scene = scene;

        this.mesh = MeshBuilder.CreateSphere("pnj", { diameter: 2 }, this.scene);
        this.mesh.position = position;

        const material = new StandardMaterial("pnjMat", this.scene);
        material.diffuseColor = new Color3(0, 0, 1);
        this.mesh.material = material;

        this.mesh.checkCollisions = false;
    }

    public getMesh(): Mesh {
        return this.mesh;
    }

    public getPosition(): Vector3 {
        console.log("PNJ Position:", this.mesh.position); // Log pour vérifier la position
        return this.mesh.position;
    }

    public enableInteraction(onInteract: () => void, isDialogActive: () => boolean) {
        const interactionHint = document.createElement("div");
        interactionHint.style.position = "absolute";
        interactionHint.style.bottom = "50px";
        interactionHint.style.left = "50%";
        interactionHint.style.transform = "translateX(-50%)";
        interactionHint.style.padding = "10px 20px";
        interactionHint.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        interactionHint.style.color = "white";
        interactionHint.style.fontFamily = "Arial, sans-serif";
        interactionHint.style.fontSize = "18px";
        interactionHint.style.borderRadius = "5px";
        interactionHint.style.display = "none";
        interactionHint.innerText = "Appuyez sur E pour parler";
        document.body.appendChild(interactionHint);

        const updateHintVisibility = () => {
            const playerPos = this.scene.getMeshByName("playerCapsule")?.position;
            if (!playerPos || isDialogActive()) {
                interactionHint.style.display = "none";
                return;
            }

            const distance = Vector3.Distance(playerPos, this.mesh.position);
            if (distance < 4) {
                interactionHint.style.display = "block";
            } else {
                interactionHint.style.display = "none";
            }
        };

        this.scene.onBeforeRenderObservable.add(updateHintVisibility);

        window.addEventListener("keydown", (event) => {
            if (event.key.toLowerCase() === "e" && interactionHint.style.display === "block") {
                const playerPos = this.scene.getMeshByName("playerCapsule")?.position;
                if (!playerPos) return;

                const distance = Vector3.Distance(playerPos, this.mesh.position);
                if (distance < 4) {
                    console.log("🗨️ Interaction avec le PNJ réussie !");
                    interactionHint.style.display = "none"; // Masquer le popup pendant le dialogue
                    onInteract();
                }
            }
        });
    }
}