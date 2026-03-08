
// You can write more code here

/* START OF COMPILED CODE */

class bearsandsalmon extends Phaser.Scene {

	constructor() {
		super("bearsandsalmon");

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	editorCreate(): void {

		// bands_floor
		const bands_floor = this.add.image(592.5, 480, "bands_floor");
		bands_floor.scaleX = 0.6;
		bands_floor.scaleY = 0.6;

		// bands_wall
		const bands_wall = this.add.image(592.5, 232.5, "bands_wall");
		bands_wall.scaleX = 0.6;
		bands_wall.scaleY = 0.6;

		// bands_picture
		const bands_picture = this.add.image(304.5, 180, "bands_picture");
		bands_picture.scaleX = 0.675;
		bands_picture.scaleY = 0.675;

		// bands_picture2
		const bands_picture2 = this.add.image(934.5, 238.5, "bands_picture2");
		bands_picture2.scaleX = 0.75;
		bands_picture2.scaleY = 0.75;

		// bands_picture3
		const bands_picture3 = this.add.image(805.5, 178.5, "bands_picture3");
		bands_picture3.scaleX = 0.75;
		bands_picture3.scaleY = 0.75;

		// bands_plant
		const bands_plant = this.add.image(292.5, 321, "bands_plant");
		bands_plant.scaleX = 0.825;
		bands_plant.scaleY = 0.825;

		// bands_desk
		const bands_desk = this.add.image(771, 312, "bands_desk");
		bands_desk.scaleX = 0.675;
		bands_desk.scaleY = 0.675;

		// bands_desk2
		const bands_desk2 = this.add.image(457.5, 549, "bands_desk2");
		bands_desk2.scaleX = 0.825;
		bands_desk2.scaleY = 0.825;

		// bands_desk3
		const bands_desk3 = this.add.image(705, 552, "bands_desk3");
		bands_desk3.scaleX = 0.825;
		bands_desk3.scaleY = 0.825;

		// bands_sofa1
		const bands_sofa1 = this.add.image(877, 562, "bands_sofa1");
		bands_sofa1.scaleX = 0.75;
		bands_sofa1.scaleY = 0.75;

		// bands_sofa2
		const bands_sofa2 = this.add.image(334.5, 576, "bands_sofa2");
		bands_sofa2.scaleX = 0.75;
		bands_sofa2.scaleY = 0.75;

		// bands_plant_1
		const bands_plant_1 = this.add.image(367.5, 286.5, "bands_plant");
		bands_plant_1.scaleX = 0.825;
		bands_plant_1.scaleY = 0.825;

		// bearsandsalmon_inside_door
		const bearsandsalmon_inside_door = this.add.polygon(156, 445.5, "82.57898333011211 185.3407404068008 -17.644645343908074 133.17444301239607 50.37418436458999 87.76242441930522 155.7885332407447 141.51255351714255");
		bearsandsalmon_inside_door.name = "bearsandsalmon_inside_door";
		bearsandsalmon_inside_door.isFilled = true;
		bearsandsalmon_inside_door.fillAlpha = 0;

		// bands_sofa
		const bands_sofa = this.add.image(733, 635, "bands_sofa1");
		bands_sofa.scaleX = 0.75;
		bands_sofa.scaleY = 0.75;

		// bands_sofa_1
		const bands_sofa_1 = this.add.image(459, 637.5, "bands_sofa2");
		bands_sofa_1.scaleX = 0.75;
		bands_sofa_1.scaleY = 0.75;

		// bands_plant_2
		const bands_plant_2 = this.add.image(597, 694.5, "bands_plant");
		bands_plant_2.scaleX = 0.825;
		bands_plant_2.scaleY = 0.825;

		// npc_giga
		const npc_giga = this.add.polygon(539, 309, "178.1862716073749 28.520789521469304 175.37254321474978 -5.018310387723133 179.37254321474978 -51.51880994904786 207.90686419631254 -44.92308361561404 209.1862716073749 -0.9230836156140398 205.1862716073749 38.63502281972406");
		npc_giga.name = "npc_giga";
		npc_giga.isFilled = true;
		npc_giga.fillAlpha = 0;

		// npc_secretsmo
		const npc_secretsmo = this.add.polygon(674, 377, "178.1862716073749 28.520789521469304 175.37254321474978 -5.018310387723133 179.37254321474978 -51.51880994904786 207.90686419631254 -44.92308361561404 209.1862716073749 -0.9230836156140398 205.1862716073749 38.63502281972406");
		npc_secretsmo.name = "npc_secretsmo";
		npc_secretsmo.isFilled = true;
		npc_secretsmo.fillAlpha = 0;

		// obs_bears_left_wall
		const obs_bears_left_wall = this.add.polygon(290, 218, "0.24930837249962678 536.9761375313483 -1.1848928573002837 -9.311365332827194 74.52232974087735 -8.47351163327707 595.4494653722861 -10.20629372191388 595.2018340580323 238.84795571399786 179.09598914269958 447.40114341296595");
		obs_bears_left_wall.name = "obs_bears_left_wall";
		obs_bears_left_wall.isFilled = true;
		obs_bears_left_wall.fillAlpha = 0;

		// obs_bears_right_wall
		const obs_bears_right_wall = this.add.polygon(898, 187, "0.061716579801952776 254.78926300644108 2.5907715833209295 171.63424244146466 6.432332103005251 30.783056630370993 68.07896802760729 40.82481646652599 633.5294213911363 88.73343181608837 634.4689469744565 187.25242232418987 610.1863136508384 558.0990549412711");
		obs_bears_right_wall.name = "obs_bears_right_wall";
		obs_bears_right_wall.isFilled = true;
		obs_bears_right_wall.fillAlpha = 0;

		// obs_bears_desk
		const obs_bears_desk = this.add.polygon(824, 304, "42.32571545008943 188.3297787099824 -51.17319252936079 137.45631886902748 -52.61747295231427 82.19535174179936 81.47516292041257 15.901311969709184 418.9249023135756 132.54992922256082 419.05481487492193 240.1488122380846 275.14666725571556 308.17488096486653");
		obs_bears_desk.name = "obs_bears_desk";
		obs_bears_desk.isFilled = true;
		obs_bears_desk.fillAlpha = 0;

		// obs_bears_right_outside
		const obs_bears_right_outside = this.add.polygon(1193, 525, "58.085895943065026 448.0841707580301 -293.46024455884884 419.23538687776954 324.9718996191467 110.30327620964391 332.5274414111839 293.7229286054105 334.5131974643713 448.0841707580301");
		obs_bears_right_outside.name = "obs_bears_right_outside";
		obs_bears_right_outside.isFilled = true;
		obs_bears_right_outside.fillAlpha = 0;

		// obs_bears_left_outside
		const obs_bears_left_outside = this.add.polygon(305, 679, "10.323162778711549 221.15377073811993 0 50 3.1655330485546784 22.918837074141138 3.7898271099948033 -57.0397027161051 85.13157409092338 -18.03863003875972 62.85550067723577 -8.557370826567208 157.828107139301 43.393320395473154 183.7896150094088 33.00871724743007 430.7468541534067 157.69863622969353 591.255659465282 237.01474335011454 624.4541861837745 234.77637034766906 166.09220999935826 226.5681168274279");
		obs_bears_left_outside.name = "obs_bears_left_outside";
		obs_bears_left_outside.isFilled = true;
		obs_bears_left_outside.fillAlpha = 0;

		// obs_bears_plant2
		const obs_bears_plant2 = this.add.polygon(377, 309, "28.257663420575483 71.1174061452192 -9.68297378267635 52.249406331006526 -9.00532769263701 15.16946958810356 26.843871954367117 -2.315018873869178 62.22137160601592 12.336831338953694 64.05921704900456 54.31760924105225");
		obs_bears_plant2.name = "obs_bears_plant2";
		obs_bears_plant2.isFilled = true;
		obs_bears_plant2.fillAlpha = 0;

		// obs_bears_plant1
		const obs_bears_plant1 = this.add.polygon(301, 341, "28.257663420575483 71.1174061452192 -9.68297378267635 52.249406331006526 -9.00532769263701 15.16946958810356 26.843871954367117 -2.315018873869178 62.22137160601592 12.336831338953694 64.05921704900456 54.31760924105225");
		obs_bears_plant1.name = "obs_bears_plant1";
		obs_bears_plant1.isFilled = true;
		obs_bears_plant1.fillAlpha = 0;

		// obs_bears_plant3
		const obs_bears_plant3 = this.add.polygon(601, 714, "28.257663420575483 71.1174061452192 -9.68297378267635 52.249406331006526 -9.00532769263701 15.16946958810356 26.843871954367117 -2.315018873869178 62.22137160601592 12.336831338953694 64.05921704900456 54.31760924105225");
		obs_bears_plant3.name = "obs_bears_plant3";
		obs_bears_plant3.isFilled = true;
		obs_bears_plant3.fillAlpha = 0;

		// obs_bears_sofa1
		const obs_bears_sofa1 = this.add.polygon(326, 593, "51.71372749921592 79.31907436919894 8.109744831397705 57.46798197011562 8.95741640068293 -18.75271748709951 35.61686716026105 -7.982329282409964 109.22859827229873 32.90722362015899 132.84164583979333 61.492805556195066 139.11809709554905 89.46514853242527 108.97865930371002 105.29000679829318");
		obs_bears_sofa1.name = "obs_bears_sofa1";
		obs_bears_sofa1.isFilled = true;
		obs_bears_sofa1.fillAlpha = 0;

		// obs_bears_sofa2
		const obs_bears_sofa2 = this.add.polygon(450, 655, "51.71372749921592 79.31907436919894 8.109744831397705 57.46798197011562 8.95741640068293 -18.75271748709951 35.61686716026105 -7.982329282409964 109.22859827229873 32.90722362015899 132.84164583979333 61.492805556195066 139.11809709554905 89.46514853242527 108.97865930371002 105.29000679829318");
		obs_bears_sofa2.name = "obs_bears_sofa2";
		obs_bears_sofa2.isFilled = true;
		obs_bears_sofa2.fillAlpha = 0;

		// obs_bears_sofa3
		const obs_bears_sofa3 = this.add.polygon(738, 634, "-5.1686111869341005 108.53788766935203 -5.4222494878236915 78.39844987751304 20.949944259611414 48.25901208567406 131.40022455564514 0.8569173996553587 134.96632738674634 44.43794201547628 132.15371050044115 73.9421036193176 34.95402362176043 124.53954306135395");
		obs_bears_sofa3.name = "obs_bears_sofa3";
		obs_bears_sofa3.isFilled = true;
		obs_bears_sofa3.fillAlpha = 0;

		// obs_bears_sofa4
		const obs_bears_sofa4 = this.add.polygon(881, 562, "-5.1686111869341005 108.53788766935203 -5.4222494878236915 78.39844987751304 20.949944259611414 48.25901208567406 131.40022455564514 0.8569173996553587 134.96632738674634 44.43794201547628 132.15371050044115 73.9421036193176 34.95402362176043 124.53954306135395");
		obs_bears_sofa4.name = "obs_bears_sofa4";
		obs_bears_sofa4.isFilled = true;
		obs_bears_sofa4.fillAlpha = 0;

		// obs_bears_desk2
		const obs_bears_desk2 = this.add.polygon(455, 525, "1.4306021918987994 104.7927978288617 0 50 57.88318763794541 22.435338791867125 134.73875400713484 62.26798692330925 186.7292841980571 88.37145183319936 184.94810399308486 136.59455230014171 126.04373920304457 169.72338790270481");
		obs_bears_desk2.name = "obs_bears_desk2";
		obs_bears_desk2.isFilled = true;
		obs_bears_desk2.fillAlpha = 0;

		// obs_bears_desk3
		const obs_bears_desk3 = this.add.polygon(701, 525, "72.02438457190405 152.61644355192777 0.794668251024305 120.18635716639704 74.96527313825104 78.77334931636554 132.1238146876912 45.86053916443019 196.7230360050021 82.72309463347348 135.31720393476596 118.70810439055222");
		obs_bears_desk3.name = "obs_bears_desk3";
		obs_bears_desk3.isFilled = true;
		obs_bears_desk3.fillAlpha = 0;

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

export default bearsandsalmon;

// You can write more code here
