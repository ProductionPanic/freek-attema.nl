import * as Pixi from 'pixi.js';

export function pixiAnimation(cb: (app: Pixi.Application) => void): Function {
    return (container: HTMLElement,) => {

        const app = new Pixi.Application({ resizeTo: window });

        container.addEventListener('destroy', () => {
            app.destroy(true, { children: true, texture: true, baseTexture: true });
        });

        document.body.appendChild(app.view as HTMLCanvasElement);

        cb(app);

        return {
            stop: () => {
                app.destroy(true, { children: true, texture: true, baseTexture: true });
            }
        }
    }
}

export function randomAnimation(): Promise<{
    default: (container: HTMLElement) => {
        stop: () => void;
    }
}> {
    const animations = [
        // 'terrain',
        // 'terrain2',
        'terrain3',
    ]

    const animation = animations[Math.floor(Math.random() * animations.length)];

    return import(`./${animation}`)
}