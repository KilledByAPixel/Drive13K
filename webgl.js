'use strict';

let glCanvas, glContext, glDrawCount, glDrawCalls, glEnableFog=1;
let glActiveTexture, glShader, glArrayBuffer, glPositionData, glColorData;

///////////////////////////////////////////////////////////////////////////////

function glInit()
{
    // create the canvas
    document.body.appendChild(glCanvas = document.createElement('canvas'));
    glContext = glCanvas.getContext('webgl2', {antialias:false});

    // setup vertex and fragment shaders
    glShader = glCreateProgram(
        '#version 300 es\n' +     // specify GLSL ES version
        'precision highp float;'+ // use highp for better accuracy
        'uniform vec4 l,g,a;' +   // light direction, color, ambient light
        'uniform mat4 m,o;'+      // transform matrix
        'in vec4 p,n,u,c;'+       // position, normal, uv, color
        'out vec4 v,d,e;'+        // return uv, color
        'void main(){'+           // shader entry point
        'e=o*p;'+                 // transform position
        'gl_Position=m*e;'+       // project position
        'd=n.z>1.?c:c*(a+vec4(g.xyz*dot(l.xyz,normalize(transpose(inverse(mat3(o)))*n.xyz)),1));'+ // lighting
        'v=u;'+                   // pass uv to fragment shader
        '}'                       // end of shader
        ,
        '#version 300 es\n' +     // specify GLSL ES version
        'precision highp float;'+ // use highp for better accuracy
        'in vec4 v,d,e;'+         // uv, color, position
        'uniform vec4 f;' +       // fog
        'uniform sampler2D s;'+   // texture
        'out vec4 c;'+            // out color
        'void main(){'+           // shader entry point
        'c=v.z>1.?d:texture(s,v.xy)*d;'+ // color or texture
        //'c=mix(c,vec4(mix(f.xyz,c.xyz,1.-(gl_FragCoord.z/gl_FragCoord.w)/5e4),c.w),f.a);'+ // fog
        'c=v.w>1.?c:vec4(mix(f.xyz,c.xyz,1.-(gl_FragCoord.z/gl_FragCoord.w)/5e4),c.w);'+ // fog
        //'if (c.a == 0.) discard;'+ // discard if no alpha
        '}'                       // end of shader
    );
 
    // init buffers
    const glVertexData = new ArrayBuffer(gl_VERTEX_BUFFER_SIZE);
    glPositionData = new Float32Array(glVertexData);
    glColorData = new Uint32Array(glVertexData);
    
    // set up the shader
    glContext.useProgram(glShader);
    glContext.activeTexture(gl_TEXTURE0);
    glContext.bindTexture(gl_TEXTURE_2D, glActiveTexture);
    glContext.bindBuffer(gl_ARRAY_BUFFER, glArrayBuffer = glContext.createBuffer());
    glContext.bufferData(gl_ARRAY_BUFFER, gl_VERTEX_BUFFER_SIZE, gl_DYNAMIC_DRAW);
    glContext.blendFunc(gl_SRC_ALPHA, gl_ONE_MINUS_SRC_ALPHA);
    glContext.enable(gl_CULL_FACE);
    glContext.enable(gl_BLEND);

    // set vertex attributes
    let offset = 0;
    const vertexAttribute = (name, type, typeSize, size)=>
    {
        const location = glContext.getAttribLocation(glShader, name);
        const normalize = typeSize == 1;
        glContext.enableVertexAttribArray(location);
        glContext.vertexAttribPointer(location, size, type, normalize, gl_VERTEX_BYTE_STRIDE, offset);
        offset += size*typeSize;
    }
    vertexAttribute('p', gl_FLOAT, 4, 4);         // position
    vertexAttribute('n', gl_FLOAT, 4, 4);         // normal
    vertexAttribute('u', gl_FLOAT, 4, 4);         // uv
    vertexAttribute('c', gl_UNSIGNED_BYTE, 1, 4); // color
}

function glPolygonOffset(offset=50, scale=1)
{
    if (offset)
    {
        glContext.enable(gl_POLYGON_OFFSET_FILL);
        glContext.polygonOffset(scale, -offset);
    }
    else
        glContext.disable(gl_POLYGON_OFFSET_FILL);
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
        
    // use point filtering for pixelated rendering
    glContext.texParameteri(gl_TEXTURE_2D, gl_TEXTURE_MIN_FILTER, gl_NEAREST);
    glContext.texParameteri(gl_TEXTURE_2D, gl_TEXTURE_MAG_FILTER, gl_NEAREST);
    return texture;
}

function glPreRender()
{
    // clear and set to same size as main canvas
    glContext.viewport(0, 0, glCanvas.width = mainCanvas.width, glCanvas.height = mainCanvas.height);
    debug && glContext.clearColor(.4, .6, .9, 1);
    glContext.clear(gl_DEPTH_BUFFER_BIT|gl_COLOR_BUFFER_BIT);
    glDrawCalls = glDrawCount = 0;

    // set up the camera
    const viewMatrix = buildMatrix(cameraPos, cameraRot).invertSelf();
    const combinedMatrix = glCreateProjectionMatrix().multiplySelf(viewMatrix);
    glContext.uniformMatrix4fv(glUniform('m'), 0, combinedMatrix.toFloat32Array());

    // set up the lights
    const initUniform4f = (name, x, y, z, w=0)=> glContext.uniform4f(glUniform(name), x, y, z, w);
    initUniform4f('l', lightDirection.x, lightDirection.y, lightDirection.z);
    initUniform4f('g', lightColor.r, lightColor.g, lightColor.b);
    initUniform4f('a', ambientColor.r, ambientColor.g, ambientColor.b);
    initUniform4f('f', fogColor.r, fogColor.g, fogColor.b, fogColor.a);
}

function glCreateProjectionMatrix()
{
    const aspect = mainCanvas.width / mainCanvas.height;
    const fov = .5, f = 1 / Math.tan(fov);
    const near = 1, far = 20, range = far - near;
    return new DOMMatrix
    ([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (near + far) / range, 2 * near * far / range,
        0, 0, -1, 0
    ]);
}

function glUniform(name) { return glContext.getUniformLocation(glShader, name); }

///////////////////////////////////////////////////////////////////////////////
// drawing functions

function glRender(transform=new DOMMatrix())
{
    ASSERT(glDrawCount < gl_MAX_BATCH, 'Too many points!');

    const matrixLocation = glUniform('o');
    const vertexData = glPositionData.subarray(0, glDrawCount * gl_INDICIES_PER_VERT);
    glContext.uniformMatrix4fv(matrixLocation, 0, transform.toFloat32Array());
    glContext.bufferSubData(gl_ARRAY_BUFFER, 0, vertexData);
    glContext.drawArrays(gl_TRIANGLE_STRIP, 0, glDrawCount);
    glDrawCount = 0;
    ++glDrawCalls;
}

function glSetDepthTest(depthTest=true, depthWrite=true)
{
    depthTest ? glContext.enable(gl_DEPTH_TEST) : glContext.disable(gl_DEPTH_TEST);
    glContext.depthMask(depthWrite);
}

function glDrawPoint(pos, normal, uv, rgba)
{
    let offset = glDrawCount * gl_INDICIES_PER_VERT;
    glPositionData[offset++] = pos.x;
    glPositionData[offset++] = pos.y;
    glPositionData[offset++] = pos.z;
    glPositionData[offset++] = 1;
    glPositionData[offset++] = normal.x;
    glPositionData[offset++] = normal.y;
    glPositionData[offset++] = enableLighting ? normal.z : 9;
    glPositionData[offset++] = 0;
    glPositionData[offset++] = uv.x;
    glPositionData[offset++] = uv.y;
    glPositionData[offset++] = enableTexture ? uv.z : 9;
    glPositionData[offset++] = glEnableFog ? 0 : 9;
    glColorData[offset++] = rgba;
    ++glDrawCount;
}

function glPushPoints(points, normals, color=WHITE, uvs, makePoly)
{
    const totalPoints = makePoly ? points.length + 2 : points.length;
    ASSERT(totalPoints < gl_MAX_BATCH - glDrawCount, 'Too many points!');
    
    const rgba = color.rgbaInt();
    const na = vec3(9); // z > 1 means no lighting/texture
    for(let i=0; i<totalPoints; i++)
    {
        const j = makePoly ? clamp(i-1, 0, points.length-1) : i;
        glDrawPoint(points[j], normals ? normals[j] : na, uvs ? uvs[j] : na, rgba);
    }
}

function glPushColoredPoints(points, colors)
{
    const totalPoints = points.length;
    ASSERT(totalPoints < gl_MAX_BATCH - glDrawCount, 'Too many points!');
    
    const na = vec3(9); // z > 1 means no lighting/texture
    for(let i = 0; i < totalPoints; i++)
        glDrawPoint(points[i], na, na, colors[i].rgbaInt());
}

function glPushMonoColoredPoints(points, color)
{
    const totalPoints = points.length;
    ASSERT(totalPoints < gl_MAX_BATCH - glDrawCount, 'Too many points!');
    
    const na = vec3(9); // z > 1 means no lighting/texture
    for(let i = 0; i < totalPoints; i++)
        glDrawPoint(points[i], na, na, color.rgbaInt());
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
gl_MAX_BATCH = 1e5,
gl_INDICIES_PER_VERT =  (1 * 4) * 3 + (1) * 1, // vec4 * 3 + color
gl_VERTEX_BYTE_STRIDE = (4 * 4) * 3 + (4) * 1, // vec4 * 3 + color
gl_VERTEX_BUFFER_SIZE = gl_MAX_BATCH * gl_INDICIES_PER_VERT * 4;