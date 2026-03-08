
// You can write more code here

/* START OF COMPILED CODE */

class avalabs extends Phaser.Scene {

	constructor() {
		super("avalabs");

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	editorCreate(): void {

		// avalabs_ground
		const avalabs_ground = this.add.image(600, 505, "avalabs_ground");
		avalabs_ground.scaleX = 0.72;
		avalabs_ground.scaleY = 0.72;

		// avalabs_wall
		const avalabs_wall = this.add.image(600, 270, "avalabs_wall");
		avalabs_wall.scaleX = 0.72;
		avalabs_wall.scaleY = 0.72;

		// avalabs_chair1
		const avalabs_chair1 = this.add.image(515, 367, "avalabs_chair1");
		avalabs_chair1.scaleX = 0.72;
		avalabs_chair1.scaleY = 0.72;

		// avalabs_chair2
		const avalabs_chair2 = this.add.image(627, 433, "avalabs_chair2");
		avalabs_chair2.scaleX = 0.72;
		avalabs_chair2.scaleY = 0.72;

		// avalabs_table
		const avalabs_table = this.add.image(571, 414, "avalabs_table");
		avalabs_table.scaleX = 0.72;
		avalabs_table.scaleY = 0.72;

		// npc_emin_hoca
		const npc_emin_hoca = this.add.image(737, 336, "npc_emin_hoca");
		npc_emin_hoca.scaleX = 0.9;
		npc_emin_hoca.scaleY = 0.9;

		// npc_avery
		const npc_avery = this.add.image(875, 388, "npc_avery");
		npc_avery.scaleX = 0.9;
		npc_avery.scaleY = 0.9;

		// npc_vohvoh
		const npc_vohvoh = this.add.image(1017, 452, "npc_vohvoh");
		npc_vohvoh.scaleX = 0.9;
		npc_vohvoh.scaleY = 0.9;

		// avalabs_inside_door
		const avalabs_inside_door = this.add.polygon(270, 455, "111.86431776949908 211.33873017838954 -9.926566457367372 146.36424125245608 63.01049809383511 102.4702977755341 181.31062021200273 161.48902571181077");
		avalabs_inside_door.name = "avalabs_inside_door";
		avalabs_inside_door.isFilled = true;
		avalabs_inside_door.fillAlpha = 0;

		// avalabs_desk
		const avalabs_desk = this.add.image(647, 348, "avalabs_desk");
		avalabs_desk.scaleX = 0.72;
		avalabs_desk.scaleY = 0.72;

		// obs_avalabs_left_outside
		const obs_avalabs_left_outside = this.add.polygon(486, 392, "-165.21063543154622 449.8271018084538 -170.92963994852784 -104.06281089818862 97.09978911485547 -117.50287818148541 469.5157160830946 -114.57679659418864 472.66821971501406 117.79081492497053 205.02902480327492 256.75073609505546");
		obs_avalabs_left_outside.name = "obs_avalabs_left_outside";
		obs_avalabs_left_outside.isFilled = true;
		obs_avalabs_left_outside.fillAlpha = 0;

		// obs_avalabs_right_outside
		const obs_avalabs_right_outside = this.add.polygon(1050, 299, "-181.87985577290897 240.75727046929828 -180.34573592834204 33.22955691388 -127.64227403265022 -37.041725613709104 138.38472410750853 -34.86249488853878 480.747944530294 -41.05619933935935 478.53748948397674 388.1818147169455 486.0497402391251 539.5703420177886 438.38247089678293 543.3151890478938 189.41562664507404 416.6594080368958 -136.728516679989 253.58733637436433");
		obs_avalabs_right_outside.name = "obs_avalabs_right_outside";
		obs_avalabs_right_outside.isFilled = true;
		obs_avalabs_right_outside.fillAlpha = 0;

		// obs_leftdown_outside 
		const obs_leftdown_outside_ = this.add.polygon(332, 632, "-21.857334544594835 247.25714818089517 -18.483696289755557 52.33389307478848 101.66634118438579 -7.949832932328476 180.17064481242562 30.45983151708588 154.0408586427411 41.28607141899806 206.67829704131856 74.14114060377833 267.3614654205652 103.6158223879838 303.7713664481132 88.0115790904633 487.5546763966888 186.83845330809353 609.4545897221747 244.05401206566896");
		obs_leftdown_outside_.name = "obs_leftdown_outside ";
		obs_leftdown_outside_.isFilled = true;
		obs_leftdown_outside_.fillAlpha = 0;

		// obs_rightdown_outside
		const obs_rightdown_outside = this.add.polygon(1048, 627, "50.09723295331233 255.7207024926911 -222.70345856176397 255.66781321652007 -37.338694219304784 241.5710660527382 31.29204665519569 216.07964801363804 145.02298867579657 155.29242038193755 431.3112220379984 12.619802005187182 533.2768941943992 55.2876265362369 538.4894098343118 267.30144771637833");
		obs_rightdown_outside.name = "obs_rightdown_outside";
		obs_rightdown_outside.isFilled = true;
		obs_rightdown_outside.fillAlpha = 0;

		// obs_ava_1
		const obs_ava_1 = this.add.polygon(466, 353, "51.41347357976769 63.96016685927778 67.97704777635472 50.59991008946557 95.68949455822252 35.88956387410568 120.09231603192993 61.07358483575685 80.36526734929241 83.09062286894488");
		obs_ava_1.name = "obs_ava_1";
		obs_ava_1.isFilled = true;
		obs_ava_1.fillAlpha = 0;

		// obs_ava_3
		const obs_ava_3 = this.add.polygon(578, 411, "47.33114117059371 62.60933521863885 67.97704777635472 50.59991008946557 84.82983695957915 40.18236517385484 114.75506961129062 63.660737980677226 80.7963209413158 79.69242950316344");
		obs_ava_3.name = "obs_ava_3";
		obs_ava_3.isFilled = true;
		obs_ava_3.fillAlpha = 0;

		// obs_ava_2
		const obs_ava_2 = this.add.polygon(524, 377, "47.09955361279259 63.34745096041924 62.90295502368629 54.64762295003363 78.93684714477213 46.423678469961274 106.72153589419165 63.812305766569175 78.29535198485237 77.71131712882519");
		obs_ava_2.name = "obs_ava_2";
		obs_ava_2.isFilled = true;
		obs_ava_2.fillAlpha = 0;

		// obs_ava_4
		const obs_ava_4 = this.add.polygon(654, 301, "27.85522221895951 128.56206751928337 -10.18260158757731 110.58947959695335 32.91123912190068 87.10641768656228 71.80308329428789 107.07308422682077 132.2064711752082 135.84545023390268 84.64877869653675 160.15286165168823");
		obs_ava_4.name = "obs_ava_4";
		obs_ava_4.isFilled = true;
		obs_ava_4.fillAlpha = 0;

		// obs_ava_5
		const obs_ava_5 = this.add.polygon(641, 283, "61.95936819037605 73.71750439566199 41.29704987550555 59.133062831016794 70.44785380923153 45.9853694642146 84.42461030868319 54.24204529249871 108.14220792916416 70.9004548167432 80.7976052113761 88.3232960327723");
		obs_ava_5.name = "obs_ava_5";
		obs_ava_5.isFilled = true;
		obs_ava_5.fillAlpha = 0;

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

export default avalabs;

// You can write more code here
