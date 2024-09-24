'use strict';

let cubeMesh, quadMesh, shadowMesh, cylinderMesh, carMesh, carWheel;

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

const bleedPixels = 8;
class SpriteTile
{
    constructor(pos)
    {
        this.pos = vec3(
            (pos.x * generativeTileSize + bleedPixels) * generativeCanvasSizeInverse,
            (pos.y * generativeTileSize + bleedPixels) * generativeCanvasSizeInverse,
        );
        this.size = vec3(
            (generativeTileSize - 2*bleedPixels) * generativeCanvasSizeInverse,
            (generativeTileSize - 2*bleedPixels) * generativeCanvasSizeInverse,
        );
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
        ASSERT(tile instanceof SpriteTile);
        const uvs = this.uvs.map(uv=>(vec3(tile.size.x*(1-uv.x)+tile.pos.x,uv.y*tile.size.y+tile.pos.y)));
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
    const points = mesh.points.map(p=>p.multiply(size).add(pos));
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
        ASSERT(tile instanceof SpriteTile);
        let tilePosX  = tile.pos.x;
        let tilePosY  = tile.pos.y;
        let tileSizeX = tile.size.x;
        let tileSizeY = tile.size.y;
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
    const tile = new SpriteTile(vec3(1,0));
    const mesh = shadowMesh;
    const points = mesh.points.map(p=>vec3(p.x*xSize+pos.x,pos.y,p.z*zSize+pos.z));
    const uvs = mesh.uvs.map(uv=>
        vec3(uv.x*tile.size.x+tile.pos.x, uv.y*tile.size.y+tile.pos.y));
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