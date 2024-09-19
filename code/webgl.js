'use strict';

/*

Small and fast dynamic webgl rendering engine for Dr1v3n Wild

Features
- batch rendering
- direct and ambient lighting
- fog with alpha blending
- texture mapping
- vertex color

Potential improvements
- everything is using dynamic buffer, which is slow but flexible
- it would be faster to use static buffers for static geometry
- the colors could be passed in as 32 bit integers rather then vec4s
- specular lighting would also be pretty easy to include
- the fog calculation could possibly be moved to the vertex shader
- antialiasing could be enabled if tiles have more space to prevent bleeding
- a mip map of the passed in texture could be auto generated for smoother scaling
- additive blending would also be easy to implement
- there should be an easier way to set the fog range

*/

const glRenderScale = 100; // fixes floating point issues on some devices
let glCanvas, glContext, glShader, glVertexData;
let glBatchCount, glBatchCountTotal, glDrawCalls;
let glEnableLighting, glLightDirection, glLightColor, glAmbientColor;
let glEnableFog, glFogColor;

///////////////////////////////////////////////////////////////////////////////
// webgl setup

function glInit()
{
    // create the canvas
    const hasAlpha = false;     // there should be no alpha for the background texture
    const hasAntialias = false; // anti-aliasing can cause texture bleading from neighboring tiles
    document.body.appendChild(glCanvas = document.createElement('canvas'));
    glContext = glCanvas.getContext('webgl2', {alpha: hasAlpha, antialias: hasAntialias});
    ASSERT(glContext, 'Failed to create WebGL canvas!');

    // setup vertex and fragment shaders
    glShader = glCreateProgram(
        '#version 300 es\n' +     // specify GLSL ES version
        'precision highp float;'+ // use highp for better accuracy
        'uniform vec4 l,g,a,f;' + // light direction, color, ambient light, fog
        'uniform mat4 m,o;'+      // projection matrix, object matrix
        'in vec4 p,n,u,c;'+       // in: position, normal, uv, color
        'out vec4 v,d,q;'+        // out: uv, color, fog
        'void main(){'+           // shader entry point
        'gl_Position=m*o*p;'+     // transform position
        'v=u,q=f;'+               // pass uv and fog to fragment shader
        'd=c*(a+vec4(g.xyz*dot(l.xyz,'+ // lighting
            'normalize((transpose(inverse(o))*n).xyz)),1));'+ // world normal
        '}'                       // end of shader
        ,
        '#version 300 es\n' +     // specify GLSL ES version
        'precision highp float;'+ // use highp for better accuracy
        'in vec4 v,d,q;'+         // uv, color, fog
        'uniform sampler2D s;'+   // texture
        'out vec4 c;'+            // out color
        'void main(){'+           // shader entry point
        'c=v.z>0.?d:texture(s,v.xy)*d;'+ // color or texture
        'float f=clamp(gl_FragCoord.z/gl_FragCoord.w/1e5,0.,1.);'+     // fog depth
        'v.w>0.?c:c=vec4(mix(c.xyz,q.xyz,f*f),'+                       // fog color
            'c.a*clamp(4.-gl_FragCoord.z/gl_FragCoord.w/2e4,0.,1.));'+ // fog alpha
        //'c.w);'+                   // disable fog alpha
        //'if (c.a == 0.) discard;'+ // discard if no alpha
        '}'                          // end of shader
    );
 
    // set up the shader
    glContext.useProgram(glShader);
    glContext.bindBuffer(gl_ARRAY_BUFFER, glContext.createBuffer());
    glContext.bufferData(gl_ARRAY_BUFFER, gl_VERTEX_BUFFER_SIZE, gl_DYNAMIC_DRAW);
    glContext.blendFunc(gl_SRC_ALPHA, gl_ONE_MINUS_SRC_ALPHA);
    glSetCapability(gl_BLEND);
    glSetCapability(gl_CULL_FACE); // not culling causeses thin black lines sometimes
    glVertexData = new Float32Array(new ArrayBuffer(gl_VERTEX_BUFFER_SIZE));

    // set vertex attributes
    let offset = 0;
    const vertexAttribute = (name)=>
    {
        const type = gl_FLOAT, stride = gl_VERTEX_BYTE_STRIDE;
        const size = 4, byteCount = 4;
        const location = glContext.getAttribLocation(glShader, name);
        glContext.enableVertexAttribArray(location);
        glContext.vertexAttribPointer(location, size, type, 0, stride, offset);
        offset += size*byteCount;
    }
    vertexAttribute('p'); // position
    vertexAttribute('n'); // normal
    vertexAttribute('u'); // uv
    vertexAttribute('c'); // color
}

function glCompileShader(source, type)
{
    // build the shader
    const shader = glContext.createShader(type);
    glContext.shaderSource(shader, source);
    glContext.compileShader(shader);

    // check for errors
    if (debug && !glContext.getShaderParameter(shader, gl_COMPILE_STATUS))
        throw glContext.getShaderInfoLog(shader);
    return shader;
}

function glCreateProgram(vsSource, fsSource)
{
    // build the program
    const program = glContext.createProgram();
    glContext.attachShader(program, glCompileShader(vsSource, gl_VERTEX_SHADER));
    glContext.attachShader(program, glCompileShader(fsSource, gl_FRAGMENT_SHADER));
    glContext.linkProgram(program);

    // check for errors
    if (debug && !glContext.getProgramParameter(program, gl_LINK_STATUS))
        throw glContext.getProgramInfoLog(program);
    return program;
}

function glCreateTexture(image)
{
    // build the texture
    const texture = glContext.createTexture();
    glContext.bindTexture(gl_TEXTURE_2D, texture);
    glContext.texImage2D(gl_TEXTURE_2D, 0, gl_RGBA, gl_RGBA, gl_UNSIGNED_BYTE, image);
    return texture;
}

function glPreRender(canvasSize)
{
    // set size of canvas and viewport which also clears it
    glContext.viewport(0, 0, glCanvas.width = canvasSize.x, glCanvas.height = canvasSize.y);
    glDrawCalls = glBatchCount = glBatchCountTotal = 0; // reset draw counts
    //debug && glContext.clearColor(1, 0, 1, 1); // test background color
    //glContext.clear(gl_DEPTH_BUFFER_BIT|gl_COLOR_BUFFER_BIT); // auto cleared

    // use point filtering for pixelated rendering
    glContext.texParameteri(gl_TEXTURE_2D, gl_TEXTURE_MIN_FILTER, gl_NEAREST);
    glContext.texParameteri(gl_TEXTURE_2D, gl_TEXTURE_MAG_FILTER, gl_NEAREST);

    // set up the camera transform
    const viewMatrix = buildMatrix(cameraPos, cameraRot).inverse();
    const combinedMatrix = glCreateProjectionMatrix().multiply(viewMatrix);
    glContext.uniformMatrix4fv(glUniform('m'), 0, combinedMatrix.toFloat32Array());
}

function glRender(transform=new DOMMatrix)
{
    // set up the lights and fog
    const initUniform4f = (name, x, y, z)=> glContext.uniform4f(glUniform(name), x, y, z, 0);
    const lightColor   = glEnableLighting ? glLightColor   : BLACK;
    const ambientColor = glEnableLighting ? glAmbientColor : WHITE;
    initUniform4f('g', lightColor.r,   lightColor.g,   lightColor.b);
    initUniform4f('a', ambientColor.r, ambientColor.g, ambientColor.b);
    initUniform4f('f', glFogColor.r,   glFogColor.g,   glFogColor.b);
    initUniform4f('l', glLightDirection.x, glLightDirection.y, glLightDirection.z);

    // render the verts
    ASSERT(glBatchCount < gl_MAX_BATCH, 'Too many points!');
    const vertexData = glVertexData.subarray(0, glBatchCount * gl_INDICIES_PER_VERT);
    const m = transform.scaleSelf(glRenderScale, glRenderScale, glRenderScale);
    glContext.uniformMatrix4fv(glUniform('o'), 0, m.toFloat32Array());
    glContext.bufferSubData(gl_ARRAY_BUFFER, 0, vertexData);
    glContext.drawArrays(gl_TRIANGLE_STRIP, 0, glBatchCount);
    glBatchCountTotal += glBatchCount;
    glBatchCount = 0;
    ++glDrawCalls;
}

///////////////////////////////////////////////////////////////////////////////
// webgl helper functions

const glUniform = (name) => glContext.getUniformLocation(glShader, name);

function glSetCapability(cap, enable=1)
{ enable ? glContext.enable(cap) : glContext.disable(cap); }

function glPolygonOffset(units=0)
{ glContext.polygonOffset(0, -units); glSetCapability(gl_POLYGON_OFFSET_FILL, !!units); }

function glSetDepthTest(depthTest=1, depthWrite=1)
{ glSetCapability(gl_DEPTH_TEST, !!depthTest); glContext.depthMask(!!depthWrite); }

function glCreateProjectionMatrix()
{
    const aspect = glCanvas.width / glCanvas.height;
    const fov = .5, f = 1 / Math.tan(fov);
    const near = 1, far = 1e4, range = far - near;
    return new DOMMatrix
    ([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (near + far) / range, 2 * near * far / range,
        0, 0, -1, 0
    ]);
}

///////////////////////////////////////////////////////////////////////////////
// drawing functions

// push a list of colored verts with optonal normals and uvs
function glPushVerts(points, normals, color, uvs)
{
    const count = points.length;
    if (!(count < gl_MAX_BATCH - glBatchCount))
        glRender();

    const na = vec3(1); // no lighting/texture
    for(let i=count; i--;)
        glPushVert(points[i], normals ? normals[i] : na, uvs ? uvs[i] : na, color);
}

// push a list of colored verts with optonal normals and uvs
// this is also capped with degenerate verts to close the shape
function glPushVertsCapped(points, normals, color, uvs)
{
    // push points with extra degenerate verts to cap both sides
    const count = points.length;
    if (!(count+2 < gl_MAX_BATCH - glBatchCount))
        glRender();

    const na = vec3(1); // no lighting/texture
    glPushVert(points[count-1], na, na, color);
    for(let i=count; i--;)
        glPushVert(points[i], normals ? normals[i] : na, uvs ? uvs[i] : na, color);
    glPushVert(points[0], na, na, color);
}

// push a list of colored verts without normals or uvs
function glPushColoredVerts(points, colors)
{
    // push points with a list of vertex colors
    const count = points.length;
    if (!(count+2 < gl_MAX_BATCH - glBatchCount))
        glRender();

    const na = vec3(1); // no lighting/texture
    glPushVert(points[count-1], na, na, colors[count-1]);
    for(let i=count; i--;)
        glPushVert(points[i], na, na, colors[i]);
    glPushVert(points[0], na, na, colors[0]);
}

// push a single vert to the buffer
function glPushVert(pos, normal, uv, color)
{
    let offset = glBatchCount * gl_INDICIES_PER_VERT;
    glVertexData[offset++] = pos.x/glRenderScale;
    glVertexData[offset++] = pos.y/glRenderScale;
    glVertexData[offset++] = pos.z/glRenderScale;
    glVertexData[offset++] = 1;
    glVertexData[offset++] = normal.x;
    glVertexData[offset++] = normal.y;
    glVertexData[offset++] = normal.z;
    glVertexData[offset++] = 0;
    glVertexData[offset++] = uv.x;
    glVertexData[offset++] = uv.y;
    glVertexData[offset++] = uv.z;
    glVertexData[offset++] = !glEnableFog;
    glVertexData[offset++] = color.r;
    glVertexData[offset++] = color.g;
    glVertexData[offset++] = color.b;
    glVertexData[offset++] = color.a;
    ++glBatchCount;
}

///////////////////////////////////////////////////////////////////////////////
// store webgl constants as integers so they can be minifed

const 
gl_TRIANGLE_STRIP = 5,
gl_DEPTH_BUFFER_BIT = 256,
gl_SRC_ALPHA = 770,
gl_ONE_MINUS_SRC_ALPHA = 771,
gl_CULL_FACE = 2884,
gl_DEPTH_TEST = 2929,
gl_BLEND = 3042,
gl_TEXTURE_2D = 3553,
gl_UNSIGNED_BYTE = 5121,
gl_FLOAT = 5126,
gl_RGBA = 6408,
gl_NEAREST = 9728,
gl_TEXTURE_MAG_FILTER = 10240,
gl_TEXTURE_MIN_FILTER = 10241,
gl_COLOR_BUFFER_BIT = 16384,
gl_POLYGON_OFFSET_FILL = 32823,
gl_ARRAY_BUFFER = 34962,
gl_DYNAMIC_DRAW = 35048,
gl_FRAGMENT_SHADER = 35632, 
gl_VERTEX_SHADER = 35633,
gl_COMPILE_STATUS = 35713,
gl_LINK_STATUS = 35714,

// constants for batch rendering
gl_MAX_BATCH = 2e4,                  // max verts per batch
gl_INDICIES_PER_VERT =  (1 * 4) * 4, // vec4 * 4
gl_VERTEX_BYTE_STRIDE = gl_INDICIES_PER_VERT * 4, // 4 bytes per float
gl_VERTEX_BUFFER_SIZE = gl_MAX_BATCH * gl_VERTEX_BYTE_STRIDE;