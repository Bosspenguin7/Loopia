
// You can write more code here

/* START OF COMPILED CODE */

class apartment extends Phaser.Scene {

	constructor() {
		super("ApartmentScene");

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	editorCreate(): void {

		// apt_ground
		const apt_ground = this.add.image(602, 517, "apt_ground");
		apt_ground.scaleX = 0.72;
		apt_ground.scaleY = 0.72;

		// apt_wall
		const apt_wall = this.add.image(600, 270, "apt_wall");
		apt_wall.scaleX = 0.72;
		apt_wall.scaleY = 0.72;

		// apt_sofa
		const apt_sofa = this.add.image(1040, 492, "apt_sofa");
		apt_sofa.scaleX = 0.72;
		apt_sofa.scaleY = 0.72;

		// apt_desk
		const apt_desk = this.add.image(981, 533, "apt_desk");
		apt_desk.scaleX = 0.72;
		apt_desk.scaleY = 0.72;

		// apartment_inside_door
		const apartment_inside_door = this.add.polygon(229, 455, "111.86431776949908 211.33873017838954 -9.926566457367372 146.36424125245608 63.01049809383511 102.4702977755341 181.31062021200273 161.48902571181077");
		apartment_inside_door.name = "apartment_inside_door";
		apartment_inside_door.isFilled = true;
		apartment_inside_door.fillAlpha = 0;

		// apt_bed
		const apt_bed = this.add.image(545, 290, "apt_bed");
		apt_bed.scaleX = 0.72;
		apt_bed.scaleY = 0.72;

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

export default apartment;

// You can write more code here
