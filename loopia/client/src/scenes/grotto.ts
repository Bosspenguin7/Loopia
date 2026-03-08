
// You can write more code here

/* START OF COMPILED CODE */

class grotto extends Phaser.Scene {

	constructor() {
		super("grotto");

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	editorCreate(): void {

		// grotto_walls2
		const grotto_walls2 = this.add.image(518, 293, "grotto_walls2");
		grotto_walls2.scaleX = 0.6;
		grotto_walls2.scaleY = 0.6;

		// grotto_ground
		const grotto_ground = this.add.image(503, 510, "grotto_ground");
		grotto_ground.scaleX = 0.6;
		grotto_ground.scaleY = 0.6;

		// grotto_walls1
		const grotto_walls1 = this.add.image(793, 482, "grotto_walls1");
		grotto_walls1.scaleX = 0.6;
		grotto_walls1.scaleY = 0.6;

		// npc_wrath
		const npc_wrath = this.add.image(726, 321, "npc_wrath");
		npc_wrath.scaleX = 0.9;
		npc_wrath.scaleY = 0.9;

		// grotto_inside_door
		const grotto_inside_door = this.add.polygon(361, 449, "93.56382950153656 241.9140384954104 -22.851049402435592 189.00878211935398 55.41746249362684 144.447309861767 141.64102681622822 185.85675980082323");
		grotto_inside_door.name = "grotto_inside_door";
		grotto_inside_door.isFilled = true;
		grotto_inside_door.fillAlpha = 0;

		// portal_grotto_games
		const portal_grotto_games = this.add.polygon(747, 326, "41.662178329265195 115.1242042859732 46.21892904345463 54.31249159244655 55.48547573961104 -25.183581113796038 111.91162329931649 3.767803217462216 106.91228253022217 56.203246263476174 100.54153167661462 133.58174073199075");
		portal_grotto_games.name = "portal_grotto_games";
		portal_grotto_games.isFilled = true;
		portal_grotto_games.fillAlpha = 0;

		// obs_grotto_left_outside
		const obs_grotto_left_outside = this.add.polygon(605, 301, "-11.593297435998352 511.36694406234784 -12.549017700944432 4.173153089061145 171.25974471934495 5.940378841581264 1194.4972618797115 4.135914673521825 1192.1027946810418 462.6543412716125 1019.8474051688975 367.32216005305935 880.9915090214855 290.4744312691863 753.9317173594771 220.1550809218915 679.7876621588464 299.81532201447055 542.916527659621 389.8024214918618 223.5387421656544 613.9026017668875");
		obs_grotto_left_outside.name = "obs_grotto_left_outside";
		obs_grotto_left_outside.isFilled = true;
		obs_grotto_left_outside.fillAlpha = 0;

		// obs_grotto_leftbottom_outside
		const obs_grotto_leftbottom_outside = this.add.polygon(265, 732, "69.30507996946875 148.48916460726213 70.4132286668248 29.16944659504844 64.07053508559147 -101.51405408715942 332.32491132833326 -1.1032494244924749 732.8918616225751 162.24816647199796 215.3330840420903 153.6365308642051");
		obs_grotto_leftbottom_outside.name = "obs_grotto_leftbottom_outside";
		obs_grotto_leftbottom_outside.isFilled = true;
		obs_grotto_leftbottom_outside.fillAlpha = 0;

		// obs_grotto_right
		const obs_grotto_right = this.add.polygon(1245, 558, "-29.288933487029993 474.3595291000039 -290.9692147588345 479.6006941668196 -443.39498498707906 375.12180466549904 -253.908629877049 199.5188919984597 -34.823091216266505 35.62284017588962 82.30462939171923 -94.48137269130191 146.09678459138718 44.77443422938887 367.91051129588925 181.12239638572225 364.8825861877563 473.7939174974545");
		obs_grotto_right.name = "obs_grotto_right";
		obs_grotto_right.isFilled = true;
		obs_grotto_right.fillAlpha = 0;

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

export default grotto;

// You can write more code here
