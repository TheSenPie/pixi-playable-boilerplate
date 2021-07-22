import { App } from "./../index";
import { StateBech } from "./StateBech";
import { Container, Loader, Ticker } from 'pixi.js';

export interface IScene {
	kind: "scene";

	stage: Container;
	loader: Loader;
	app: App;
	gameState: StateBech<any>;

	resume(soft: boolean): void;
	pause(soft: boolean): void;
	init(): void;
	start(): void;
	preload(loader?: Loader): Loader;
	stop(): void;
	update(ticker: Ticker): void;
}
