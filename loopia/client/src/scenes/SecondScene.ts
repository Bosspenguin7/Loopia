
// You can write more code here

/* START OF COMPILED CODE */

class SecondScene extends Phaser.Scene {

	constructor() {
		super("SecondScene");

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	editorCreate(): void {

		// map1_ground
		const map1_ground = this.add.image(600, 428, "map1_ground");
		map1_ground.scaleX = 0.65;
		map1_ground.scaleY = 0.65;

		// map1_market
		const map1_market = this.add.image(280, 342, "map1_market");
		map1_market.scaleX = 0.65;
		map1_market.scaleY = 0.65;

		// map1_pangolin_team
		const map1_pangolin_team = this.add.image(723, 163, "map1_pangolin_team");
		map1_pangolin_team.scaleX = 0.65;
		map1_pangolin_team.scaleY = 0.65;

		// map1_avax_fdn
		const map1_avax_fdn = this.add.image(1067, 333, "map1_avax_fdn");
		map1_avax_fdn.scaleX = 0.65;
		map1_avax_fdn.scaleY = 0.65;

		// map1_avax_logo
		const map1_avax_logo = this.add.image(661, 410, "map1_avax_logo");
		map1_avax_logo.scaleX = 0.5;
		map1_avax_logo.scaleY = 0.5;

		// secondscene_exit_door
		const secondscene_exit_door = this.add.polygon(100, 588, "0 0 80 -40 80 30 0 70");
		secondscene_exit_door.name = "secondscene_exit_door";
		secondscene_exit_door.isFilled = true;
		secondscene_exit_door.fillAlpha = 0;

		// portal_scene1
		const portal_scene1 = this.add.polygon(909, 318, "104.44332768587904 82.22815478633481 72.33928731107832 61.60495299740421 14.118277107502365 30.663893208452322 53.48981335589807 8.309224462158845 92.95723721783 26.11905623997707 121.51836113771733 42.68707276822097 119.76187946887367 72.89933820207752");
		portal_scene1.name = "portal_scene1";
		portal_scene1.isFilled = true;
		portal_scene1.fillAlpha = 0;

		this.events.emit("scene-awake");
	}

	/* START-USER-CODE */

	// Write your code here

	create() {

		this.editorCreate();
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

export default SecondScene;

// You can write more code here
