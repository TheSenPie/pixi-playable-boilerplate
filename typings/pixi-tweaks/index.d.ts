import { ILoaderResource } from "pixi.js";
import { Dict } from "@pixi/utils";

declare module PIXI {
	export interface Container {
        getChildByPath<T extends PIXI.DisplayObject>(query: string): T | undefined;
        addGlobalChild(...child: PIXI.DisplayObject[]): PIXI.DisplayObject[]; 
	}
}

declare module PIXI {
	export interface DisplayObject {
		replaceWithTransform(from:DisplayObject): void
	}
}

declare module PIXI {
	export interface Loader {
		filter(func: (v: ILoaderResource ) => boolean): ILoaderResource [];
		loadAsync() : Promise<Dict<ILoaderResource>>;
	}

}

declare module PIXI.utils {
	export interface EventEmitter {
		onceAsynce(event: string): Promise<any>;
	}
}
