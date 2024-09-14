'use strict';

let glCanvas, glContext, glShader, glVertexData;
let glBatchCount, glBatchCountTotal, glDrawCalls;
let glEnableFog = 1;
const gl_antialias = false;
const gl_enableTexture = 1;
const gl_enableLighting = 1;
const gl_renderScale = 100;

///////////////////////////////////////////////////////////////////////////////
// webgl setup

function glInit()
{
    // create the canvas
    document.body.appendChild(glCanvas = document.createElement('canvas'));
    glContext = glCanvas.getContext('webgl2', {antialias:gl_antialias});

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
        'd=n.z>1.?c:c*(a+vec4(g.xyz*dot(l.xyz,'+ // lighting
            'normalize((transpose(inverse(o))*n).xyz)),1));'+ // get world normal
        '}'                       // end of shader
        ,
        '#version 300 es\n' +     // specify GLSL ES version
        'precision highp float;'+ // use highp for better accuracy
        'in vec4 v,d,q;'+         // uv, color, fog
        'uniform sampler2D s;'+   // texture
        'out vec4 c;'+            // out color
        'void main(){'+           // shader entry point
        'c=v.z>1.?d:texture(s,v.xy)*d;'+ // color or texture
        'v.w>1.?c:c=vec4(mix(c.xyz,q.xyz,pow(clamp(gl_FragCoord.z/gl_FragCoord.w/1e5,0.,1.),2.)),'+
        //'c.w);'+
        'c.a*=clamp(4.-gl_FragCoord.z/gl_FragCoord.w/18e3,0.,1.));'+ // fog alpha
        //'if (c.a == 0.) discard;'+ // discard if no alpha
        '}'                       // end of shader
    );
 
    // init buffers
    glVertexData = new Float32Array(new ArrayBuffer(gl_VERTEX_BUFFER_SIZE));
    
    // set up the shader
    glContext.useProgram(glShader);
    glContext.bindBuffer(gl_ARRAY_BUFFER, glContext.createBuffer());
    glContext.bufferData(gl_ARRAY_BUFFER, gl_VERTEX_BUFFER_SIZE, gl_DYNAMIC_DRAW);
    glContext.blendFunc(gl_SRC_ALPHA, gl_ONE_MINUS_SRC_ALPHA);
    glSetCapability(gl_BLEND);
    glSetCapability(gl_CULL_FACE); // not culling causeses thin black lines sometimes

    // set vertex attributes
    let offset = 0;
    const vertexAttribute = (name)=>
    {
        const type = gl_FLOAT, size = 4, byteCount = 4;
        const location = glContext.getAttribLocation(glShader, name);
        glContext.enableVertexAttribArray(location);
        glContext.vertexAttribPointer(location, size, type, 0, gl_VERTEX_BYTE_STRIDE, offset);
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

function glPreRender()
{
    // clear and set to same size as main canvas
    debug && glContext.clearColor(1, 0, 1, 1); // test background color
    glContext.viewport(0, 0, glCanvas.width = mainCanvas.width, glCanvas.height = mainCanvas.height);
    glDrawCalls = glBatchCount = glBatchCountTotal = 0; // reset draw counts
    //glContext.clear(gl_DEPTH_BUFFER_BIT|gl_COLOR_BUFFER_BIT); // auto cleared

    // use point filtering for pixelated rendering
    glContext.texParameteri(gl_TEXTURE_2D, gl_TEXTURE_MIN_FILTER, gl_NEAREST);
    glContext.texParameteri(gl_TEXTURE_2D, gl_TEXTURE_MAG_FILTER, gl_NEAREST);

    // set up the camera
    const viewMatrix = buildMatrix(cameraPos, cameraRot).inverse();
    const combinedMatrix = glCreateProjectionMatrix().multiply(viewMatrix);
    glContext.uniformMatrix4fv(glUniform('m'), 0, combinedMatrix.toFloat32Array());

    // set up the lights
    const initUniform4f = (name, x, y, z)=> glContext.uniform4f(glUniform(name), x, y, z, 0);
    initUniform4f('l', lightDirection.x, lightDirection.y, lightDirection.z);
    initUniform4f('g', lightColor.r,     lightColor.g,     lightColor.b);
    initUniform4f('a', ambientColor.r,   ambientColor.g,   ambientColor.b);
    initUniform4f('f', fogColor.r,       fogColor.g,       fogColor.b);
}
///////////////////////////////////////////////////////////////////////////////
// webgl helper functions

const glSetCapability = (cap, enable=1) => enable ? glContext.enable(cap) : glContext.disable(cap);
const glUniform = (name) => glContext.getUniformLocation(glShader, name);

function glPolygonOffset(units)
{
    glContext.polygonOffset(0, -units);
    glSetCapability(gl_POLYGON_OFFSET_FILL, !!units);
}

function glSetDepthTest(depthTest=1, depthWrite=1)
{
    glSetCapability(gl_DEPTH_TEST, !!depthTest);
    glContext.depthMask(!!depthWrite);
}

function glCreateProjectionMatrix()
{
    const aspect = mainCanvas.width / mainCanvas.height;
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

function glRender(transform=new DOMMatrix)
{
    ASSERT(glBatchCount < gl_MAX_BATCH, 'Too many points!');
    const vertexData = glVertexData.subarray(0, glBatchCount * gl_INDICIES_PER_VERT);
    const m = transform.scaleSelf(gl_renderScale, gl_renderScale, gl_renderScale);
    glContext.uniformMatrix4fv(glUniform('o'), 0, m.toFloat32Array());
    glContext.bufferSubData(gl_ARRAY_BUFFER, 0, vertexData);
    glContext.drawArrays(gl_TRIANGLE_STRIP, 0, glBatchCount);
    glBatchCountTotal += glBatchCount;
    glBatchCount = 0;
    ++glDrawCalls;
}

function glPushVerts(points, normals, color, uvs)
{
    const count = points.length;
    if (!(count < gl_MAX_BATCH - glBatchCount))
        glRender();
    ASSERT(count < gl_MAX_BATCH - glBatchCount, 'Too many verts!');

    const na = vec3(9); // z > 1 means no lighting/texture
    for(let i=count; i--;)
        glDrawVerts(points[i], normals ? normals[i] : na, uvs ? uvs[i] : na, color);
}

function glPushVertsCapped(points, normals, color, uvs)
{
    // push points with extra degenerate verts to cap both sides
    const count = points.length;
    if (!(count+2 < gl_MAX_BATCH - glBatchCount))
        glRender();
    ASSERT(count+2 < gl_MAX_BATCH - glBatchCount, 'Too many verts!');

    const na = vec3(9); // z > 1 means no lighting/texture
    glDrawVerts(points[count-1], na, na, color);
    for(let i=count; i--;)
        glDrawVerts(points[i], normals ? normals[i] : na, uvs ? uvs[i] : na, color);
    glDrawVerts(points[0], na, na, color);
}

function glPushColoredVerts(points, colors)
{
    // push points with a list of vertex colors
    const count = points.length;
    if (!(count+2 < gl_MAX_BATCH - glBatchCount))
        glRender();
    ASSERT(count+2 < gl_MAX_BATCH - glBatchCount, 'Too many verts!');

    const na = vec3(9); // z > 1 means no lighting/texture
    glDrawVerts(points[count-1], na, na, colors[count-1]);
    for(let i=count; i--;)
        glDrawVerts(points[i], na, na, colors[i]);
    glDrawVerts(points[0], na, na, colors[0]);
}

function glDrawVerts(pos, normal, uv, color)
{
    let offset = glBatchCount * gl_INDICIES_PER_VERT;
    glVertexData[offset++] = pos.x/gl_renderScale;
    glVertexData[offset++] = pos.y/gl_renderScale;
    glVertexData[offset++] = pos.z/gl_renderScale;
    glVertexData[offset++] = 1;
    glVertexData[offset++] = normal.x;
    glVertexData[offset++] = normal.y;
    glVertexData[offset++] = gl_enableLighting ? normal.z : 9;
    glVertexData[offset++] = 0;
    glVertexData[offset++] = uv.x;
    glVertexData[offset++] = uv.y;
    glVertexData[offset++] = gl_enableTexture ? uv.z : 9;
    glVertexData[offset++] = glEnableFog ? 0 : 9;
    glVertexData[offset++] = color.r;
    glVertexData[offset++] = color.g;
    glVertexData[offset++] = color.b;
    glVertexData[offset++] = color.a;
    ++glBatchCount;
}

///////////////////////////////////////////////////////////////////////////////
// store gl constants as integers so they can be minifed

const 
gl_TRIANGLE_STRIP = 5,
gl_DEPTH_BUFFER_BIT = 256,
gl_LEQUAL = 515,
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
gl_TEXTURE0 = 33984,
gl_ARRAY_BUFFER = 34962,
gl_DYNAMIC_DRAW = 35048,
gl_FRAGMENT_SHADER = 35632, 
gl_VERTEX_SHADER = 35633,
gl_COMPILE_STATUS = 35713,
gl_LINK_STATUS = 35714,

// constants for batch rendering
gl_MAX_BATCH = 1e4,
gl_INDICIES_PER_VERT =  (1 * 4) * 4, // vec4 * 4
gl_VERTEX_BYTE_STRIDE = (4 * 4) * 4, // vec4 * 4
gl_VERTEX_BUFFER_SIZE = gl_MAX_BATCH * gl_INDICIES_PER_VERT * 4;