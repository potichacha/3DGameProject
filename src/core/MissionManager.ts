import { HUD } from "../components/HUD";

export type MissionStep = {
    name: string;
    onStart: () => void;
    onComplete?: () => void;
};

export class MissionManager {
    private steps: MissionStep[] = [];
    private currentStepIndex: number = -1;
    private hud: HUD; // Ajout de la propriété HUD

    constructor(hud: HUD) { // Ajout du paramètre HUD
        this.hud = hud;
    }

    public addMissionStep(step: MissionStep) {
        this.steps.push(step);
    }

    public start() {
        this.advance();
    }

    public advance() {
        this.currentStepIndex++;
        const step = this.steps[this.currentStepIndex];
        if (step) {
            step.onStart();
        }
    }

    public completeCurrent() {
        const step = this.steps[this.currentStepIndex];
        if (step?.onComplete) step.onComplete();
        this.advance();
    }

    public getCurrentName(): string {
        return this.steps[this.currentStepIndex]?.name || "";
    }

    public setMission(missionName: string) {
        console.log(`🎯 Nouvelle mission : ${missionName}`);
        this.hud.updateMission(missionName);
    }

    public clearMission() {
        console.log("🗑️ Mission effacée.");
        this.hud.updateMission(""); // Efface la mission affichée dans le HUD
    }
}