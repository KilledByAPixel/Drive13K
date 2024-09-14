'use strict';

const allowTouch = debug;
const inputWASDEmulateDirection = debug; // only in debug to save space

const isTouchDevice = allowTouch && window.ontouchstart !== undefined;
let mousePos = vec3();
let inputData = [];

function inputUpdate()
{
    // clear input when lost focus (prevent stuck keys)
    isTouchDevice || document.hasFocus() || clearInput();
}

function inputUpdatePost()
{
    // clear input to prepare for next frame
    for (const i in inputData)
        inputData[i] &= 1;
}

///////////////////////////////////////////////////////////////////////////////
// Input functions

const keyIsDown = (key) => inputData[key] & 1; 
const keyWasPressed = (key) => (inputData[key]>>1) & 1; 
const keyWasReleased = (key) => (inputData[key]>>2) & 1; 
const clearInput = () => inputData = [];
const mouseIsDown = keyIsDown;
const mouseWasPressed = keyWasPressed;
const mouseWasReleased = keyWasReleased;

///////////////////////////////////////////////////////////////////////////////
// Input event handlers

function inputInit()
{
    onkeydown = (e)=>
    {
        if (!e.repeat)
        {
            inputData[e.code] = 3;
            if (inputWASDEmulateDirection)
                inputData[remapKey(e.code)] = 3;
        }
    }

    onkeyup = (e)=>
    {
        inputData[e.code] = 4;
        if (inputWASDEmulateDirection)
            inputData[remapKey(e.code)] = 4;
    }
    
    // mouse event handlers
    onmousedown   = (e)=>
    {
        inputData[e.button] = 3; 
        mousePos = mouseToScreen(vec3(e.x,e.y)); 
        //e.button && e.preventDefault();
    }
    onmouseup     = (e)=> inputData[e.button] = inputData[e.button] & 2 | 4;
    onmousemove   = (e)=> mousePos = mouseToScreen(vec3(e.x,e.y));
    oncontextmenu = (e)=> false; // prevent right click menu

    // handle remapping wasd keys to directions
    const remapKey = (c) => inputWASDEmulateDirection ? 
        c == 'KeyW' ? 'ArrowUp' : 
        c == 'KeyS' ? 'ArrowDown' : 
        c == 'KeyA' ? 'ArrowLeft' : 
        c == 'KeyD' ? 'ArrowRight' : c : c;
        
    // convert a mouse position to screen space
    const mouseToScreen = (mousePos) =>
    {
        if (!clampAspectRatios)
        {
            // canvas always takes up full screen
            return vec3(mousePos.x/mainCanvasSize.x,mousePos.y/mainCanvasSize.y);
        }
        else
        {
            const rect = mainCanvas.getBoundingClientRect();
            return vec3(percent(mousePos.x, rect.left, rect.right), percent(mousePos.y, rect.top, rect.bottom));
        }
    }

    // init touch input
    isTouchDevice && touchInputInit();
        
    // try to enable touch mouse
    function touchInputInit()
    {
        // override mouse events
        let wasTouching;
        onmousedown = onmouseup = ()=> 0;

        document.addEventListener('touchstart', (e) => handleTouch(e), { passive: false });
        document.addEventListener('touchmove', (e) => handleTouch(e), { passive: false });
        document.addEventListener('touchend', (e) => handleTouch(e), { passive: false });

        // handle all touch events the same way
        function handleTouch(e)
        {
            // fix stalled audio requiring user interaction
            if (soundEnable && !audioContext)
                audioContext = new AudioContext; // create audio context
            //if (soundEnable && audioContext && audioContext.state != 'running')
            //    sound_bump.play(); // play sound to fix audio

            // check if touching and pass to mouse events
            const touching = e.touches.length;
            const button = 0; // all touches are left mouse button
            if (touching)
            {
                // average all touch positions
                const p = vec3();
                for (let touch of e.touches)
                {
                    p.x += touch.clientX/e.touches.length;
                    p.y += touch.clientY/e.touches.length;
                }

                mousePos = mouseToScreen(p);
                wasTouching ? 0 : inputData[button] = 3;
            }
            else if (wasTouching)
                inputData[button] = inputData[button] & 2 | 4;

            // set was touching
            wasTouching = touching;

            // prevent default handling like copy and magnifier lens
            if (document.hasFocus()) // allow document to get focus
                e.preventDefault();
            
            // must return true so the document will get focus
            return true;
        }
    }
}