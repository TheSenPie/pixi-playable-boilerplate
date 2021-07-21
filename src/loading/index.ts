import { IScene } from "../core/IScene";
import { StateBech } from "../core/StateBech";
import { App } from "../index";
import { Assets } from "./Assets";
import { Tween } from "@tweenjs/tween.js";
import * as PIXI from "pixi.js";
import { Config } from "../shared/Config";

class ProgressBar extends PIXI.Graphics{
	private readonly _rectWidth: number;
	private readonly _rectHeight: number;
	_progress: number; // number between 0...1

	constructor(screen_width, screen_height) {
		super();
		this.lineStyle(0, 0xFFFFFF, 1);
		this._rectWidth = screen_width * 0.8;
		this._rectHeight = screen_height * 0.08;
		this._progress = 0;
	}

	draw() {
		this.clear();
		this.beginFill(0xFFFFFF);
		this.drawRect(0, 0, this.progress * this._rectWidth, this._rectHeight);
		this.endFill();
	}

	get rectWidth () {
		return this._rectWidth;
	}

	get rectHeight () {
		return this._rectHeight;
	}

	get progress() : number {
		return this._progress;
	}

	set progress(progress : number) {
		if(progress < 0 || progress > 1) {
			throw new Error("progress should be number between 0..1");
		}
		this._progress = progress;
	}
}

export class Loading implements IScene {
	kind: "scene";

	stage: PIXI.Container = new PIXI.Container();
	loader: PIXI.Loader;
	app: App;
	gameState: StateBech<any>;

	progressBar: ProgressBar;
	logo: PIXI.Sprite;

	constructor(app: App) {
		this.app = app;
	}

	preload(loader?: PIXI.Loader): PIXI.Loader {
		this.loader = loader;
		
		loader.add( {
			url: Assets.BaseDir + Assets.Assets.logo.url,
			name: Assets.Assets.logo.name
		});

		return loader;
	}

	init(): void {
		let { width: screenWidth, height: screenHeight } = Config.ReferenceSize;

		// add logo to the middle of the screen
		this.logo = new PIXI.Sprite(this.loader.resources["logo"].texture);
		this.logo.scale.set((screenHeight * 0.5) / this.logo.texture.height);
		this.logo.x = screenWidth / 2  - this.logo.width / 2;
		// place it a bit up to leave place for a progress bar
		this.logo.y = screenHeight * 0.4 - this.logo.height / 2; 
		this.stage.addChild(this.logo);

		this.progressBar = new ProgressBar(screenWidth, screenHeight);
		this.progressBar.x = screenWidth / 2 - this.progressBar.rectWidth / 2;
		this.progressBar.y = screenHeight * 0.8 - this.progressBar.rectHeight / 2;
		this.progressBar.draw(); 
		this.stage.addChild(this.progressBar);

		this.loader.onLoad.add((loader, resource) => {
			this.progressBar.progress = loader.progress/100;
			this.progressBar.draw();
		});
	}

	start(): void {

	}

	resume(soft: boolean): void { }

	pause(soft: boolean): void { }

	stop(): void { }

	update(ticker: PIXI.Ticker): void { }
}
