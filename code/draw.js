'use strict';

let cubeMesh, quadMesh, shadowMesh, cylinderMesh, carMesh, carWheel;

const bleedPixels = 8;

const WHITE  = rgb();
const BLACK  = rgb(0,0,0);
const RED    = rgb(1,0,0);
const ORANGE = rgb(1,.5,0);
const YELLOW = rgb(1,1,0);
const GREEN  = rgb(0,1,0);
const CYAN   = rgb(0,1,1);
const BLUE   = rgb(0,0,1);
const MAGENTA= rgb(1,0,1);
const GRAY   = rgb(.5,.5,.5);
let spriteList;
let testGameSprite;

///////////////////////////////////////////////////////////////////////////////

function initSprites()
{
    //spriteList
    //(tilePos, size=1e3, sizeRandomness=0, windScale=0, collideSize=60)
    spriteList = {};

    // trees
    spriteList.tree_palm   = new GameSprite(vec3(0,1),1500,.2,.1,.04);
    spriteList.tree_palm.trackFace = 1;
    spriteList.tree_oak    = new GameSprite(vec3(1,1),2e3,.5,.06,.1);
    spriteList.tree_stump  = new GameSprite(vec3(2,1),1e3,.6,.04);
    spriteList.tree_dead   = new GameSprite(vec3(3,1),800,.3,.03,.06);
    spriteList.tree_pink   = new GameSprite(vec3(4,1),1500,.3,.1,.04);
    spriteList.tree_pink.trackFace = 1;
    spriteList.tree_bush   = new GameSprite(vec3(5,1),1e3,.5,.1,.06);
    spriteList.tree_fall   = new GameSprite(vec3(6,1),1500,.3,.1,.1);
    //TB(spriteList.tree_flower = new GameSprite(vec3(7,1),2e3,.3,.05,200));
    spriteList.tree_snow      = new GameSprite(vec3(4,3),1300,.3,.06,.1)
    spriteList.tree_yellow    = new GameSprite(vec3(5,3),1e3,.3,.06,.1)
    spriteList.tree_huge    = new GameSprite(vec3(3,1),1e4,.5,.1,.1)
    spriteList.tree_huge.colorHSL = vec3(.8, 0, .5);
    spriteList.tree_huge.shadowScale = 0;

    // smaller tree shadows
    spriteList.tree_palm.shadowScale =
    spriteList.tree_oak.shadowScale = 
    spriteList.tree_stump.shadowScale = 
    spriteList.tree_dead.shadowScale = 
    spriteList.tree_pink.shadowScale =
    spriteList.tree_bush.shadowScale =
    spriteList.tree_fall.shadowScale =
    spriteList.tree_snow.shadowScale =
    spriteList.tree_yellow.shadowScale = .7;

    // grass and flowers
    spriteList.grass_plain     = new GameSprite(vec3(0,3),500,.5,1);
    spriteList.grass_plain.colorHSL = vec3(.3, .4, .5);
    spriteList.grass_dead      = new GameSprite(vec3(0,3),600,.3,1);
    spriteList.grass_dead.colorHSL  = vec3(.13, .6, .7);
    spriteList.grass_flower1   = new GameSprite(vec3(1,3),500,.3,1);
    spriteList.grass_flower2   = new GameSprite(vec3(2,3),500,.3,1);
    spriteList.grass_flower3   = new GameSprite(vec3(3,3),500,.3,1);
    spriteList.grass_red       = new GameSprite(vec3(0,3),700,.3,1)
    spriteList.grass_red.colorHSL  = vec3(0, .8, .5);
    spriteList.grass_snow      = new GameSprite(vec3(0,3),300,.5,1)
    spriteList.grass_snow.colorHSL  = vec3(.4, 1, .9);
    spriteList.grass_large     = new GameSprite(vec3(0,3),1e3,.5,1);
    spriteList.grass_large.colorHSL = vec3(.4, .4, .5);
    //spriteList.grass_huge     = new GameSprite(vec3(0,3),1e4,.6,.5,5e3);
    //spriteList.grass_huge.colorHSL = vec3(.8, .5, .5);
    //spriteList.grass_huge.hueRandomness = .2;

    // billboards 
    spriteList.billboards = [];
    const PB = (s)=>spriteList.billboards.push(s);
    PB(spriteList.sign_opGames   = new GameSprite(vec3(5,2),600,0,.02,.5,0));
    PB(spriteList.sign_js13k     = new GameSprite(vec3(0,2),600,0,.02,1,0));
    PB(spriteList.sign_zzfx      = new GameSprite(vec3(1,2),500,0,.02,.5,0));
    PB(spriteList.sign_avalanche = new GameSprite(vec3(7,2),600,0,.02,1,0));
    PB(spriteList.sign_github    = new GameSprite(vec3(2,2),750,0,.02,.5,0));
    PB(spriteList.sign_harris    = new GameSprite(vec3(4,2),300,0,.02,1,0));
    spriteList.sign_frankForce   = new GameSprite(vec3(3,2),500,0,.02,1,0);
    //PB(spriteList.sign_dwitter   = new GameSprite(vec3(6,2),550,0,.02,1,0));
    
    // signs
    spriteList.sign_turn       = new GameSprite(vec3(0,5),500,0,.05,.5);
    spriteList.sign_turn.trackFace = 1; // signs face track
    //spriteList.sign_curve     = new GameSprite(vec3(1,5),500,0,.05,.5);
    //spriteList.sign_curve.trackFace = 1; // signs face track
    //spriteList.sign_warning    = new GameSprite(vec3(2,5),500,0,.05,1,0);
    //spriteList.sign_speed      = new GameSprite(vec3(4,5),500,0,.05,50,0);
    //spriteList.sign_interstate = new GameSprite(vec3(5,5),500,0,.05,50,0);

    // rocks
    spriteList.rock_tall     = new GameSprite(vec3(1,4),1e3,.3,0,.6,0);
    spriteList.rock_big      = new GameSprite(vec3(2,4),800,.2,0,.57,0);
    spriteList.rock_huge     = new GameSprite(vec3(1,4),5e3,.7,0,.6,0);
    spriteList.rock_huge.shadowScale = 0;
    spriteList.rock_huge.colorHSL  = vec3(.08, 1, .8);
    spriteList.rock_huge.hueRandomness = .01;
    spriteList.rock_huge2     = new GameSprite(vec3(2,4),8e3,.5,0,.25,0);
    spriteList.rock_huge2.shadowScale = 0;
    spriteList.rock_huge2.colorHSL  = vec3(.05, 1, .8);
    spriteList.rock_huge2.hueRandomness = .01;
    spriteList.rock_huge3     = new GameSprite(vec3(2,4),8e3,.7,0,.5,0);
    spriteList.rock_huge3.shadowScale = 0;
    spriteList.rock_huge3.colorHSL  = vec3(.05, 1, .8);
    spriteList.rock_huge3.hueRandomness = .01;
    spriteList.rock_weird      = new GameSprite(vec3(2,4),5e3,.5,0,1,0);
    spriteList.rock_weird.shadowScale = 0;
    spriteList.rock_weird.colorHSL  = vec3(.8, 1, .8);
    spriteList.rock_weird.hueRandomness = .2;
    spriteList.rock_weird2     = new GameSprite(vec3(1,4),1e3,.5,0,.5,0);
    spriteList.rock_weird2.colorHSL  = vec3(0, 0, .2);
    spriteList.tunnel1     = new GameSprite(vec3(6,4),1e4,.0,0,0,0);
    spriteList.tunnel1.shadowScale = 0;
    spriteList.tunnel1.colorHSL  = vec3(.05, 1, .8);
    spriteList.tunnel1.tunnelArch = 1;
    spriteList.tunnel2     = new GameSprite(vec3(7,4),5e3,0,0,0,0);
    spriteList.tunnel2.shadowScale = 0;
    spriteList.tunnel2.colorHSL  = vec3(0, 0, .1);
    spriteList.tunnel2.tunnelLong = 1;
    spriteList.tunnel2Front     = new GameSprite(vec3(7,4),5e3,0,0,0,0);
    spriteList.tunnel2Front.shadowScale = 0;
    spriteList.tunnel2Front.colorHSL  = vec3(0,0,.8);
    //spriteList.tunnel2_rock         = new GameSprite(vec3(6,6),1e4,.2,0,.5,0);
    //spriteList.tunnel2_rock.colorHSL = vec3(.15, .5, .8);

    // hazards
    spriteList.hazard_rocks      = new GameSprite(vec3(3,4),600,.2,0,.9);
    spriteList.hazard_rocks.shadowScale = 0;
    spriteList.hazard_rocks.isBump = 1;
    spriteList.hazard_rocks.spriteYOffset = -.02;
    spriteList.hazard_sand      = new GameSprite(vec3(4,4),600,.2,0,.9);
    spriteList.hazard_sand.shadowScale = 0;
    spriteList.hazard_sand.isSlow = 1;
    spriteList.hazard_sand.spriteYOffset = -.02;
    //spriteList.hazard_snow     = new GameSprite(vec3(6,6),500,.1,0,300,0);
    //spriteList.hazard_snow.isSlow = 1;

    // special sprites
    spriteList.water            = new GameSprite(vec3(5,4),6e3,.5,1);
    spriteList.water.shadowScale = 0;
    spriteList.sign_start       = new GameSprite(vec3(1,6),2300,0,.01,0,0);
    spriteList.sign_start.shadowScale = 0;
    spriteList.sign_goal        = new GameSprite(vec3(0,6),2300,0,.01,0,0);
    spriteList.sign_goal.shadowScale = 0;
    spriteList.sign_checkpoint1 = new GameSprite(vec3(6,0),1e3,0,.01,0,0);
    spriteList.sign_checkpoint1.shadowScale = 0;
    spriteList.sign_checkpoint2 = new GameSprite(vec3(7,0),1e3,0,.01,0,0);
    spriteList.sign_checkpoint2.shadowScale = 0;
    spriteList.telephonePole    = new GameSprite(vec3(0,4),1800,0,0,.03,0);
    //spriteList.parts_girder  = new GameSprite(vec3(0,6),500,0,.05,30,0);
    spriteList.telephonePole.shadowScale = .3;
    spriteList.grave_stone      = new GameSprite(vec3(2,6),500,.3,.05,.5,0);
    spriteList.grave_stone.lightnessRandomness = .5;
    spriteList.light_tunnel      = new GameSprite(vec3(0,0),200,0,0,0,0);
    spriteList.light_tunnel.shadowScale = 0;

    // horizon sprites
    spriteList.horizon_city           = new GameSprite(vec3(3,6),0,0,0,0,1);
    spriteList.horizon_city.hueRandomness = 
        spriteList.horizon_city.lightnessRandomness = .15;
    spriteList.horizon_city.colorHSL = vec3(1); // vary color

    spriteList.horizon_islands        = new GameSprite(vec3(7,6));
    spriteList.horizon_islands.colorHSL = vec3(.25, .5, .6);
    spriteList.horizon_islands.canMirror = 0;
    spriteList.horizon_redMountains   = new GameSprite(vec3(7,6));
    spriteList.horizon_redMountains.colorHSL = vec3(.05, .7, .7);
    spriteList.horizon_redMountains.canMirror = 0;
    spriteList.horizon_brownMountains = new GameSprite(vec3(7,6));
    spriteList.horizon_brownMountains.colorHSL = vec3(.1, .5, .6);
    spriteList.horizon_brownMountains.canMirror = 0;
    spriteList.horizon_smallMountains = new GameSprite(vec3(6,6));
    spriteList.horizon_smallMountains.colorHSL = vec3(.1, .5, .6);
    spriteList.horizon_smallMountains.canMirror = 0;
    spriteList.horizon_desert         = new GameSprite(vec3(6,6));
    spriteList.horizon_desert.colorHSL = vec3(.15, .5, .8);
    spriteList.horizon_desert.canMirror = 0;
    spriteList.horizon_snow           = new GameSprite(vec3(7,6));
    spriteList.horizon_snow.colorHSL  = vec3(0,0,1);
    spriteList.horizon_snow.canMirror = 0;
    spriteList.horizon_graveyard      = new GameSprite(vec3(6,6));
    spriteList.horizon_graveyard.colorHSL = vec3(.2, .4, .8);
    spriteList.horizon_graveyard.canMirror = 0;
    spriteList.horizon_weird          = new GameSprite(vec3(7,6));
    spriteList.horizon_weird.colorHSL = vec3(.7, .5, .6);
    spriteList.horizon_weird.canMirror = 0;
    if (!js13kBuildLevel2)
    {
        spriteList.horizon_mountains      = new GameSprite(vec3(7,6));
        spriteList.horizon_mountains.colorHSL = vec3(0, 0, .7);
        spriteList.horizon_mountains.canMirror = 0;
    }

    // more sprites
    spriteList.circle       = new GameSprite(vec3());
    spriteList.dot          = new GameSprite(vec3(1,0));
    spriteList.carShadow    = new GameSprite(vec3(2,0));
    spriteList.carLicense   = new GameSprite(vec3(3,0));
    spriteList.carNumber    = new GameSprite(vec3(4,0));
}

// a sprite that can be placed on the track
class GameSprite
{
    constructor(tilePos, size=1e3, sizeRandomness=0, windScale=0, collideScale=0, canMirror=1)
    {
        this.spriteTile = vec3(
            (tilePos.x * generativeTileSize + bleedPixels) / generativeCanvasSize,
            (tilePos.y * generativeTileSize + bleedPixels) / generativeCanvasSize,
        );
        
        this.size = size;
        this.sizeRandomness = sizeRandomness;
        this.windScale = windScale;
        this.collideScale = collideScale;
        this.canMirror = canMirror; // allow mirroring
        this.trackFace = 0;         // face track if close
        this.spriteYOffset = 0;     // how much to offset the sprite from the ground
        this.shadowScale = 1.2;

        // color
        this.colorHSL = vec3(0,0,1);
        this.hueRandomness = .05;
        this.lightnessRandomness = .01;
    }

    getRandomSpriteColor()
    {
        const c = this.colorHSL.copy();
        c.x += random.floatSign(this.hueRandomness);
        c.z += random.floatSign(this.lightnessRandomness);
        return c.getHSLColor();
    }

    getRandomSpriteScale() { return 1+random.floatSign(this.sizeRandomness); }

    randomize()
    {
        this.colorHSL.x = random.float(-.1,.1);
        this.colorHSL.y = clamp(this.colorHSL.y+random.float(-.1,.1));
        this.colorHSL.z = clamp(this.colorHSL.z+random.float(-.1,.1));
        this.hueRandomness = .05;
        this.lightnessRandomness = .01;
    }
}

///////////////////////////////////////////////////////////////////////////////

const getAspect =()=> mainCanvasSize.x/mainCanvasSize.y;

function drawInit()
{
    {
        // cube
        const points = [vec3(-1,1),vec3(1,1),vec3(1,-1),vec3(-1,-1)];
        cubeMesh = new Mesh().buildExtrude(points);
    }
    {
        // quad
        const points1 = [vec3(-1,1),vec3(1,1),vec3(-1,-1),vec3(1,-1)];
        const uvs1 = points1.map(p=>p.multiply(vec3(.5,-.5,.5)).add(vec3(.5)));
        quadMesh = new Mesh(points1, points1.map(p=>vec3(0,0,1)), uvs1);
        shadowMesh = quadMesh.transform(0,vec3(PI/2,0));
    }
    {
        // cylinder
        const points = [];
        const sides = 12;
        for(let i=sides; i--;)
        {
            const a = i/sides*PI*2;
            points.push(vec3(1,0).rotateZ(a));
        }
        cylinderMesh = new Mesh().buildExtrude(points);
    }
    {
        // car bottom
        const points = 
        [
            vec3(-1,.5), 
            vec3(-.7,.4), 
            vec3(-.2,.5), 
            vec3(.1,.5), 
            vec3(1,.2), 
            vec3(1,.2), 
            vec3(1,0), 
            vec3(-1,0),
        ]

        carMesh = new Mesh().buildExtrude(points,.5);
        carMesh = carMesh.transform(0,vec3(0,-PI/2));
        carWheel = cylinderMesh.transform(0,vec3(0,-PI/2));
    }
}

///////////////////////////////////////////////////////////////////////////////

class Mesh
{
    constructor(points, normals, uvs)
    {
        this.points = points;
        this.normals = normals;
        this.uvs = uvs;
    }

    render(transform, color)
    {
        glPushVerts(this.points, this.normals, color);
        glRender(transform);
    }

    renderTile(transform, color, tile)
    { 
        //ASSERT(tile instanceof SpriteTile);
        const uvs = this.uvs.map(uv=>(vec3(spriteSize-spriteSize*uv.x+tile.x,uv.y*spriteSize+tile.y)));
        // todo, figure out why this is backwards
        //const uvs = this.uvs.map(uv=>uv.multiply(tile.size).add(tile.pos));

        glPushVerts(this.points, this.normals, color, uvs);
        glRender(transform);
    }

    buildExtrude(facePoints, size=1)
    {
        // convert list of 2d points into a 3d shape
        const points = [], normals = [];
        const vertCount = facePoints.length + 2;
        for (let k=2; k--;)
        for (let i=vertCount; i--;)
        {
            // build top and bottom of mesh
            const j = clamp(i-1, 0, vertCount-3);  // degenerate tri at ends
            const h = j>>1;

            let m = j%2 == vertCount%2 ? h : vertCount-3-h;
            if (!k) // hack to fix glitch in mesh due to concave shape
                m = mod(vertCount+2-m, facePoints.length);
            const point = facePoints[m].copy();
            point.z = k?size:-size;
            points.push(point);
            normals.push(vec3(0,0,point.z));
        }

        for (let i = facePoints.length; i--;)
        {
            // build sides of mesh
            const point1 = facePoints[i];
            const point2 = facePoints[(i+1)%facePoints.length];
            const s = vec3(0,0,size);
            const pointA = point1.add(s);
            const pointB = point2.add(s);
            const pointC = point1.subtract(s);
            const pointD = point2.subtract(s);
            const sidePoints = [pointA, pointA, pointB, pointC, pointD, pointD];
            const normal = pointC.subtract(pointD).cross(pointA.subtract(pointC)).normalize();
            for (const p of sidePoints)
            {
                points.push(p);
                normals.push(normal);
            }
        }
        
        return new Mesh(points, normals);
    }

    transform(pos, rot, scale)
    {
        const m = buildMatrix(pos, rot, scale);
        const m2 = buildMatrix(0, rot);
        return new Mesh(
            this.points.map(p=>p.transform(m)),
            this.normals.map(p=>p.transform(m2)),
            this.uvs
        );
    }

    /*combine(mesh, pos, rot, scale)
    {
        const m = buildMatrix(pos, rot, scale);
        const m2 = buildMatrix(0, rot);
        this.points.push(...mesh.points.map(p=>p.transform(m)));
        this.normals && this.normals.push(...mesh.normals.map(p=>p.transform(m2)));
        this.uvs && this.uvs.push(...mesh.uvs);
        return this;
    }*/
}

///////////////////////////////////////////////////////////////////////////////

function pushGradient(pos, size, color, color2)
{
    const mesh = quadMesh;
    const points = mesh.points.map(p=>p.multiply(size).addSelf(pos));
    const colors = [color, color, color2, color2];
    glPushColoredVerts(points, colors);
}

function pushSprite(pos, size, color, tile, skew=0)
{
    const mesh = quadMesh;
    const points = mesh.points.map(p=>vec3(p.x*abs(size.x)+pos.x, p.y*abs(size.y)+pos.y,pos.z));

    // apply skew
    const o = skew*size.y;
    points[0].x += o;
    points[1].x += o;

    // apply texture
    if (tile)
    {
        //ASSERT(tile instanceof SpriteTile);
        let tilePosX  = tile.x;
        let tilePosY  = tile.y;
        let tileSizeX = spriteSize;
        let tileSizeY = spriteSize;
        if (size.x < 0)
            tilePosX -= tileSizeX *= -1;
        if (size.y < 0)
            tilePosY -= tileSizeY *= -1;
        const uvs = mesh.uvs.map(uv=>
            vec3(uv.x*tileSizeX+tilePosX, uv.y*tileSizeY+tilePosY));
        glPushVertsCapped(points, 0, color, uvs);
    }
    else
        glPushVertsCapped(points, 0, color);
}

function pushShadow(pos, xSize, zSize)
{
    if (optimizedCulling && pos.z > 2e4)
        return; // cull far shadows

    const color = rgb(0,0,0,.7)
    const tile = spriteList.dot.spriteTile;
    const mesh = shadowMesh;
    const points = mesh.points.map(p=>vec3(p.x*xSize+pos.x,pos.y,p.z*zSize+pos.z));
    const uvs = mesh.uvs.map(uv=>
        vec3(uv.x*spriteSize+tile.x, uv.y*spriteSize+tile.y));
    glPushVertsCapped(points, 0, color, uvs);
}

///////////////////////////////////////////////////////////////////////////////
// Fullscreen mode

/** Returns true if fullscreen mode is active
 *  @return {Boolean}
 *  @memberof Draw */
function isFullscreen() { return !!document.fullscreenElement; }

/** Toggle fullsceen mode
 *  @memberof Draw */
function toggleFullscreen()
{
    const element = document.body;
    if (isFullscreen())
    {
        if (document.exitFullscreen)
            document.exitFullscreen();
    }
    else if (element.requestFullscreen)
        element.requestFullscreen();
    else if (element.webkitRequestFullscreen)
        element.webkitRequestFullscreen();
    else if (element.mozRequestFullScreen)
      element.mozRequestFullScreen();
}