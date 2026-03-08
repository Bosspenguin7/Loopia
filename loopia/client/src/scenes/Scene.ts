
// You can write more code here

/* START OF COMPILED CODE */

class Scene extends Phaser.Scene {

	constructor() {
		super("Scene");

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	editorCreate(): void {

		// ground_new
		const ground_new = this.add.image(581, 438, "ground_new");
		ground_new.scaleX = 0.7;
		ground_new.scaleY = 0.7;

		// houses1
		const houses1 = this.add.image(557, 347, "houses1");
		houses1.scaleX = 0.7;
		houses1.scaleY = 0.7;

		// l1_new
		const l1_new = this.add.image(1085, 316, "l1_new");
		l1_new.scaleX = 0.7;
		l1_new.scaleY = 0.7;

		// bushes_new
		const bushes_new = this.add.image(365, 404, "bushes_new");
		bushes_new.scaleX = 0.7;
		bushes_new.scaleY = 0.7;

		// pool
		const pool = this.add.image(228, 415, "pool");
		pool.scaleX = 0.9;
		pool.scaleY = 0.9;

		// tree
		const tree = this.add.image(90, 304, "tree");
		tree.scaleX = 0.6;
		tree.scaleY = 0.6;

		// lamp
		const lamp = this.add.image(369, 506, "lamp");
		lamp.scaleX = 0.3;
		lamp.scaleY = 0.3;

		// lamp_1
		const lamp_1 = this.add.image(441, 469, "lamp");
		lamp_1.scaleX = 0.3;
		lamp_1.scaleY = 0.3;

		// tree_1
		const tree_1 = this.add.image(326, 330, "tree");
		tree_1.scaleX = 0.6;
		tree_1.scaleY = 0.6;

		// door_bearsandsalmon
		const door_bearsandsalmon = this.add.polygon(471, 211, "69.32382023223956 103.67588816341916 36.20934729412321 85.41988164128848 34.41636182410631 63.53941056700076 36.30511603400477 34.9004121052313 71.313450637205 49.03192191262163 70.5221504076599 70.76449240892885");
		door_bearsandsalmon.name = "door_bearsandsalmon";
		door_bearsandsalmon.isFilled = true;

		// door_apartment
		const door_apartment = this.add.polygon(286, 165, "76.14128149623764 48.14616714764534 77.02529061194701 19.977134495249217 92.61259304926371 24.2865699841438 91.33385849661849 54.73014607472467");
		door_apartment.name = "door_apartment";
		door_apartment.isFilled = true;

		// door_cafe
		const door_cafe = this.add.polygon(554, 309, "44.63245426810921 27.405061147069276 44.71897002077471 -14.1522396954987 66.45564454289418 -4.383143324237476 65.46727428709008 38.961100172789216");
		door_cafe.name = "door_cafe";
		door_cafe.isFilled = true;

		// door_avalabs
		const door_avalabs = this.add.polygon(997, 395, "73.92654950728885 48.33856465103177 38.319828974594124 31.38631326502091 39.459055702255505 -36.6354435836238 88.62058472168695 -14.583966390622116 115.90585881960092 -0.08279634537441183 114.61195283371487 66.46179446389243");
		door_avalabs.name = "door_avalabs";
		door_avalabs.isFilled = true;
		door_avalabs.fillAlpha = 0;

		// cars
		const cars = this.add.image(790, 480, "cars");
		cars.scaleX = 0.7;
		cars.scaleY = 0.7;

		// border1
		const border1 = this.add.image(798, 401, "border1");
		border1.scaleX = 0.7;
		border1.scaleY = 0.7;

		// border2
		const border2 = this.add.image(601, 504, "border2");
		border2.scaleX = 0.7;
		border2.scaleY = 0.7;

		// kiosk
		const kiosk = this.add.image(514, 544, "kiosk");
		kiosk.scaleX = 0.7;
		kiosk.scaleY = 0.7;

		// wolfie
		const wolfie = this.add.image(354, 446, "wolfie");
		wolfie.scaleX = 0.7;
		wolfie.scaleY = 0.7;

		// billboard
		const billboard = this.add.image(605, 411, "billboard");
		billboard.scaleX = 0.7;
		billboard.scaleY = 0.7;

		// fireplug
		const fireplug = this.add.image(509, 371, "fireplug");
		fireplug.scaleX = 0.7;
		fireplug.scaleY = 0.7;

		// fireplug_1
		const fireplug_1 = this.add.image(751, 353, "fireplug");
		fireplug_1.scaleX = 0.7;
		fireplug_1.scaleY = 0.7;

		// fireplug_2
		const fireplug_2 = this.add.image(950, 450, "fireplug");
		fireplug_2.scaleX = 0.7;
		fireplug_2.scaleY = 0.7;

		// bench
		const bench = this.add.image(149, 290, "bench");
		bench.scaleX = 0.7;
		bench.scaleY = 0.7;

		// bench_1
		const bench_1 = this.add.image(29, 353, "bench");
		bench_1.scaleX = 0.7;
		bench_1.scaleY = 0.7;

		// tree_2
		const tree_2 = this.add.image(398, 361, "tree");
		tree_2.scaleX = 0.6;
		tree_2.scaleY = 0.6;

		// door_grotto
		const door_grotto = this.add.polygon(826, 283, "30.803106289522482 27.26481671382137 28.894636868431675 4.4177395366885435 29.97008958318122 -14.615391903569297 49.69094026931657 -21.510555426249205 49.367165060466846 5.053896010434812 49.06736356621616 20.32165138034611");
		door_grotto.name = "door_grotto";
		door_grotto.isFilled = true;
		door_grotto.fillAlpha = 0;

		// bank2
		const bank2 = this.add.image(250, 304, "bank2");
		bank2.scaleX = 0.7;
		bank2.scaleY = 0.7;

		// bank
		const bank = this.add.image(448, 407, "bank2");
		bank.scaleX = 0.7;
		bank.scaleY = 0.7;

		// tree_3
		const tree_3 = this.add.image(711, 447, "tree");
		tree_3.scaleX = 0.6;
		tree_3.scaleY = 0.6;

		// tree_4
		const tree_4 = this.add.image(918, 250, "tree");
		tree_4.scaleX = 0.6;
		tree_4.scaleY = 0.6;

		// tree_5
		const tree_5 = this.add.image(459, 576, "tree");
		tree_5.scaleX = 0.6;
		tree_5.scaleY = 0.6;

		// tree_6
		const tree_6 = this.add.image(934, 332, "tree");
		tree_6.scaleX = 0.6;
		tree_6.scaleY = 0.6;

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

export default Scene;

// You can write more code here
