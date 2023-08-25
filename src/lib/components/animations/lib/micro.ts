import * as PIXI from 'pixi.js';
import { pixiAnimation } from '..';

export default pixiAnimation((app: PIXI.Application) => {

    // Build geometry.
    const geometry = new PIXI.Geometry()
        .addAttribute('aVertexPosition', // the attribute name
            [-100, -100, // x, y
                100, -100, // x, y 
                100, 100,
            -100, 100], // x, y
            2) // the size of the attribute
        .addAttribute('aUvs', // the attribute name
            [0, 0, // u, v
                1, 0, // u, v
                1, 1,
                0, 1], // u, v
            2) // the size of the attribute
        .addIndex(
            [0, 1, 2, 0, 2, 3]
        );

    const vertexSrc = `

    precision mediump float;

    attribute vec2 aVertexPosition;
    attribute vec2 aUvs;

    uniform mat3 translationMatrix;
    uniform mat3 projectionMatrix;

    varying vec2 vUvs;
    uniform sampler2D iChannel0;

    void main() {

        vUvs = aUvs;
        gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);



    }`;

    const fragmentSrc = `
//Based on this: https://www.shadertoy.com/view/wtlSWX
precision mediump float;

// fragment coords
varying vec2 vUvs;
// time
uniform float time;
// resolution
uniform vec2 resolution;
// mouse    
uniform vec3 mouse;


float gyroid (vec3 seed) { return dot(sin(seed),cos(seed.yzx)); }

float fbm (vec3 seed)
{
    float result = 0., a = .5;
    for (int i = 0; i < 6; ++i) {
        a /= 2.;
        seed.x += time*.01/a;
        seed.z += result*.5;
        result += gyroid(seed/a)*a;
    }
    return result;
}

// round
float round (float x) { return floor(x+.5); }


void main()
{
    vec2 R = resolution.xy;
    vec2 p =vec2(vUvs.x,1.-vUvs.y);
    float count = 2.;
    float shades = 3.;
    float shape = abs(fbm(vec3(p*.5, 0.)))-time*.1-p.x*.1;
    float gradient = fract(shape*count+p.x);
    vec3 blue = vec3(.459,.765,1.);
    vec3 tint = mix(blue*mix(.6,.8,gradient), vec3(1), round(pow(gradient, 4.)*shades)/shades);
    vec3 color = mix(tint, blue*.2, mod(floor(shape*count), 2.));
    gl_FragColor = vec4(color,1.0);
}
`;


    const uniforms = {
        noise: PIXI.Texture.from('https://pixijs.com/assets/perlin.jpg'),
        time: 0,
    };
    // Make sure repeat wrap is used and no mipmapping.

    uniforms.noise.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
    uniforms.noise.baseTexture.mipmap = PIXI.MIPMAP_MODES.OFF;

    // Build the shader and the quad.
    const shader = PIXI.Shader.from(vertexSrc, fragmentSrc, uniforms);
    const quad = new PIXI.Mesh(geometry, shader);

    // make it fit the screen
    quad.position.set(app.screen.width / 2, app.screen.height / 2);
    quad.width = window.innerWidth;
    quad.height = window.innerHeight;
    // add it to the stage
    app.stage.addChild(quad);

    // start the animation..
    let time = 0;

    app.ticker.add((delta) => {
        time += 1 / 60;
        quad.shader.uniforms.time = time;
        quad.shader.uniforms.resolution = [window.innerWidth, window.innerHeight];
        quad.shader.uniforms.mouse = [window.innerWidth / 2, window.innerHeight / 2, 0];
    });
});
