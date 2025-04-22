import { Scene } from "@babylonjs/core";
import { Level0 } from "./Level0";
import { Level2 } from "./Level2";
import { Music } from "../music/music";

export class Menu {
    private scene: Scene;
    private canvas: HTMLCanvasElement;
    public music!: Music;

    constructor(scene: Scene, canvas: HTMLCanvasElement) {
        this.scene = scene;
        this.canvas = canvas;
        this.createMenuUI();
        this.music= new Music("./src/music/soundstrack/dream-day.mp3");
    }
    
    private createMenuUI() {
        const container = document.createElement("div");
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
        return container;
    }

    private createTitle(text: string): HTMLHeadingElement {
        const title = document.createElement("h1");
        title.textContent = text;
        title.style.fontSize = "64px";
        title.style.marginBottom = "50px";
        container.appendChild(title);
        window.addEventListener("click", () => {
            this.music.playMusic();
        }, { once: true });

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
            this.music.stopMusic();
            this.music.setVolume(0);
            new Level2(this.scene, this.canvas);
        }));

        container.appendChild(createButton("Continuer Partie", () => {
            alert("🚧 Fonctionnalité en cours de développement !");
        }));

        container.appendChild(createButton("Options", () => {
            alert("🚧 Fonctionnalité en cours de développement !");
        }));

        document.body.appendChild(container);
        return title;
    }

    private createButton(text: string, onClick: () => void): HTMLButtonElement {
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
    }
}
