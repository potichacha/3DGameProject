export class HUD {
    private counterElement: HTMLElement | null = null;
    private missionElement: HTMLElement | null = null;
    private distanceElement: HTMLElement | null = null;
    private healthBarContainer: HTMLElement | null = null;
    private healthBar: HTMLElement | null = null;

    constructor() {
        this.createHUD();
    }

    private createHUD() {
        // Supprime les anciens éléments s'ils existent
        this.removeDOMElements();

        // Compteur
        this.counterElement = document.createElement("div");
        this.counterElement.style.position = "absolute";
        this.counterElement.style.top = "20px";
        this.counterElement.style.left = "50%";
        this.counterElement.style.transform = "translateX(-50%)";
        this.counterElement.style.fontSize = "24px";
        this.counterElement.style.color = "white";
        this.counterElement.style.fontFamily = "Arial, sans-serif";
        document.body.appendChild(this.counterElement);

        // Mission
        this.missionElement = document.createElement("div");
        this.missionElement.style.position = "absolute";
        this.missionElement.style.top = "20px";
        this.missionElement.style.right = "20px";
        this.missionElement.style.fontSize = "20px";
        this.missionElement.style.color = "white";
        this.missionElement.style.fontFamily = "Arial, sans-serif";
        this.missionElement.innerText = ""; // Initialisez avec une chaîne vide
        document.body.appendChild(this.missionElement);

        // Distance
        this.distanceElement = document.createElement("div");
        this.distanceElement.style.position = "absolute";
        this.distanceElement.style.top = "60px";
        this.distanceElement.style.right = "20px";
        this.distanceElement.style.fontSize = "20px";
        this.distanceElement.style.color = "white";
        this.distanceElement.style.fontFamily = "Arial, sans-serif";
        this.distanceElement.innerText = "Distance: 0m";
        document.body.appendChild(this.distanceElement);

        // Barre de vie
        this.healthBarContainer = document.createElement("div");
        this.healthBarContainer.style.position = "absolute";
        this.healthBarContainer.style.top = "20px";
        this.healthBarContainer.style.left = "20px";
        this.healthBarContainer.style.width = "200px";
        this.healthBarContainer.style.height = "20px";
        this.healthBarContainer.style.backgroundColor = "red";
        this.healthBarContainer.style.border = "2px solid black";
        document.body.appendChild(this.healthBarContainer);

        this.healthBar = document.createElement("div");
        this.healthBar.style.width = "100%";
        this.healthBar.style.height = "100%";
        this.healthBar.style.backgroundColor = "green";
        this.healthBarContainer.appendChild(this.healthBar);
    }

    update(current: number, total: number) {
        if (this.counterElement) {
            this.counterElement.innerText = `Collectibles : ${current}/${total}`;
        }
    }

    updateDistance(distance: number, label: string) {
        if (this.distanceElement) {
            this.distanceElement.innerText = `${label}: ${distance.toFixed(1)}m`;
        }
    }

    updatePlayerHealth(health: number) {
        if (this.healthBar) {
            this.healthBar.style.width = `${Math.max(0, Math.min(health, 100))}%`;
            const red = Math.min(255, Math.floor((100 - health) * 2.55));
            const green = Math.min(255, Math.floor(health * 2.55));
            this.healthBar.style.backgroundColor = `rgb(${red}, ${green}, 0)`;
        }
    }

    showDistance() {
        if (this.distanceElement) {
            this.distanceElement.style.display = "block";
        }
    }

    hideDistance() {
        if (this.distanceElement) {
            this.distanceElement.style.display = "none";
        }
    }

    hideHealthBar() {
        if (this.healthBarContainer) {
            this.healthBarContainer.style.display = "none";
        }
        if (this.healthBar) {
            this.healthBar.style.display = "none";
        }
    }

    showCounter() {
        if (this.counterElement) {
            this.counterElement.style.display = "block";
        }
    }

    hideCounter() {
        if (this.counterElement) {
            this.counterElement.style.display = "none";
        }
    }

    showCollectiblesHUD() {
        this.showCounter();
        this.showDistance();
    }

    hideCollectiblesHUD() {
        this.hideCounter();
    }

    updateMission(mission: string) {
        if (this.missionElement) {
            this.missionElement.innerText = `Mission: ${mission}`;
        }
    }

    getCurrentMissionText() {
        return this.missionElement ? this.missionElement.innerText : "";
    }

    resetHUD() {
        this.update(0, 0);
        this.updateDistance(0, "");
        this.updateMission("");
        this.hideCollectiblesHUD();
    }

    removeDOMElements() {
        this.counterElement?.remove();
        this.missionElement?.remove();
        this.distanceElement?.remove();
        this.healthBarContainer?.remove();
        this.counterElement = null;
        this.missionElement = null;
        this.distanceElement = null;
        this.healthBarContainer = null;
        this.healthBar = null;
    }
}