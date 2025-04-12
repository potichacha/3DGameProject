import { HUD } from './components/HUD'; // Update the path to the correct location of the HUD module

export class Game {
    private hud: HUD;
    private currentMission: string;

    constructor(hud: HUD) {
        this.hud = hud;
        this.currentMission = '';
    }

    private setupDialogBox() {
        // Code pour configurer la boîte de dialogue
    }

    private startDialog(dialogLines: string[], onComplete: () => void) {
        // Code pour démarrer le dialogue
        dialogLines.forEach(line => {
            console.log(line); // Simule l'affichage des lignes de dialogue
        });
        onComplete();
    }

    private initMissions() {
        this.setupDialogBox();

        // Démarre le premier dialogue avec une histoire immersive
        this.startDialog(
            [
                "Où suis-je ?...", 
                "Tout semble si étrange autour de moi...", 
                "Ces murs... Ce lieu... C'est comme un labyrinthe sans fin.",
                "Attends... là-bas, je vois quelqu'un.",
                "Je devrais peut-être aller lui parler. Peut-être qu'il sait ce qui se passe ici."
            ],
            () => {
                // Début de la première mission
                this.currentMission = "Talk to the PNJ";
                this.hud.updateMission(this.currentMission);
            }
        );
    }
}