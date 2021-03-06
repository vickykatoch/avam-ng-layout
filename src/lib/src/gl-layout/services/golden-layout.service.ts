import { Injectable, Inject } from "@angular/core";
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import {
    GoldenLayoutConfiguration,
    LayoutItemConfig,
    ComponentConfiguration,
    ComponentInitCallbackFactory,
    LayoutConfigState
} from "../common/index";
import * as GoldenLayout from 'golden-layout';
// import { GoldenLayoutConfiguration } from "../common/config";

const ROOT_CONTENT_ID = '_rootContent';

@Injectable()
export class AvamGoldenContentLayoutService {
    private stateChangeNotifier = new BehaviorSubject<any>(null);
    layoutState$ = this.stateChangeNotifier.asObservable();
    private _goldenLayout: GoldenLayout;
    private _layoutHost: ComponentInitCallbackFactory;


    constructor( @Inject(GoldenLayoutConfiguration) public readonly config: GoldenLayoutConfiguration) {
        this.stateChangeNotifier.next(config.defaultLayout);
    }
    initialize(goldenLayout: GoldenLayout, layoutHost: ComponentInitCallbackFactory): void {
        this._goldenLayout = goldenLayout;
        this._layoutHost = layoutHost;
        this.config.components.forEach((compConfig: ComponentConfiguration) => {
            const initCB = layoutHost.createComponentInitCallback(compConfig.component);
            goldenLayout.registerComponent(compConfig.componentName, initCB);
        });
    }
    createComponent(itemConfig: LayoutItemConfig): void {
        this.createHostingContentItemIfNotExist();
        const cfg = {
            id: itemConfig.id,
            type: 'component',
            title: itemConfig.title,
            componentName: itemConfig.componentName,
            componentState: itemConfig
        };
        this._goldenLayout.root.contentItems[0].addChild(cfg);
    }
    saveLayout(): Promise<LayoutConfigState> {
        return new Promise<LayoutConfigState>((resolve, reject) => {
            try {
                const state = this._layoutHost.saveState();
                resolve(state);
            } catch (err) {
                reject(err);
            }
        });
    }
    restoreLayout(state: LayoutConfigState): void {
        this._goldenLayout.destroy();
        this.stateChangeNotifier.next(state.layout);
    }
    registerComponent(...compConfig: ComponentConfiguration[]): void {
        if (compConfig && compConfig.length > 0) {
            compConfig.forEach(config => {
                const initCB = this._layoutHost.createComponentInitCallback(config.component);
                this._goldenLayout.registerComponent(config.componentName, initCB);
            });
        }
    }
    private createHostingContentItemIfNotExist(): void {
        if (this._goldenLayout.root.contentItems.length === 0) {
            const contentItem = <GoldenLayout.ItemConfigType>{
                type: 'stack',
                id: ROOT_CONTENT_ID,
                contentItems: []
            };
            this._goldenLayout.root.addChild(contentItem);
        }
    }
}