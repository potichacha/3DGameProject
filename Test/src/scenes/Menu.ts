import { Scene } from "@babylonjs/core";
import { Level0 } from "./Level0";

export class Menu {
    private scene: Scene;
    private canvas: HTMLCanvasElement;

    constructor(scene: Scene, canvas: HTMLCanvasElement) {
        this.scene = scene;
        this.canvas = canvas;
        this.createMenuUI();
    }

    private createMenuUI() {
        const container = document.createElement("div");
        container.id = "mainMenu";
        Object.assign(container.style, {
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            background: "linear-gradient(145deg, #1e1e2f, #2b2b4a)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            color: "white",
            fontFamily: "Arial, sans-serif",
            zIndex: "1000"
        });

        const title = document.createElement("h1");
        title.textContent = "🌙 Dreamweaver";
        title.style.fontSize = "64px";
        title.style.marginBottom = "50px";
        container.appendChild(title);

        const createButton = (text: string, onClick: () => void) => {
            const btn = document.createElement("button");
            btn.textContent = text;
            Object.assign(btn.style, {
                padding: "15px 30px",
                fontSize: "20px",
                margin: "10px",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                backgroundColor: "#444",
                color: "white",
                transition: "0.3s",
            });
            btn.onmouseover = () => (btn.style.backgroundColor = "#666");
            btn.onmouseleave = () => (btn.style.backgroundColor = "#444");
            btn.onclick = onClick;
            return btn;
        };

        container.appendChild(createButton("Nouvelle Partie", () => {
            container.remove();
            new Level0(this.scene, this.canvas);
        }));

        container.appendChild(createButton("Continuer Partie", () => {
            alert("🚧 Fonctionnalité en cours de développement !");
        }));

        container.appendChild(createButton("Options", () => {
            alert("🚧 Fonctionnalité en cours de développement !");
        }));

        document.body.appendChild(container);
    }
}
