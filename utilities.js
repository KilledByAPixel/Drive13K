'use strict';

///////////////////////////////////////////////////////////////////////////////
// Math Stuff

const PI = Math.PI;
const RADIANS_TO_DEGREES = 180/PI;
function abs(value) { return Math.abs(value); }
function min(valueA, valueB) { return Math.min(valueA, valueB); }
function max(valueA, valueB) { return Math.max(valueA, valueB); }
function sign(value) { return Math.sign(value); }
function mod(dividend, divisor=1) { return ((dividend % divisor) + divisor) % divisor; }
function clamp(value, min=0, max=1) { return value < min ? min : value > max ? max : value; }
function clampAngle(value) { return ((value+PI) % (2*PI) + 2*PI) % (2*PI) - PI; }
function percent(value, valueA, valueB) { const d=valueB-valueA; return d ? clamp((value-valueA)/d) : 0; }
function lerp(percent, valueA, valueB) { return valueA + clamp(percent) * (valueB-valueA); }
function rand(valueA=1, valueB=0) { return valueB + Math.random() * (valueA-valueB); }
function randInt(valueA, valueB=0) { return Math.floor(rand(valueA,valueB)); }
function isOverlapping(posA, sizeA, posB, sizeB=vec3())
{ 
    return abs(posA.x - posB.x)*2 < sizeA.x + sizeB.x 
        && abs(posA.y - posB.y)*2 < sizeA.y + sizeB.y;
}
function buildMatrix(pos, rot, scale)
{
    const R2D = RADIANS_TO_DEGREES;
    let m = new DOMMatrix;
    pos && m.translateSelf(pos.x, pos.y, pos.z);
    rot && m.rotateSelf(rot.x*R2D, rot.y*R2D, rot.z*R2D);
    scale && m.scaleSelf(scale.x, scale.y, scale.z);
    return m;
}

///////////////////////////////////////////////////////////////////////////////
// Vector3

const vec3 = (x, y, z)=> y == undefined && z == undefined ? new Vector3(x, x, x) : new Vector3(x, y, z);

function isVector3(v) { return v instanceof Vector3; }
function isNumber(value) { return typeof value === 'number'; }
function ASSERT_VEC3(v) { ASSERT(isVector3(v)); }

class Vector3
{
    constructor(x=0, y=0, z=0) { this.x=x; this.y=y; this.z=z; }
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
    DOMPoint() { return new DOMPoint(this.x, this.y, this.z); }
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
    transformDOM(matrix)
    {
        return matrix.transformPoint(this);
    }
}

///////////////////////////////////////////////////////////////////////////////
// Color

function rgb(r, g, b, a) { return new Color(r, g, b, a); }
function hsl(h, s, l, a) { return new Color().setHSLA(h, s, l, a); }

class Color
{
    constructor(r=1, g=1, b=1, a=1)
    {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
    
    copy() { return new Color(this.r, this.g, this.b, this.a); }

    setHSLA(h=0, s=0, l=1, a=1)
    {
        const q = l < .5 ? l*(1+s) : l+s-l*s, p = 2*l-q,
            f = (p, q, t)=>
                (t = ((t%1)+1)%1) < 1/6 ? p+(q-p)*6*t :
                t < 1/2 ? q :
                t < 2/3 ? p+(q-p)*(2/3-t)*6 : p;
        this.r = f(p, q, h + 1/3);
        this.g = f(p, q, h);
        this.b = f(p, q, h - 1/3);
        this.a = a;
        return this;
    }

    rgbaInt()
    {
        const r = clamp(this.r)*255|0;
        const g = clamp(this.g)*255<<8;
        const b = clamp(this.b)*255<<16;
        const a = clamp(this.a)*255<<24;
        return r + g + b + a;
    }
    
    toString(useAlpha = true)      
    { 
        const toHex = (c)=> ((c=c*255|0)<16 ? '0' : '') + c.toString(16);
        return '#' + toHex(this.r) + toHex(this.g) + toHex(this.b) + (useAlpha ? toHex(this.a) : '');
    }
}

///////////////////////////////////////////////////////////////////////////////
// Random

class Random
{
    constructor(seed=1) { this.setSeed(seed); }
    setSeed(seed) { this.seed = seed+1e5|0;this.float();this.float();this.float(); }
    float(a=1, b=0)
    {
        // xorshift
        this.seed ^= this.seed << 13;
        this.seed ^= this.seed >>> 17;
        this.seed ^= this.seed << 5;
        return b + (a-b) * Math.abs(this.seed % 1e9) / 1e9;
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
        return vec2(r*Math.cos(a), r*Math.sin(a));
    }
    mutateColor(color, amount=.1)
    {
        return new Color
        (
            color.r + this.floatSign(amount),
            color.g + this.floatSign(amount),
            color.b + this.floatSign(amount),
            color.angle
        );
    }
}
const random = new Random();

///////////////////////////////////////////////////////////////////////////////

class Timer
{
    constructor(timeLeft) { this.time = timeLeft == undefined ? undefined : time + timeLeft; this.setTime = timeLeft; }

    set(timeLeft=0) { this.time = time + timeLeft; this.setTime = timeLeft; }
    unset() { this.time = undefined; }
    isSet() { return this.time != undefined; }
    active() { return time < this.time; }
    elapsed() { return time >= this.time; }
    get() { return this.isSet()? time - this.time : 0; }
    getPercent() { return this.isSet()? percent(this.time - time, this.setTime, 0) : 0; }
    valueOf() { return this.get(); }
}