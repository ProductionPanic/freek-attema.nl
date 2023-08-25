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
#define MAXDIST 50.

struct Ray {
	vec3 ro;
    vec3 rd;
};

// from netgrind
vec3 hue(vec3 color, float shift) {

    const vec3  kRGBToYPrime = vec3 (0.299, 0.587, 0.114);
    const vec3  kRGBToI     = vec3 (0.596, -0.275, -0.321);
    const vec3  kRGBToQ     = vec3 (0.212, -0.523, 0.311);

    const vec3  kYIQToR   = vec3 (1.0, 0.956, 0.621);
    const vec3  kYIQToG   = vec3 (1.0, -0.272, -0.647);
    const vec3  kYIQToB   = vec3 (1.0, -1.107, 1.704);

    // Convert to YIQ
    float   YPrime  = dot (color, kRGBToYPrime);
    float   I      = dot (color, kRGBToI);
    float   Q      = dot (color, kRGBToQ);

    // Calculate the hue and chroma
    float   hue     = atan (Q, I);
    float   chroma  = sqrt (I * I + Q * Q);

    // Make the user's adjustments
    hue += shift;

    // Convert back to YIQ
    Q = chroma * sin (hue);
    I = chroma * cos (hue);

    // Convert back to RGB
    vec3    yIQ   = vec3 (YPrime, I, Q);
    color.r = dot (yIQ, kYIQToR);
    color.g = dot (yIQ, kYIQToG);
    color.b = dot (yIQ, kYIQToB);

    return color;
}

// ------

// by iq

float opU( float d1, float d2 )
{
    return min(d1,d2);
}

float smin( float a, float b, float k ){
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

float length6( vec3 p )
{
	p = p*p*p; p = p*p;
	return pow( p.x + p.y + p.z, 1.0/6.0 );
}

// ------

// from hg_sdf

float fPlane(vec3 p, vec3 n, float distanceFromOrigin) {
	return dot(p, n) + distanceFromOrigin;
}

void pR(inout vec2 p, float a) {
	p = cos(a)*p + sin(a)*vec2(p.y, -p.x);
}

// -------


float fractal(vec3 p)
{
    const int iterations = 20;

    float d = time*5. - p.z;
   	p=p.yxz;
    pR(p.yz, 1.570795);
    p.x += 6.5;

    p.yz = mod(abs(p.yz)-.0, 20.) - 10.;
    float scale = 1.25;

    p.xy /= (1.+d*d*0.0005);

	float l = 0.;

    for (int i=0; i<iterations; i++) {
		p.xy = abs(p.xy);
		p = p*scale + vec3(-3. + d*0.0095,-1.5,-.5);

		pR(p.xy,0.35-d*0.015);
		pR(p.yz,0.5+d*0.02);

        l =length6(p);
	}
	return l*pow(scale, -float(iterations))-.15;
}

vec2 map(vec3 pos)
{
    float dist = 10.;
    dist = opU(dist, fractal(pos));
    dist = smin(dist, fPlane(pos,vec3(0.0,1.0,0.0),10.), 4.6);
    return vec2(dist, 0.);
}

vec3 vmarch(Ray ray, float dist)
{
    vec3 p = ray.ro;
    vec2 r = vec2(0.);
    vec3 sum = vec3(0);
    vec3 c = hue(vec3(0.,0.,1.),5.5);
    for( int i=0; i<20; i++ )
    {
        r = map(p);
        if (r.x > .01) break;
        p += ray.rd*.015;
        vec3 col = c;
        col.rgb *= smoothstep(.0,0.15,-r.x);
        sum += abs(col)*.5;
    }
    return sum;
}

vec2 march(Ray ray)
{
    const int steps = 50;
    const float prec = 0.001;
    vec2 res = vec2(0.);

    for (int i = 0; i < steps; i++)
    {
        vec2 s = map(ray.ro + ray.rd * res.x);

        if (res.x > MAXDIST || s.x < prec)
        {
        	break;
        }

        res.x += s.x;
        res.y = s.y;

    }

    return res;
}

vec3 calcNormal(vec3 pos)
{
	const vec3 eps = vec3(0.005, 0.0, 0.0);

    return normalize(
        vec3(map(pos + eps).x - map(pos - eps).x,
             map(pos + eps.yxz).x - map(pos - eps.yxz).x,
             map(pos + eps.yzx).x - map(pos - eps.yzx).x )
    );
}

vec4 render(Ray ray)
{
    vec3 col = vec3(0.);
	vec2 res = march(ray);

    if (res.x > MAXDIST)
    {
        return vec4(col, 50.);
    }

    vec3 pos = ray.ro+res.x*ray.rd;
    ray.ro = pos;
   	col = vmarch(ray, res.x);

    col = mix(col, vec3(0.), clamp(res.x/50., 0., 1.));
   	return vec4(col, res.x);
}

mat3 camera(in vec3 ro, in vec3 rd, float rot)
{
	vec3 forward = normalize(rd - ro);
    vec3 worldUp = vec3(sin(rot), cos(rot), 0.0);
    vec3 x = normalize(cross(forward, worldUp));
    vec3 y = normalize(cross(x, forward));
    return mat3(x, y, forward);
}

void main()
{
    vec2 uv = vec2(vUvs.x,1.-vUvs.y);
    uv *=2.;
    uv-=1.;

    vec3 camPos = vec3(3., -1.5 + sin(time)*3., time*5.);
    vec3 camDir = camPos+vec3(-1.25,0.1, 1. - sin(time) *5. + sin(time)*3.) + time*0.5;
    mat3 cam = camera(camPos, camDir, 0.);
    vec3 rayDir = cam * normalize( vec3(uv, .8)) * 1.;

    Ray ray;
    ray.ro = camPos;
    ray.rd = rayDir;

    vec4 col = render(ray);

	gl_FragColor = vec4(1.-col.xyz,clamp(1.-col.w/MAXDIST, 0., 1.));
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
