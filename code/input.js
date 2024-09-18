'use strict';

const allowTouch = enhancedMode;
const gamepadsEnable = enhancedMode;
const inputWASDEmulateDirection = enhancedMode;
const gamepadDirectionEmulateStick = 1;
const isTouchDevice = allowTouch && window.ontouchstart !== undefined;

let mousePos;
let inputData = [];
let isUsingGamepad;

function inputUpdate()
{
    // clear input when lost focus (prevent stuck keys)
    isTouchDevice || document.hasFocus() || clearInput();
    gamepadsEnable && gamepadsUpdate();
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
const keyWasPressed = (key) => inputData[key] & 2 ? 1 : 0;
const keyWasReleased = (key) => inputData[key] & 4 ? 1 : 0;
const clearInput = () => inputData = [];
const mouseIsDown = keyIsDown;
const mouseWasPressed = keyWasPressed;
const mouseWasReleased = keyWasReleased;

const gamepadIsDown = (key, gamepad=0) => !!(gamepadData[gamepad][key] & 1); 
const gamepadWasPressed = (key, gamepad=0) => !!(gamepadData[gamepad][key] & 2); 
const gamepadWasReleased = (key, gamepad=0) => !!(gamepadData[gamepad][key] & 4); 
const gamepadStick = (stick, gamepad=0) =>
    stickData[gamepad] ? stickData[gamepad][stick] || vec3() : vec3();

///////////////////////////////////////////////////////////////////////////////
// Input event handlers

function inputInit()
{
    onkeydown = (e)=>
    {
        isUsingGamepad = 0;
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
        isUsingGamepad = 0;
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

///////////////////////////////////////////////////////////////////////////////
// gamepad input

// gamepad internal variables
let gamepadData, stickData;

// gamepads are updated by engine every frame automatically
function gamepadsUpdate()
{
    // only poll gamepads when focused or in debug mode (allow playing when not focused in debug)
    if (!enhancedMode && !document.hasFocus())
        return;

    // return if gamepads are disabled or not supported
    if (!navigator || !navigator.getGamepads)
        return;

    if (!gamepadData) // init
        gamepadData = [], stickData = [];

    const applyDeadZones = (v)=>
    {
        const min=.3, max=.8;
        const deadZone = (v)=> 
            v >  min ?  percent( v, min, max) : 
            v < -min ? -percent(-v, min, max) : 0;
        return vec3(deadZone(v.x), deadZone(-v.y)).clampLength();
    }

    // poll gamepads
    const gamepads = navigator.getGamepads();
    for (let i = gamepads.length; i--;)
    {
        // get or create gamepad data
        const gamepad = gamepads[i];
        const data = gamepadData[i] || (gamepadData[i] = []);
        const sticks = stickData[i] || (stickData[i] = []);

        if (gamepad)
        {
            // read analog sticks
            for (let j = 0; j < gamepad.axes.length-1; j+=2)
                sticks[j>>1] = applyDeadZones(vec3(gamepad.axes[j],gamepad.axes[j+1]));
            
            // read buttons
            for (let j = gamepad.buttons.length; j--;)
            {
                const button = gamepad.buttons[j];
                const wasDown = gamepadIsDown(j,i);
                data[j] = button.pressed ? wasDown ? 1 : 3 : wasDown ? 4 : 0;
                isUsingGamepad ||= !i && button.pressed;
            }

            if (gamepadDirectionEmulateStick)
            {
                // copy dpad to left analog stick when pressed
                const dpad = vec3(
                    (gamepadIsDown(15,i)&&1) - (gamepadIsDown(14,i)&&1), 
                    (gamepadIsDown(12,i)&&1) - (gamepadIsDown(13,i)&&1));
                if (dpad.lengthSquared())
                    sticks[0] = dpad.clampLength();
            }
        }
    }
}
