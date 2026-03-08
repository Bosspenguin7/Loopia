
// You can write more code here

/* START OF COMPILED CODE */

class cafe extends Phaser.Scene {

	constructor() {
		super("CafeScene");

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	editorCreate(): void {

		// cafe_ground
		const cafe_ground = this.add.image(600, 490, "cafe_ground");
		cafe_ground.scaleX = 0.57;
		cafe_ground.scaleY = 0.57;

		// cafe_wall
		const cafe_wall = this.add.image(600, 255, "cafe_wall");
		cafe_wall.scaleX = 0.56;
		cafe_wall.scaleY = 0.56;

		// cafe_bar
		const cafe_bar = this.add.image(640, 209, "cafe_bar");
		cafe_bar.scaleX = 0.55;
		cafe_bar.scaleY = 0.55;

		// cafe_seats1
		const cafe_seats1 = this.add.image(222, 415, "cafe_seats1");
		cafe_seats1.scaleX = 0.55;
		cafe_seats1.scaleY = 0.55;

		// cafe_dj
		const cafe_dj = this.add.image(941, 438, "cafe_dj");
		cafe_dj.scaleX = 0.55;
		cafe_dj.scaleY = 0.55;

		// cafe_seats2
		const cafe_seats2 = this.add.image(386, 456, "cafe_seats2");
		cafe_seats2.scaleX = 0.55;
		cafe_seats2.scaleY = 0.55;

		// cafe_bistro
		const cafe_bistro = this.add.image(500, 620, "cafe_bistro");
		cafe_bistro.scaleX = 0.45;
		cafe_bistro.scaleY = 0.45;

		// cafe_bistro_1
		const cafe_bistro_1 = this.add.image(569, 653, "cafe_bistro");
		cafe_bistro_1.scaleX = 0.45;
		cafe_bistro_1.scaleY = 0.45;

		// cafe_bistro_2
		const cafe_bistro_2 = this.add.image(570, 581, "cafe_bistro");
		cafe_bistro_2.scaleX = 0.45;
		cafe_bistro_2.scaleY = 0.45;

		// cafe_bistro_3
		const cafe_bistro_3 = this.add.image(639, 616, "cafe_bistro");
		cafe_bistro_3.scaleX = 0.45;
		cafe_bistro_3.scaleY = 0.45;

		// npc_holly
		const npc_holly = this.add.image(621, 212, "npc_holly");
		npc_holly.scaleX = 0.7;
		npc_holly.scaleY = 0.7;
		npc_holly.setDepth(10); // Bring in front of the bar

		// npc_kahnwald
		const npc_kahnwald = this.add.image(675, 235, "npc_kahnwald");
		npc_kahnwald.scaleX = 0.7;
		npc_kahnwald.scaleY = 0.7;
		npc_kahnwald.setDepth(10); // Bring in front of the bar

		// cafe_inside_door
		const cafe_inside_door = this.add.polygon(234, 438, "79.82157671686744 230.58957460253998 -19.34380869350788 181.86805165378527 44.640189799687136 145.94827467621548 147.36088507749787 193.46529928101344");
		cafe_inside_door.name = "cafe_inside_door";
		cafe_inside_door.isFilled = true;
		cafe_inside_door.fillAlpha = 0;

		// obs_cafe_left_outside
		const obs_cafe_left_outside = this.add.polygon(359, 197, "-57.88280019884746 554.5546509849785 -56.46210365276896 48.94040374779867 98.40760116652137 47.212413056149444 550.9835803762651 45.91144620167111 547.6277234533106 249.70572790777888 540.3073092508643 250.37657590570055 281.66289515466156 385.07538173767796");
		obs_cafe_left_outside.name = "obs_cafe_left_outside";
		obs_cafe_left_outside.isFilled = true;
		obs_cafe_left_outside.fillAlpha = 0;

		// obs_cafe_right_outside
		const obs_cafe_right_outside = this.add.polygon(962, 204, "-56.74998488215124 242.54741638474576 -56.46210365276896 48.94040374779867 98.40760116652137 47.212413056149444 550.9835803762651 45.91144620167111 545.3572190126486 547.0730227046199 287.4182572211595 417.7468056440526");
		obs_cafe_right_outside.name = "obs_cafe_right_outside";
		obs_cafe_right_outside.isFilled = true;
		obs_cafe_right_outside.fillAlpha = 0;

		// obs_cafe_rightbottom_outside
		const obs_cafe_rightbottom_outside = this.add.polygon(1414, 892, "-524.5719684646942 55.52938666604658 -233.77300257691633 -87.28595559709014 101.99123235075504 -250.9011842632354 96.4745972859925 -16.702260493237674 102.88098956914558 50.37779275414454");
		obs_cafe_rightbottom_outside.name = "obs_cafe_rightbottom_outside";
		obs_cafe_rightbottom_outside.isFilled = true;
		obs_cafe_rightbottom_outside.fillAlpha = 0;

		// obs_cafe_leftbottom_outside
		const obs_cafe_leftbottom_outside = this.add.polygon(780, 882, "-487.39103406167214 57.506050264563925 -472.86501121588924 -242.40273195575543 -309.98840377694034 -166.6324877311128 -334.84506684976304 -152.52881472765205 -245.09069136896335 -109.30617510406643 -223.4581205663044 -121.20408904552886 46.94901446693325 13.999478471089844 121.81747071059885 50.77484883561016");
		obs_cafe_leftbottom_outside.name = "obs_cafe_leftbottom_outside";
		obs_cafe_leftbottom_outside.isFilled = true;
		obs_cafe_leftbottom_outside.fillAlpha = 0;

		// obs_cafe_bar
		const obs_cafe_bar = this.add.polygon(710, 288, "22.315266757117854 112.98304828096897 -65.25048064279463 67.09361102033134 -71.11660002846571 13.664902433860902 64.10280604241817 -6.660230114156789 273.6385541818728 55.89081728445851 285.7031012820436 67.95536438462923 285.8493978584621 115.3517994210143 246.856295101497 133.32387459143288 158.59700143673362 181.78373302763322");
		obs_cafe_bar.name = "obs_cafe_bar";
		obs_cafe_bar.isFilled = true;
		obs_cafe_bar.fillAlpha = 0;

		// obs_cafe_dc
		const obs_cafe_dc = this.add.polygon(916, 446, "141.31413701081595 89.85999766037281 18.32177512234135 31.260768888114903 51.8729313555138 -9.751333831407685 133.73950096381526 31.558968203609084 168.2096355357317 59.99682922544014 166.80070440457516 92.25958579639959");
		obs_cafe_dc.name = "obs_cafe_dc";
		obs_cafe_dc.isFilled = true;
		obs_cafe_dc.fillAlpha = 0;

		// obs_cafe_desk1
		const obs_cafe_desk1 = this.add.polygon(249, 468, "52.57706050726293 152.03260264278512 -24.992079225893406 115.13171823356095 232.85451960060394 -46.953697564572636 289.1124606193355 0.5910359064002364 301.5383747932318 29.2498560637859 223.40469135315143 64.92386034969246 130.9165320933937 111.16793997957132");
		obs_cafe_desk1.name = "obs_cafe_desk1";
		obs_cafe_desk1.isFilled = true;
		obs_cafe_desk1.fillAlpha = 0;

		// obs_cafe_desk2
		const obs_cafe_desk2 = this.add.polygon(413, 495, "48.777651785148265 107.6945644051101 -25.682339808433426 70.69930070120705 57.60056127126575 19.122625183313147 139.51864518705116 -21.381280961314502 213.18904597874985 20.85996769119471 177.8351683089508 43.321377797135895 111.77219740912386 76.89016942195565");
		obs_cafe_desk2.name = "obs_cafe_desk2";
		obs_cafe_desk2.isFilled = true;
		obs_cafe_desk2.fillAlpha = 0;

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

export default cafe;

// You can write more code here
