export class HUD {
    private counterElement: HTMLElement;
    private missionElement: HTMLElement;
    private distanceElement: HTMLElement;
    private healthBarContainer: HTMLElement;
    private healthBar: HTMLElement;

    constructor() {
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
        this.missionElement.innerText = "Mission: Collect all items!";
        document.body.appendChild(this.missionElement);

        // Distance
        this.distanceElement = document.createElement("div");
        this.distanceElement.style.position = "absolute";
        this.distanceElement.style.top = "60px";
        this.distanceElement.style.right = "20px";
        this.distanceElement.style.fontSize = "20px";
        this.distanceElement.style.color = "white";
        this.distanceElement.style.fontFamily = "Arial, sans-serif";
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

        this.update(0, 3); // Valeur initiale
        this.updateDistance(0); // Distance initiale
    }

    update(current: number, total: number) {
        this.counterElement.innerText = `Collectibles : ${current}/${total}`;
    }

    updateDistance(distance: number) {
        this.distanceElement.innerText = `Distance: ${distance}m`;
    }

    updatePlayerHealth(health: number) {
        this.healthBar.style.width = `${health}%`;

        // Interpolation de couleur du vert (100%) au rouge (0%)
        const red = Math.min(255, Math.floor((100 - health) * 2.55)); // Augmente le rouge
        const green = Math.min(255, Math.floor(health * 2.55)); // Diminue le vert
        this.healthBar.style.backgroundColor = `rgb(${red}, ${green}, 0)`; // Couleur interpolée
    }

    hideCollectiblesHUD() {
        this.counterElement.style.display = "none";
        this.distanceElement.style.display = "none";
    }
}