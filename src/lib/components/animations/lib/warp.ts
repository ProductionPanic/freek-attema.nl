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

varying vec2 vUvs;

uniform sampler2D noise;
uniform float time;

vec4 doBallEffect() {
    vec2 uv = vec2(vUvs.x,1.-vUvs.y);

    // do distortion!
    float val = max(pow(sqrt(dot(uv,uv)-.05),.5), 0.2 );
    uv /= val;

    vec3 rayOrgin = vec3(0, 3.+sin(time)*2., mod(time,4.));
    vec3 rayDirection = normalize(vec3(uv.x, uv.y, 1));

    float d = 0.;
    vec4 sphere = vec4(2, 2, 2, 1);

    for(int i=0; i<100; i++) {
    	vec3 point = rayOrgin + rayDirection * d;
        vec3 spoint = mod(point, 4.);

        float sphereDist = length(spoint-sphere.xyz)-sphere.w;
        float planeDist = point.y;

        float surfaceDistance = min(sphereDist, planeDist);
        d += surfaceDistance;
        if(d > 40. || surfaceDistance<.1) break;
    }

    // color
    vec3 col = vec3(1.-(d/20.));
    col.r += abs(uv.y*.5);
    col.b += abs(uv.x*.2);
    return vec4(col.r, col.g, val ,1.0);

}

void main( )
{
    gl_FragColor = doBallEffect();
}
`;

    const uniforms = {
        noise: PIXI.Texture.from('https://pixijs.com/assets/perlin.jpg'),
        time: 0,
    };
    // Make sure repeat wrap is used and no mipmapping.

    uniforms.noise.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
    uniforms.noise.baseTexture.mipmap = PIXI.MIPMAP_MODES.ON;

    // Build the shader and the quad.
    const shader = PIXI.Shader.from(vertexSrc, fragmentSrc, uniforms);
    const quad = new PIXI.Mesh(geometry, shader);
    const bounds = quad.getBounds();
    console.log('bounds', bounds);

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
