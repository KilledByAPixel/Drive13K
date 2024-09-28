'use strict';

const debug = 0;
let debugInfo, debugMesh, debugTile, debugGenerativeCanvas, devMode, enhancedMode;
const js13kBuildLevel2 = 1; // more space is needed for js13k

// disable debug features
function ASSERT() {}
function debugInit() {}
function drawDebug() {}
function debugUpdate() {}
function debugSaveCanvas() {}
function debugSaveText() {}
function debugDraw() {}
function debugSaveDataURL() {}