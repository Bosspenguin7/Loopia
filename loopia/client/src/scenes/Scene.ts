
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
		door_bearsandsalmon.fillAlpha = 0;

		// door_apartment
		const door_apartment = this.add.polygon(286, 165, "76.14128149623764 48.14616714764534 77.02529061194701 19.977134495249217 92.61259304926371 24.2865699841438 91.33385849661849 54.73014607472467");
		door_apartment.name = "door_apartment";
		door_apartment.isFilled = true;
		door_apartment.fillAlpha = 0;

		// door_cafe
		const door_cafe = this.add.polygon(554, 309, "44.63245426810921 27.405061147069276 44.71897002077471 -14.1522396954987 66.45564454289418 -4.383143324237476 65.46727428709008 38.961100172789216");
		door_cafe.name = "door_cafe";
		door_cafe.isFilled = true;
		door_cafe.fillAlpha = 0;

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

		// portal_secondmap
		const portal_secondmap = this.add.polygon(366, 547, "64.48086224098071 76.39439245914298 27.6196133523676 55.317183429113015 76.52498168671215 28.09889076265638 151.18699997623253 65.78820007136048 99.86046311281675 93.33687161064358");
		portal_secondmap.name = "portal_secondmap";
		portal_secondmap.isFilled = true;
		portal_secondmap.fillAlpha = 0;

		// obs_top_main
		const obs_top_main = this.add.polygon(586, 190, "20.353527470918834 364.0845417140964 24.77587120109797 55.52640749275247 18.49733765552378 0.8313483072817007 1238.6601874537992 3.400450427235654 1229.5267018681566 384.12608604112245 936.1698036215896 244.09434066220203 714.9630409071578 361.1281511680932 664.8056935474903 335.40643457339183 595.3570587417965 300.68211717054504 372.86421019762975 188.7926499835941 227.44948551685457 258.8664339972097");
		obs_top_main.name = "obs_top_main";
		obs_top_main.isFilled = true;
		obs_top_main.fillAlpha = 0;

		// obs_tree
		const obs_tree = this.add.polygon(929, 313, "13.981034964365605 57.483667691033155 5.4499967429774845 53.567477802769176 15.131276262142517 47.149096358703346 19.606743290840583 49.40901939117887 25.486293266758736 51.9098691383775");
		obs_tree.name = "obs_tree";
		obs_tree.isFilled = true;
		obs_tree.fillAlpha = 0;

		// obs_tree_2
		const obs_tree_2 = this.add.polygon(707, 428, "13.981034964365605 57.483667691033155 5.4499967429774845 53.567477802769176 15.131276262142517 47.149096358703346 19.606743290840583 49.40901939117887 25.486293266758736 51.9098691383775");
		obs_tree_2.name = "obs_tree_2";
		obs_tree_2.isFilled = true;
		obs_tree_2.fillAlpha = 0;

		// obs_tree_3
		const obs_tree_3 = this.add.polygon(454, 556, "13.981034964365605 57.483667691033155 5.4499967429774845 53.567477802769176 15.131276262142517 47.149096358703346 19.606743290840583 49.40901939117887 25.486293266758736 51.9098691383775");
		obs_tree_3.name = "obs_tree_3";
		obs_tree_3.isFilled = true;
		obs_tree_3.fillAlpha = 0;

		// obs_tree_4
		const obs_tree_4 = this.add.polygon(393, 341, "13.981034964365605 57.483667691033155 5.4499967429774845 53.567477802769176 15.131276262142517 47.149096358703346 19.606743290840583 49.40901939117887 25.486293266758736 51.9098691383775");
		obs_tree_4.name = "obs_tree_4";
		obs_tree_4.isFilled = true;
		obs_tree_4.fillAlpha = 0;

		// obs_tree_5
		const obs_tree_5 = this.add.polygon(320, 311, "13.981034964365605 57.483667691033155 5.4499967429774845 53.567477802769176 15.131276262142517 47.149096358703346 19.606743290840583 49.40901939117887 25.486293266758736 51.9098691383775");
		obs_tree_5.name = "obs_tree_5";
		obs_tree_5.isFilled = true;
		obs_tree_5.fillAlpha = 0;

		// obs_tree_6
		const obs_tree_6 = this.add.polygon(913, 230, "13.981034964365605 57.483667691033155 5.4499967429774845 53.567477802769176 15.131276262142517 47.149096358703346 19.606743290840583 49.40901939117887 25.486293266758736 51.9098691383775");
		obs_tree_6.name = "obs_tree_6";
		obs_tree_6.isFilled = true;
		obs_tree_6.fillAlpha = 0;

		// obs_tree_7
		const obs_tree_7 = this.add.polygon(86, 284, "13.981034964365605 57.483667691033155 5.4499967429774845 53.567477802769176 15.131276262142517 47.149096358703346 19.606743290840583 49.40901939117887 25.486293266758736 51.9098691383775");
		obs_tree_7.name = "obs_tree_7";
		obs_tree_7.isFilled = true;
		obs_tree_7.fillAlpha = 0;

		// obs_border1
		const obs_border1 = this.add.polygon(780, 390, "27.9596466940842 50.67499877243007 16.85362229969764 41.63573721502317 57.91564525812629 14.27933921621145 66.99818559386165 18.460498268923196 66.17418050217901 32.55134844656524");
		obs_border1.name = "obs_border1";
		obs_border1.isFilled = true;
		obs_border1.fillAlpha = 0;

		// obs_border2
		const obs_border2 = this.add.polygon(588, 489, "24.788454983853665 53.3827563252034 12.49580466790534 47.493189099149106 13.81362702385415 30.97611861104377 66.09732609894651 14.745462091251401 64.39192117005142 25.103126707808407 40.029242200096164 35.839222525076856 32.596560480448815 40.79434367150848");
		obs_border2.name = "obs_border2";
		obs_border2.isFilled = true;
		obs_border2.fillAlpha = 0;

		// obs_car
		const obs_car = this.add.polygon(788, 484, "33.2890515509884 68.57815992422215 0.5552426202216338 43.709298885702026 0.8006957570190707 31.426941093812673 13.888128006145791 22.44651620684897 28.626957356413016 7.707686856581745 71.20579770162948 -8.569670148959503 121.48492812596656 18.92100695297784 107.80202215511719 47.579841800719684 76.68671574899741 69.68437320768439 73.411420337827 66.94051221863688");
		obs_car.name = "obs_car";
		obs_car.isFilled = true;
		obs_car.fillAlpha = 0;

		// obs_fireplug_1
		const obs_fireplug_1 = this.add.polygon(946, 413, "13.981034964365605 57.483667691033155 5.4499967429774845 53.567477802769176 15.131276262142517 47.149096358703346 19.606743290840583 49.40901939117887 25.486293266758736 51.9098691383775");
		obs_fireplug_1.name = "obs_fireplug_1";
		obs_fireplug_1.isFilled = true;
		obs_fireplug_1.fillAlpha = 0;

		// obs_fireplug_2
		const obs_fireplug_2 = this.add.polygon(747, 315, "13.981034964365605 57.483667691033155 5.4499967429774845 53.567477802769176 15.131276262142517 47.149096358703346 19.606743290840583 49.40901939117887 25.486293266758736 51.9098691383775");
		obs_fireplug_2.name = "obs_fireplug_2";
		obs_fireplug_2.isFilled = true;
		obs_fireplug_2.fillAlpha = 0;

		// obs_fireplug_3
		const obs_fireplug_3 = this.add.polygon(505, 333, "13.981034964365605 57.483667691033155 5.4499967429774845 53.567477802769176 15.131276262142517 47.149096358703346 19.606743290840583 49.40901939117887 25.486293266758736 51.9098691383775");
		obs_fireplug_3.name = "obs_fireplug_3";
		obs_fireplug_3.isFilled = true;
		obs_fireplug_3.fillAlpha = 0;

		// obs_bottom
		const obs_bottom = this.add.polygon(1211, 492, "139.70660303854345 439.26063645241 -669.8244483966799 441.64484743507376 -589.2856727353246 69.31359778497236 29.833059953762586 384.63724065914903 460.80616346226714 166.91817074728297 653.6680846087613 71.33555947581692 652.5073935659827 438.8942909569296");
		obs_bottom.name = "obs_bottom";
		obs_bottom.isFilled = true;
		obs_bottom.fillAlpha = 0;

		// obs_kiosk
		const obs_kiosk = this.add.polygon(539, 561, "49.29651129302023 71.65816323360184 -14.143424969755216 40.57007372120847 32.7320071405568 13.252365884239467 68.76194223728511 31.51071191105563 102.30677975340649 44.10476107622065");
		obs_kiosk.name = "obs_kiosk";
		obs_kiosk.isFilled = true;
		obs_kiosk.fillAlpha = 0;

		// obs_bilboard
		const obs_bilboard = this.add.polygon(549, 400, "74.64427817371467 42.89516781946422 56.9189714148788 36.760275252380346 62.71890798075009 32.02175325535279 81.70784949865276 38.79577624875841");
		obs_bilboard.name = "obs_bilboard";
		obs_bilboard.isFilled = true;
		obs_bilboard.fillAlpha = 0;

		// obs_bush1
		const obs_bush1 = this.add.polygon(317, 485, "29.79201044463686 94.13506906286045 13.570718684963737 85.778263657868 17.04609163678294 76.11519861018925 73.97357259431729 45.233581784138366 83.16031312835105 54.868209075062545 83.43623953563294 64.38048904879264");
		obs_bush1.name = "obs_bush1";
		obs_bush1.isFilled = true;
		obs_bush1.fillAlpha = 0;

		// obs_wolfie
		const obs_wolfie = this.add.polygon(350, 420, "13.191387509756652 72.44295596028832 2.4533565933435852 66.76435541975985 29.783458216937838 51.79713792225894 35.05639492795699 59.845831183797976 26.32552748077613 65.93004604864987");
		obs_wolfie.name = "obs_wolfie";
		obs_wolfie.isFilled = true;
		obs_wolfie.fillAlpha = 0;

		// obs_pool
		const obs_pool = this.add.polygon(255, 405, "89.78558733973033 129.39631026552155 -26.271888090006826 69.16039348729032 96.01085030013992 7.514959163566786 214.04280994407682 69.16039348729032");
		obs_pool.name = "obs_pool";
		obs_pool.isFilled = true;
		obs_pool.fillAlpha = 0;

		// obs_bush4
		const obs_bush4 = this.add.polygon(279, 279, "51.987623082681154 63.55564904168686 -7.742776109816873 33.963492929092524 7.894918250536847 22.021181269971635 116.95872583951834 74.15377218641918 160.84795156380264 96.73238236432711 160.70991727277917 112.20450686852847 149.19021820241798 113.57153256042");
		obs_bush4.name = "obs_bush4";
		obs_bush4.isFilled = true;
		obs_bush4.fillAlpha = 0;

		// obs_bush2
		const obs_bush2 = this.add.polygon(515, 430, "-19.265755164501954 127.42079574001365 -31.935760783124337 126.22278814902167 -31.935760783124337 111.65228168760588 68.3876009369705 65.47466894745503 28.81166641585986 45.20265995765914 -32.18236627850132 16.69514731575873 -35.61474530000564 7.758235614902119 -33.51266608896461 0.15623224372866673 -17.433854092111915 -1.131185026220379 97.9539701224324 59.705258651254 91.5967939984442 73.25707407589215 70.07468721972764 81.87776848384324");
		obs_bush2.name = "obs_bush2";
		obs_bush2.isFilled = true;
		obs_bush2.fillAlpha = 0;

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
