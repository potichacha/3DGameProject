import { Scene, MeshBuilder, StandardMaterial, Vector3, Color3, Mesh, SceneLoader } from "@babylonjs/core";

export class PNJ {
    private scene: Scene;
    private mesh: Mesh | null = null;

    constructor(scene: Scene, position: Vector3) {
        this.scene = scene;

        SceneLoader.ImportMeshAsync("", "./src/assets/models/", "armor_cat.glb", this.scene).then((result) => {
            console.log("🔍 PNJ importés :", result.meshes);

            this.mesh = result.meshes[0] as Mesh;
            this.mesh.position = position;
            this.mesh.scaling = new Vector3(.1, .1, .1);

            this.mesh.checkCollisions = false;
        });
    }

    public getMesh(): Mesh | null {
        return this.mesh;
    }

    public getPosition(): Vector3 | null {
        return this.mesh?.position ?? null;
    }

    public enableInteraction(onInteract: () => void) {
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

        this.scene.onBeforeRenderObservable.add(() => {
            if (!this.mesh) return; // 🔐 Empêche les erreurs tant que le mesh n'est pas chargé

            const playerPos = this.scene.getMeshByName("playerCapsule")?.position;
            if (!playerPos) return;

            const distance = Vector3.Distance(playerPos, this.mesh.position);
            interactionHint.style.display = distance < 4 ? "block" : "none";
        });

        window.addEventListener("keydown", (event) => {
            if (event.key.toLowerCase() === "e" && this.mesh) {
                const playerPos = this.scene.getMeshByName("playerCapsule")?.position;
                if (!playerPos) return;

                const distance = Vector3.Distance(playerPos, this.mesh.position);
                if (distance < 4) {
                    console.log("🗨️ Interaction avec le PNJ réussie !");
                    interactionHint.style.display = "none";
                    if (onInteract) {
                        console.log("✅ Appel de la fonction onInteract.");
                        onInteract();
                    } else {
                        console.error("❌ La fonction onInteract n'est pas définie.");
                    }
                }
            }
        });
    }
}
