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
uniform vec2 iResolution;


void main()
{
    float value;
    vec2 uv = vec2(vUvs.x,1.-vUvs.y);
    uv *=2.;
    uv-=1.;
    float rot = radians(45.0); // radians(45.0*sin(time));
    mat2 m = mat2(cos(rot), -sin(rot), sin(rot), cos(rot));
    vec2 pos = 10.0*uv;
    vec2 rep = fract(pos);
    float dist = 2.0*min(min(rep.x, 1.0-rep.x), min(rep.y, 1.0-rep.y));
    float squareDist = length((floor(pos)+vec2(0.5)) - vec2(5.0) );

    float edge = sin(time-squareDist*0.5)*0.5+0.5;

    edge = (time-squareDist*0.5)*0.5;
    edge = 2.0*fract(edge*0.5);
    //value = 2.0*abs(dist-0.5);
    //value = pow(dist, 2.0);
    value = fract (dist*2.0);
    value = mix(value, 1.0-value, step(1.0, edge));
    //value *= 1.0-0.5*edge;
    edge = pow(abs(1.0-edge), 2.0);

    //edge = abs(1.0-edge);
    value = smoothstep( edge-0.05, edge, 0.95*value);


    value += squareDist*.1;
    //fragColor = vec4(value);
    gl_FragColor = mix(vec4(1.0,1.0,1.0,1.0),vec4(0.5,0.75,1.0,1.0), value);
    gl_FragColor.a = 0.25*clamp(value, 0.0, 1.0);
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
    });
});
