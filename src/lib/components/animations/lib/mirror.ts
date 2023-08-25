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
        .addIndex([0, 1, 2, 0, 2, 3]);

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

varying vec2 vUvs;

uniform sampler2D noise;
uniform float time;

vec3 palette( float t ) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263,0.416,0.557);

    return a + b*cos( 6.28318*(c*t+d) );
}

//https://www.shadertoy.com/view/mtyGWy
void main( ) {
    vec2 uv = vec2(vUvs.x,1.-vUvs.y);
    vec2 uv0 = uv;
    vec3 finalColor = vec3(0.0);

    for (float i = 0.0; i < 4.0; i++) {
        uv = fract(uv * 1.5) - 0.5;

        float d = length(uv) * exp(-length(uv0));

        vec3 col = palette(length(uv0) + i*.4 + time*.4);

        d = sin(d*8. + time)/8.;
        d = abs(d);

        d = pow(0.01 / d, 1.2);

        finalColor += col * d;
    }

    gl_FragColor = vec4(finalColor, 1.0);
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
    quad.height = window.innerHeight;
    quad.width = window.innerWidth;

    // add it to the stage
    app.stage.addChild(quad);

    // start the animation..
    let time = 0;

    app.ticker.add((delta) => {
        time += 1 / 60;
        quad.shader.uniforms.time = time;
    });
});
