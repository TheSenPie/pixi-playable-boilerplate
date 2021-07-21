import * as PIXI from 'pixi.js';

//allow inspect
//@ts-ignore

// @ifdef DEBUG
window.__PIXI_INSPECTOR_GLOBAL_HOOK__ && window.__PIXI_INSPECTOR_GLOBAL_HOOK__.register({ PIXI: PIXI });
// @endif

import { Application } from "./core/Application";
import { IScene } from "./core/IScene";
import { Config } from './shared/Config';
import { InlineLoader} from "./loader/InlineLoader";
import { Playable } from './playable/index';

import { scaleToWindow } from './utils/Responsive';

import  TWEEN from "@tweenjs/tween.js";

//how ignore it in DEBUG?
import Resources from "./inline/resources";
import { Loading } from './loading';

export class App extends Application {
	static instance: App;
	private _currentScene?: IScene;
	public lang: string;
	public games: {[key: string]: IScene};

	_init: boolean;
	constructor(parent: HTMLElement) {
		if(!parent)
			throw new Error("aprent element must be div!");
			
		const aspect = window.innerWidth / window.innerHeight;
		const size = { ...Config.ReferenceSize };

		//fallback
		PIXI.settings.PREFER_ENV = PIXI.ENV.WEBGL;

		super({
			autoStart: false,
			powerPreference: "low-power",
			backgroundColor: 0x000000,
			...size
		});

		parent.appendChild(this.view);
		

		this.ticker.add(this.update, this);

		if (Config.PausedInBackground) {
			window.addEventListener("blur", () => {
				this.pause();
			});

			window.addEventListener("focus", () => {
				this.resume();
			});
		}

    let backgroundColor = 0xcccccc;
		
		// make ad responsive to the screen
    scaleToWindow(this.view, backgroundColor);
    window.addEventListener("resize", e => {
      scaleToWindow(this.view, backgroundColor);
    });

		this.render();

		//@ts-ignore
		window.AppInstance = this;
		App.instance = this;
	}

 	async load() {
		
		// @ifdef DEBUG
		this.loader =  new PIXI.Loader(Config.BaseResDir);
		// @endif
		// @ifndef DEBUG
		this.loader = new InlineLoader(Resources);
		// @endif
	
		this._init = true;
		const loading = new Loading(this);
		const game = new Playable(this);

		const start = performance.now();

		await new Promise((resolve, _) => {
			loading.preload(this.loader).load(resolve);
		});
		
		this.start(loading);

		await new Promise((resolve, _) => {
			game.preload(this.loader).load(resolve);
		});

		console.log("loading:", performance.now() - start);
		
		this.stop();

		this.start(game);
	}

	start(game: IScene) {
		
		this._currentScene = game;
		this._currentScene.init();

		this.stage.addChildAt(this._currentScene.stage, 0);
		this._currentScene.start();
		this.resume();
		super.start();
	}

	stop() {
		if (this._currentScene) {
			this.stage.removeChild(this._currentScene.stage);
			this._currentScene.stop();
		}
		this._currentScene = undefined;
		super.render();
		super.stop();
	}

	pause() {
		this.ticker.stop();
		if (this._currentScene) {
			this._currentScene.pause(false);
		}
		
		this.update();
	}

	resume() {
		if (!this._currentScene) return;

		this._currentScene.resume(false);
		super.start();
	}

	private update() {
		TWEEN.update(this.ticker.lastTime);
		if (this._currentScene != null) {
			this._currentScene.update(this.ticker);
		}

		this.render();
	}
}

//@ts-ignore
window.App = App;