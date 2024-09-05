'use strict';

let lightDirection, lightColor, ambientColor, fogColor;
let cubeMesh, quadMesh, shadowMesh, cylinderMesh, carMesh, carWheel;

const WHITE  = rgb(1,1,1);
const BLACK  = rgb(0,0,0);
const RED    = rgb(1,0,0);
const YELLOW = rgb(1,1,0);
const GREEN  = rgb(0,1,0);
const CYAN   = rgb(1,1,0);
const BLUE   = rgb(0,0,1);
const MAGENTA= rgb(0,1,1);
const GRAY   = rgb(.5,.5,.5);

///////////////////////////////////////////////////////////////////////////////

function drawInit()
{
    {
        // cube
        const points = [vec3(-1,1),vec3(1,1),vec3(1,-1),vec3(-1,-1)];
        cubeMesh = new Mesh().buildExtrude(points);
    }
    {
        // quad
        const points = [vec3(-1,1),vec3(-1,1),vec3(1,1),vec3(-1,-1),vec3(1,-1),vec3(1,-1)];
        const normals = points.map(p=>vec3(0,0,9));
        const uvs = points.map(p=>p.multiply(vec3(.5,-.5,.5)).add(vec3(.5)));
        quadMesh = new Mesh(points, normals, uvs);
        shadowMesh = quadMesh.copy().transform(0,vec3(PI/2,0,0));
    }
    {
        // cylinder
        const points = [];
        const sides = 12;
        for(let i=sides; i--;)
        {
            const a = i/sides*PI*2;
            points.push(vec3(1,0,0).rotateZ(a));
        }
        cylinderMesh = new Mesh().buildExtrude(points);

        /*
            const profile = [
            vec3(0.2, -1),  // Narrow base
            vec3(0.5, -0.5), // Widening towards the bottom
            vec3(0.3, 0),   // Narrowing at the middle
            vec3(0.7, 0.5),  // Widening towards the top
            vec3(0.1, 1)    // Narrow neck
        ];

        cylinderMesh = new Mesh().buildLathe(profile);*/
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

        //const points = [vec3(-1,1),vec3(1,1),vec3(1,-1),vec3(-1,-1)];
        carMesh = new Mesh().buildExtrude(points,.5);
        carMesh.transform(0,vec3(0,-PI/2));
        //debugMesh=carMesh

        carWheel = cylinderMesh.copy();
        carWheel.transform(0,vec3(0,-PI/2));
        //debugMesh=cylinderMesh
        //carMesh.combine(cylinderMesh);
    }
}

///////////////////////////////////////////////////////////////////////////////

class Tile
{
    constructor(pos, size)
    {
        const bleedPixels = 2;
        const textureSize = generativeCanvasSize;
        this.pos = pos.add(vec3(bleedPixels)).divide(textureSize);
        this.size = size.add(vec3(-2*bleedPixels)).divide(textureSize);
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
    
    copy()
    {
        return new Mesh(this.points, this.normals, this.uvs);
    }

    buildExtrude(facePoints, size=1, topScale=1)
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

            const point = facePoints[j%2 == (vertCount%2 ? 0 : k) ? vertCount-3-h : h ].scale(k?topScale:1);
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
            const pointA = point1.scale(topScale).add(s);
            const pointB = point2.scale(topScale).add(s);
            const pointC = point1.subtract(s);
            const pointD = point2.subtract(s);
            const sidePoints = [pointA, pointA, pointB, pointC, pointD, pointD];
            const normal = pointA.subtract(pointB).cross(pointA.subtract(pointC)).normalize();
            points.push(...sidePoints);
            for (const p of sidePoints)
                normals.push(normal);
        }
        
        this.points = points;
        this.normals = normals;
        return this;
    }

    buildLathe(facePoints, segments=16)
    {
        // convert list of 2D points into a lathe 3D shape
        const points = [], normals = [];
        const angleStep = PI*2/segments;
        for (let i=segments; i--;)
        {
            const angle2 = (i+.5)*angleStep;

            // todo fix normals are not tilted correctly
            const normal = vec3(1,0).rotateY(angle2);

            for (let j = facePoints.length; j--;)
            {
                const point1 = facePoints[j].rotateY(i*angleStep);
                const point2 = facePoints[j].rotateY((i+1)*angleStep);

                // add vertices for the lathe shape
                points.push(point2);
                points.push(point1);
                normals.push(normal);
                normals.push(normal);

                if (!j)
                {
                    // degenrate triangles at the end of the shape
                    points.push(point1);
                    points.push(point1);
                    normals.push(normal);
                    normals.push(normal);
                }
            }
        }

        this.points = points;
        this.normals = normals;
        return this;
    }

    combine(mesh, pos, rot, scale)
    {
        const m = buildMatrix(pos, rot, scale);
        const m2 = buildMatrix(0, rot);
        this.points.push(...mesh.points.map(p=>p.transform(m)));
        this.normals && this.normals.push(...mesh.normals.map(p=>p.transform(m2)));
        this.uvs && this.uvs.push(...mesh.uvs);
        return this;
    }

    transform(pos, rot, scale)
    {
        const m = buildMatrix(pos, rot, scale);
        const m2 = buildMatrix(0, rot);
        this.points = this.points.map(p=>p.transform(m));
        this.normals = this.normals.map(p=>p.transform(m2));
        return this;
    }

    render(transform, color)
    {
        glPushPoints(this.points, this.normals, color);
        glRender(transform);
    }

    renderUnlit(transform, color, unlit=true)
    {
        if (unlit)
            glPushMonoColoredPoints(this.points, color);
        else
            glPushPoints(this.points, this.normals, color);
        glRender(transform);
    }

    renderTile(transform, color, tile)
    {
        ASSERT(tile instanceof Tile);
        const uvs = this.uvs.map(uv=>vec3(uv.x*tile.size.x+tile.pos.x,uv.y*tile.size.y+tile.pos.y));
        glPushPoints(this.points, this.normals, color, uvs);
        glRender(transform);
    }

    /*transformAndPush(transform, color)
    {
        //this.render(transform, color);
        //return

        function getInverseTranspose(domMatrix) {
            // Clone the DOMMatrix to avoid modifying the original
            const inverseMatrix = domMatrix.inverse();

            // Transpose the upper-left 3x3 part of the matrix
            return new DOMMatrix([
                inverseMatrix.m11, inverseMatrix.m21, inverseMatrix.m31, 0,
                inverseMatrix.m12, inverseMatrix.m22, inverseMatrix.m32, 0,
                inverseMatrix.m13, inverseMatrix.m23, inverseMatrix.m33, 0,
                0, 0, 0, 1
            ]);
        }

        const inv = getInverseTranspose(transform);
        const points = this.points.map(p=>p.transformDOM(transform));
        const normals = this.normals.map(p=>p.transformDOM(inv));
        glPushPoints(points, normals, color);
    }*/
}

///////////////////////////////////////////////////////////////////////////////

function pushGradient(pos, size, color, color2)
{
    const flip = size.x < 0;
    size = size.abs();
    const mesh = quadMesh;
    const points = mesh.points.map(p=>vec3(p.x*size.x+pos.x,p.y*size.y+pos.y,p.z*size.z+pos.z));

    let colors = [];
    for (let i = 0; i < points.length; i++)
        colors[i] = i>2 ? color2 : color;
    glPushColoredPoints(points, colors);
}

function pushSprite(pos, size, color, tile)
{
    const flip = size.x < 0;
    size = size.abs();
    const mesh = quadMesh;
    const points = mesh.points.map(p=>vec3(p.x*size.x+pos.x,p.y*size.y+pos.y,p.z*size.z+pos.z));
    if (tile)
    {
        ASSERT(tile instanceof Tile);
        if (flip)
        {
            tile.pos.x += tile.size.x;
            tile.size.x *= -1;
        }

        const uvs = mesh.uvs.map(uv=>vec3(uv.x*tile.size.x+tile.pos.x,uv.y*tile.size.y+tile.pos.y));
        glPushPoints(points, 0, color, uvs);
    }
    else
        glPushPoints(points, 0, color);
}

function pushShadow(pos, xSize, zSize, rotation, shape=1)
{
    const color = hsl(0,0,0,.5)
    const size = vec3(xSize,0,zSize);
    const tile = getGenerativeTile(vec3(shape,0));
    const mesh = shadowMesh;
    let points = mesh.points;
    if (rotation)
    {
        const m2 = buildMatrix(pos, vec3(rotation.x,0,rotation.z), size);
        const m3 = buildMatrix(0, vec3(0,rotation.y,0), 0);
        const m1 = m2.multiply(m3);
        const marix = buildMatrix(pos,rotation,size);
        points = points.map(p=>p.transform(m1));
    }
    else
        points = points.map(p=>vec3(p.x*size.x+pos.x,pos.y,p.z*size.z+pos.z));

    const uvs = mesh.uvs.map(uv=>vec3(uv.x*tile.size.x+tile.pos.x,uv.y*tile.size.y+tile.pos.y));
    glPushPoints(points, 0, color, uvs);
}

function getGenerativeTile(pos)
{
    const w = generativeTileSize;
    return new Tile(pos.scale(w), generativeTileSizeVec3);
}
