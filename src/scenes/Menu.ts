import { Scene } from "@babylonjs/core";
import { Level0 } from "./Level0";
import { Level1 } from "./Level1";
import { Music } from "../music/music";

export class Menu {
    private scene: Scene;
    private canvas: HTMLCanvasElement;
    private music: Music= new Music("./src/music/soundstrack/dream-day.mp3");

    constructor(scene: Scene, canvas: HTMLCanvasElement) {
        this.scene = scene;
        this.canvas = canvas;
        this.createMainMenu();
    }

    private createMainMenu() {
        const container = this.createContainer();

        const title = this.createTitle("🌙 Dreamweaver");
        container.appendChild(title);

        const newGameButton = this.createButton("Nouvelle Partie", () => {
            container.remove();
            this.createNewGameMenu();
        });

        const continueButton = this.createButton("Continuer Partie", () => {
            alert("🚧 Fonctionnalité en cours de développement !");
        });

        const optionsButton = this.createButton("Options", () => {
            alert("🚧 Fonctionnalité en cours de développement !");
        });

        container.appendChild(newGameButton);
        container.appendChild(continueButton);
        container.appendChild(optionsButton);

        document.body.appendChild(container);
        this.music.playMusic();
    }

    private createNewGameMenu() {
        const container = this.createContainer();

        const title = this.createTitle("Nouvelle Partie");
        container.appendChild(title);

        const fullGameButton = this.createButton("Jeu Complet", () => {
            container.remove();
            this.music.stopMusic();
            new Level0(this.scene, this.canvas); // Lance le niveau 0
        });

        const levelByLevelButton = this.createButton("Niveau par Niveau", () => {
            container.remove();
            this.createLevelSelectionMenu();
        });

        const backButton = this.createButton("Retour", () => {
            container.remove();
            this.createMainMenu();
        });

        container.appendChild(fullGameButton);
        container.appendChild(levelByLevelButton);
        container.appendChild(backButton);

        document.body.appendChild(container);
    }

    private createLevelSelectionMenu() {
        const container = this.createContainer();

        const title = this.createTitle("Choisissez un Niveau");
        container.appendChild(title);

        const level1Button = this.createButton("Niveau 1", () => {
            container.remove();
            this.music.stopMusic();
            new Level1(this.scene, this.canvas); // Lance le niveau 1
        });

        const level2Button = this.createButton("Niveau 2", () => {
            container.remove();
            this.music.stopMusic();
            import("./Level2").then(({ Level2 }) => {
                new Level2(this.scene, this.canvas); // Lance le niveau 2
            }).catch((error) => {
                console.error("❌ Erreur lors du chargement du niveau 2 :", error);
            });
        });

        const backButton = this.createButton("Retour", () => {
            container.remove();
            this.createNewGameMenu();
        });

        container.appendChild(level1Button);
        container.appendChild(level2Button);
        container.appendChild(backButton);

        document.body.appendChild(container);
    }

    private createContainer(): HTMLDivElement {
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
