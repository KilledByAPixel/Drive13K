'use strict';

///////////////////////////////////////////////////////////////////////////////
// Math Stuff

const PI = Math.PI;
const abs = (value) => Math.abs(value);
const min = (valueA, valueB) => Math.min(valueA, valueB);
const max = (valueA, valueB) => Math.max(valueA, valueB);
const sign = (value) => value < 0 ? -1 : 1;
const mod = (dividend, divisor=1) => ((dividend % divisor) + divisor) % divisor;
const clamp = (value, min=0, max=1) => value < min ? min : value > max ? max : value;
const clampAngle = (value) => ((value+PI) % (2*PI) + 2*PI) % (2*PI) - PI;
const percent = (value, valueA, valueB) => (valueB-=valueA) ? clamp((value-valueA)/valueB) : 0;
const lerp = (percent, valueA, valueB) => valueA + clamp(percent) * (valueB-valueA);
const rand = (valueA=1, valueB=0) => lerp(Math.random(), valueA, valueB);
const randInt = (valueA, valueB=0) => rand(valueA, valueB)|0;
const smoothStep = (p) => p * p * (3 - 2 * p);
const isOverlapping = (posA, sizeA, posB, sizeB=vec3()) =>
    abs(posA.x - posB.x)*2 < sizeA.x + sizeB.x && abs(posA.y - posB.y)*2 < sizeA.y + sizeB.y;
function buildMatrix(pos, rot, scale)
{
    const R2D = 180/PI;
    let m = new DOMMatrix;
    pos && m.translateSelf(pos.x, pos.y, pos.z);
    rot && m.rotateSelf(rot.x*R2D, rot.y*R2D, rot.z*R2D);
    scale && m.scaleSelf(scale.x, scale.y, scale.z);
    return m;
}
function shuffle(array)
{
    for(let currentIndex = array.length; currentIndex;)
    {
        const randomIndex = random.int(currentIndex--);
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}
function formatTimeString(t)
{
    const timeS = t%60|0;
    const timeM = t/60|0;
    const timeMS = t%1*1e3|0;
    return `${timeM}:${timeS<10?'0'+timeS:timeS}.${(timeMS<10?'00':timeMS<100?'0':'')+timeMS}`;
}

function noise1D(x)
{
    const hash = x=>(new Random(x)).float(-1,1);
    return lerp(smoothStep(mod(x,1)), hash(x), hash(x+1));
}

///////////////////////////////////////////////////////////////////////////////
// Vector3

const vec3 = (x, y, z)=> y == undefined && z == undefined ? new Vector3(x, x, x) : new Vector3(x, y, z);
const isVector3 = (v) => v instanceof Vector3;
const isNumber = (value) => typeof value === 'number';
const ASSERT_VEC3 = (v) => ASSERT(isVector3(v));

class Vector3
{
    constructor(x=0, y=0, z=0)
    {
        ASSERT(isNumber(x) && isNumber(y) && isNumber(z));
        this.x=x; this.y=y; this.z=z; 
    }
    copy() { return vec3(this.x, this.y, this.z); }
    abs() { return vec3(abs(this.x), abs(this.y), abs(this.z)); }
    add(v) { ASSERT_VEC3(v); return vec3(this.x + v.x, this.y + v.y, this.z + v.z); }
    subtract(v) { ASSERT_VEC3(v); return vec3(this.x - v.x, this.y - v.y, this.z - v.z); }
    multiply(v) { ASSERT_VEC3(v); return vec3(this.x * v.x, this.y * v.y, this.z * v.z); }
    divide(v) { ASSERT_VEC3(v); return vec3(this.x / v.x, this.y / v.y, this.z / v.z); }
    scale(s) { ASSERT(isNumber(s)); return vec3(this.x * s, this.y * s, this.z * s); }
    length() { return this.lengthSquared()**.5; }
    lengthSquared() { return this.x**2 + this.y**2 + this.z**2; }
    distance(v) { ASSERT_VEC3(v); return this.distanceSquared(v)**.5; }
    distanceSquared(v) { ASSERT_VEC3(v); return this.subtract(v).lengthSquared(); }
    normalize(length=1) { const l = this.length(); return l ? this.scale(length/l) : vec3(length); }
    clampLength(length=1) { const l = this.length(); return l > length ? this.scale(length/l) : this; }
    dot(v) { ASSERT_VEC3(v); return this.x*v.x + this.y*v.y + this.z*v.z; }
    angleBetween(v) { ASSERT_VEC3(v); return Math.acos(clamp(this.dot(v), -1, 1)); }
    max(v) { ASSERT_VEC3(v); return vec3(max(this.x, v.x), max(this.y, v.y), max(this.z, v.z)); }
    min(v) { ASSERT_VEC3(v); return vec3(min(this.x, v.x), min(this.y, v.y), min(this.z, v.z)); }
    floor() { return vec3(floor(this.x), floor(this.y), floor(this.z)); }
    round() { return vec3(Math.round(this.x), Math.round(this.y), Math.round(this.z)); }
    clamp(a, b) { return vec3(clamp(this.x, a, b), clamp(this.y, a, b), clamp(this.z, a, b)); }
    cross(v) { ASSERT_VEC3(v); return vec3(this.y*v.z-this.z*v.y, this.z*v.x-this.x*v.z, this.x*v.y-this.y*v.x); }
    lerp(v, p) { ASSERT_VEC3(v); return this.add(v.subtract(this).scale(clamp(p))); }
    rotateX(a)
    {
        const c=Math.cos(a), s=Math.sin(a); 
        return vec3(this.x, this.y*c - this.z*s, this.y*s + this.z*c);
    }
    rotateY(a)
    {
        const c=Math.cos(a), s=Math.sin(a); 
        return vec3(this.x*c - this.z*s, this.y, this.x*s + this.z*c);
    }
    rotateZ(a)
    {
        const c=Math.cos(a), s=Math.sin(a); 
        return vec3(this.x*c - this.y*s, this.x*s + this.y*c, this.z);
    }
    transform(matrix)
    {
        const p = matrix.transformPoint(this);
        return vec3(p.x, p.y, p.z);
    }
    getHSLColor(a=1) { return hsl(this.x, this.y, this.z, a); }
}

///////////////////////////////////////////////////////////////////////////////
// Color

const rgb = (r, g, b, a) => new Color(r, g, b, a);
const hsl = (h, s, l, a) => rgb().setHSLA(h, s, l, a);
const isColor = (c) => c instanceof Color;

class Color
{
    constructor(r=1, g=1, b=1, a=1)
    {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
    
    copy() { return rgb(this.r, this.g, this.b, this.a); }

    lerp(c, percent)
    {
        ASSERT(isColor(c));
        percent = clamp(percent);
        return rgb(
            lerp(percent, this.r, c.r),
            lerp(percent, this.g, c.g),
            lerp(percent, this.b, c.b),
            lerp(percent, this.a, c.a),
        );
    }

    brighten(amount=.1)
    {
        return rgb
        (
            clamp(this.r + amount),
            clamp(this.g + amount),
            clamp(this.b + amount),
            this.a
        );
    }

    setHSLA(h=0, s=0, l=1, a=1)
    {
        h = mod(h,1);
        s = clamp(s);
        l = clamp(l);
        const q = l < .5 ? l*(1+s) : l+s-l*s, p = 2*l-q,
            f = (p, q, t)=>
                (t = mod(t,1))*6 < 1 ? p+(q-p)*6*t :
                t*2 < 1 ? q :
                t*3 < 2 ? p+(q-p)*(4-t*6) : p;
        this.r = f(p, q, h + 1/3);
        this.g = f(p, q, h);
        this.b = f(p, q, h - 1/3);
        this.a = a;
        return this;
    }
    
    toString()      
    { return `rgb(${this.r*255},${this.g*255},${this.b*255},${this.a})`; }
}

///////////////////////////////////////////////////////////////////////////////
// Random

class Random
{
    constructor(seed=0) { this.setSeed(seed); }
    setSeed(seed) { this.seed = seed+1|0;this.warmup(); }
    float(a=1, b=0)
    {
        // xorshift
        this.seed ^= this.seed << 13;
        this.seed ^= this.seed >>> 17;
        this.seed ^= this.seed << 5;
        if (js13kBuild)
            return b + (a-b) * Math.abs(this.seed % 1e9) / 1e9; // bias low values due to float error
        else
            return b + (a-b) * Math.abs(this.seed % 1e8) / 1e8;
    }
    floatSign(a, b)   { return this.float(a,b) * this.sign(); }
    int(a=1, b=0)     { return this.float(a, b)|0; }
    bool(chance = .5) { return this.float() < chance; }
    sign()            { return this.bool() ? -1 : 1; }
    angle(p=1)        { return this.float(Math.PI*2*p); }
    circle(radius=0, bias = .5)
    {
        const r = this.float()**bias*radius;
        const a = this.float(PI*2);
        return vec3(r*Math.cos(a), r*Math.sin(a));
    }
    mutateColor(color, amount=.1, brightnessAmount=0)
    {
        return rgb
        (
            clamp((1-random.float(brightnessAmount))*(color.r + this.floatSign(amount))),
            clamp((1-random.float(brightnessAmount))*(color.g + this.floatSign(amount))),
            clamp((1-random.float(brightnessAmount))*(color.b + this.floatSign(amount))),
            color.angle
        );
    }
    fromList(list,startBias=1) { return list[this.float()**startBias*list.length|0]; }
    warmup(count=3) { for(let i=count;i--;) this.float(); }
}

///////////////////////////////////////////////////////////////////////////////

class Timer
{
    constructor(timeLeft) 
    { this.time = timeLeft == undefined ? undefined : time + timeLeft; this.setTime = timeLeft; }
    set(timeLeft=0) { this.time = time + timeLeft; this.setTime = timeLeft; }
    unset() { this.time = undefined; }
    isSet() { return this.time != undefined; }
    active() { return time < this.time; }
    elapsed() { return time >= this.time; }
    get() { return this.isSet()? time - this.time : 0; }
    getPercent() { return this.isSet()? percent(this.time - time, this.setTime, 0) : 0; }
}