
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

		// obs_apartment_left_outside
		const obs_apartment_left_outside = this.add.polygon(353, 225, "-54.92553988267184 599.1433142307446 -56.46210365276896 48.94040374779867 98.40760116652137 47.212413056149444 525.0723236443832 50.717537954268806 523.295278143086 187.39940408394114 517.5029151788676 290.84714423035274 313.41629314963086 388.2095694186125");
		obs_apartment_left_outside.name = "obs_apartment_left_outside";
		obs_apartment_left_outside.isFilled = true;
		obs_apartment_left_outside.fillAlpha = 0;

		// obs_apartment_right_outside
		const obs_apartment_right_outside = this.add.polygon(951, 234, "-71.70554623617682 303.249834773979 -56.46210365276896 48.94040374779867 98.40760116652137 47.212413056149444 550.9835803762651 45.91144620167111 550.8521010089809 623.3981848696751 264.38188843583225 468.69017962215696");
		obs_apartment_right_outside.name = "obs_apartment_right_outside";
		obs_apartment_right_outside.isFilled = true;
		obs_apartment_right_outside.fillAlpha = 0;

		// obs_apartment_leftbottom_outside
		const obs_apartment_leftbottom_outside = this.add.polygon(807, 894, "-483.81481745458007 117.94909960952862 -472.86501121588924 -242.40273195575543 -309.98840377694034 -166.6324877311128 -334.84506684976304 -152.52881472765205 -201.83570811853457 -89.69819520639876 -174.97444751716802 -106.48648308225282 53.346267594448136 11.031532048726007 214.62942015282147 99.70497795741085");
		obs_apartment_leftbottom_outside.name = "obs_apartment_leftbottom_outside";
		obs_apartment_leftbottom_outside.isFilled = true;
		obs_apartment_leftbottom_outside.fillAlpha = 0;

		// obs_cafe_apartment_outside
		const obs_cafe_apartment_outside = this.add.polygon(1408, 913, "-524.5719684646942 55.52938666604658 -233.77300257691633 -87.28595559709014 101.99123235075504 -250.9011842632354 96.4745972859925 -16.702260493237674 102.88098956914558 50.37779275414454");
		obs_cafe_apartment_outside.name = "obs_cafe_apartment_outside";
		obs_cafe_apartment_outside.isFilled = true;
		obs_cafe_apartment_outside.fillAlpha = 0;

		// apt_tv
		this.add.image(204, 405, "apt_tv");

		// obs_bed
		const obs_bed = this.add.polygon(501, 315, "209.29404077059314 150.07306473600522 52.805546894861095 70.48400178793267 163.11729544217417 12.735453086052743 221.94327698900005 34.20253986263023 279.5667753409509 64.08139085993813 303.97998374018687 108.8996673559 263.7162336585468 122.7719910332215");
		obs_bed.name = "obs_bed";
		obs_bed.isFilled = true;
		obs_bed.fillAlpha = 0;

		// obs_tv
		const obs_tv = this.add.polygon(209, 442, "47.920178295237434 101.78789516144855 -2.6588195207865652 75.77457115524865 106.61077846852078 16.189916885804507 157.72563598246097 41.6273128726111 102.34237118319109 70.231573944357");
		obs_tv.name = "obs_tv";
		obs_tv.isFilled = true;
		obs_tv.fillAlpha = 0;

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
