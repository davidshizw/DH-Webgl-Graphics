// Directional lighting demo: By Frederick Li
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +        // Normal
  'attribute vec2 a_TexCoords;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'varying vec4 v_Color;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec2 v_TexCoords;\n' +
  'varying vec3 v_Position;\n' +
  'void main() {\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
    // Calculate the vertex position in the world coordinate
  '  v_Position = vec3(u_ModelMatrix * a_Position);\n' +
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '  v_Color = a_Color;\n' +
  '  v_TexCoords = a_TexCoords;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform vec3 u_LightColor;\n' +     // Light color
  'uniform vec3 u_LightPosition;\n' +  // Position of the light source
  'uniform vec3 u_AmbientLight;\n' +   // Ambient light color
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'varying vec4 v_Color;\n' +
  'uniform sampler2D u_Sampler;\n' +
  'varying vec2 v_TexCoords;\n' +
  'void main() {\n' +
     // Normalize the normal because it is interpolated and not 1.0 in length any more
  '  vec3 normal = normalize(v_Normal);\n' +
     // Calculate the light direction and make its length 1.
  '  vec3 lightDirection = normalize(u_LightPosition - v_Position);\n' +
     // The dot product of the light direction and the orientation of a surface (the normal)
  '  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
     // Calculate the final color from diffuse reflection and ambient reflection
  '  vec4 TexColor = texture2D(u_Sampler, v_TexCoords);\n' +
  '  vec3 diffuse = u_LightColor * TexColor.rgb * nDotL * 1.2;\n' +
  '  vec3 ambient = u_AmbientLight * v_Color.rgb;\n' +
  '  gl_FragColor = vec4(diffuse + ambient, v_Color.a);\n' +
  '}\n';

var modelMatrix = new Matrix4(); // The model matrix
var viewMatrix = new Matrix4();  // The view matrix
var projMatrix = new Matrix4();  // The projection matrix
var g_normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals

var PERSPECTIVE_STEP = 2.0;
var perspective = 20;

var ANGLE_STEP = 3.0;  // The increments of rotation angle (degrees)
var g_xAngle = 0.0;    // The rotation x angle (degrees)
var g_yAngle = 0.0;    // The rotation y angle (degrees)

var wheelRotation = 0.0;
var speed = 0.04;
var distance = -1.75;
var speed2 = 0.06;
var distance2 = -1.75;

var humanWaving = 0.0;
var WAVING_ANGLE = 35.0;
var walkDistance = -1.95;
var walkSpeed = 0.02;

var traffic = 0.0;
var currentLight = 1;

var leftDoor = false;
var rightDoor = false;

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Set clear color and enable hidden surface removal
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Get the storage locations of uniform attributes
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
  var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');

  if (!u_ModelMatrix || !u_ViewMatrix || !u_NormalMatrix || !u_ProjMatrix || !u_LightColor || !u_LightPosition　|| !u_AmbientLight) {
    console.log('Failed to get the storage location');
    return;
  }

  // Set the light color (white)
  gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
  // Set the light direction (in the world coordinate)
  gl.uniform3f(u_LightPosition, 2.3, 4.0, 3.5);
  // Set the ambient light
  gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);

  // Calculate the view matrix and the projection matrix
  viewMatrix.setLookAt(0, 0, 15, 0, 0, -100, 0, 1, 0);
  projMatrix.setPerspective(perspective, canvas.width/canvas.height, 1, 100);

  // Pass the model, view, and projection matrix to the uniform variable respectively
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

  document.onkeydown = function(ev){
    switch (ev.keyCode) {
      case 40: // Up arrow key -> the positive rotation of arm1 around the y-axis
        g_xAngle = (g_xAngle + ANGLE_STEP) % 360;
        break;
      case 38: // Down arrow key -> the negative rotation of arm1 around the y-axis
        g_xAngle = (g_xAngle - ANGLE_STEP) % 360;
        break;
      case 39: // Right arrow key -> the positive rotation of arm1 around the y-axis
        g_yAngle = (g_yAngle + ANGLE_STEP) % 360;
        break;
      case 37: // Left arrow key -> the negative rotation of arm1 around the y-axis
        g_yAngle = (g_yAngle - ANGLE_STEP) % 360;
        break;
      default: return; // Skip drawing at no effective action
    }
  };

  document.onwheel = function(e){
    if(e.wheelDelta > 0){
      if(perspective >= 50){
        alert("The perspective parameter should be in range (1,51).");
        return;
      }
      perspective += PERSPECTIVE_STEP;
    } else{
      if(perspective <= 2){
        alert("The perspective parameter should be in range (1,51).");
        return;
      }
      perspective -= PERSPECTIVE_STEP;
    }
    var proj = new Matrix4();
    proj.setPerspective(perspective, canvas.width/canvas.height, 1, 100);
    gl.uniformMatrix4fv(u_ProjMatrix, false, proj.elements);
    document.getElementById("perspective").value = perspective;
    document.getElementById("perspective-value").innerHTML = perspective;
  }

  document.getElementById("perspective").onchange = function(){
    perspective = this.value;
    var proj = new Matrix4();
    proj.setPerspective(perspective, canvas.width/canvas.height, 1, 100);
    gl.uniformMatrix4fv(u_ProjMatrix, false, proj.elements);
  }

  document.getElementById("x-view").onchange = function(){
    var view = new Matrix4();
    view.setLookAt(this.value,document.getElementById("y-view").value,document.getElementById("z-view").value,0,0,-100,0,1,0)
    gl.uniformMatrix4fv(u_ViewMatrix, false, view.elements);
  }

  document.getElementById("y-view").onchange = function(){
    var view = new Matrix4();
    view.setLookAt(document.getElementById("x-view").value,this.value,document.getElementById("z-view").value,0,0,-100,0,1,0)
    gl.uniformMatrix4fv(u_ViewMatrix, false, view.elements);
  }

  document.getElementById("z-view").onchange = function(){
    var view = new Matrix4();
    view.setLookAt(document.getElementById("x-view").value,document.getElementById("y-view").value,this.value,0,0,-100,0,1,0)
    gl.uniformMatrix4fv(u_ViewMatrix, false, view.elements);
  }

  document.getElementById("left").onclick = function(){
    if(leftDoor){
      leftDoor = false;
    } else{
      leftDoor = true;
    }
  };

  document.getElementById("right").onclick = function(){
    if(rightDoor){
      rightDoor = false;
    } else{
      rightDoor = true;
    }
  };

  document.getElementById("human+").onclick = function(){
    walkSpeed += 0.01;
  };

  document.getElementById("human-").onclick = function(){
    if(walkSpeed < 0.015){
      alert("Cannot set the walking speed to non-positive")
      return;
    }
    walkSpeed -= 0.01;
  };

  document.getElementById("red+").onclick = function(){
    speed += 0.02;
  };

  document.getElementById("red-").onclick = function(){
    if(speed < 0.03){
      alert("Cannot set the red car speed to non-positive")
      return;
    }
    speed -= 0.02;
  };

  document.getElementById("green+").onclick = function(){
    speed2 += 0.02;
  };

  document.getElementById("green-").onclick = function(){
    console.log(speed2)
    if(speed2 < 0.03){
      alert("Cannot set the green car speed to non-positive")
      return;
    }
    speed2 -= 0.02;
  };


  var then = 0;

  // Draw the scene repeatedly
  function render(now){
    now *= 0.001; // convert to seconds
    const deltaTime = now - then;
    then = now;
    draw(gl, u_ModelMatrix, u_NormalMatrix, deltaTime);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render)
}

function initPersonBuffers(gl) {

  var vertices = new Float32Array([   // Coordinates
    0.5, 0.0, 0.5,  -0.5, 0.0, 0.5,  -0.5,-1.0, 0.5,   0.5,-1.0, 0.5, // v0-v1-v2-v3 front
    0.5, 0.0, 0.5,   0.5,-1.0, 0.5,   0.5,-1.0,-0.5,   0.5, 0.0,-0.5, // v0-v3-v4-v5 right
    0.5, 0.0, 0.5,   0.5, 0.0,-0.5,  -0.5, 0.0,-0.5,  -0.5, 0.0, 0.5, // v0-v5-v6-v1 up
   -0.5, 0.0, 0.5,  -0.5, 0.0,-0.5,  -0.5,-1.0,-0.5,  -0.5,-1.0, 0.5, // v1-v6-v7-v2 left
   -0.5,-1.0,-0.5,   0.5,-1.0,-0.5,   0.5,-1.0, 0.5,  -0.5,-1.0, 0.5, // v7-v4-v3-v2 down
    0.5,-1.0,-0.5,  -0.5,-1.0,-0.5,  -0.5, 0.0,-0.5,   0.5, 0.0,-0.5  // v4-v7-v6-v5 back
  ]);


  var colors = new Float32Array([    // Colors
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,     // v1-v1-v2-v3 front
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,     // v1-v3-v4-v5 right
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,     // v1-v5-v6-v1 up
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,     // v1-v6-v7-v2 left
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,     // v7-v4-v3-v2 down
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1　    // v4-v7-v6-v5 back
 ]);


  var normals = new Float32Array([    // Normal
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
  ]);

  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
 ]);


  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}


function initVertexBuffers(gl) {

  var vertices = new Float32Array([   // Coordinates
    1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0, // v0-v1-v2-v3 front
    1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0, // v0-v3-v4-v5 right
    1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0, // v0-v5-v6-v1 up
   -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0, // v1-v6-v7-v2 left
   -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0, // v7-v4-v3-v2 down
    1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0  // v4-v7-v6-v5 back
  ]);


  var colors = new Float32Array([    // Colors
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,     // v1-v1-v2-v3 front
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,     // v1-v3-v4-v5 right
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,     // v1-v5-v6-v1 up
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,     // v1-v6-v7-v2 left
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,     // v7-v4-v3-v2 down
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1　    // v4-v7-v6-v5 back
 ]);


  var normals = new Float32Array([    // Normal
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
  ]);

  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
 ]);


  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function initGableBuffers(gl) {

  var vertices = new Float32Array([   // Coordinates
    1,-1,-1,  0,1,-1,   -1,-1,-1,  -1,-1,-1,     //front triangle
    -1,-1,1,  0,1,1,    0,1,-1,    -1,-1,-1,     //right
    0,1,1,    0,1,-1,   0,1,1,     0,1,-1,        //nothing
    1,-1,1,   0,1,1,    0,1,-1,    1,-1,-1,      //left
    1,-1,1,   -1,-1,1,  -1,-1,-1,  1,-1,-1,      //down
    1,-1,1,   -1,-1,1,  0,1,1,     0,1,1         //back triangle
  ]);


  var colors = new Float32Array([    // Colors
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1　
 ]);


  var normals = new Float32Array([    // Normal
    0,0,-1,  0,0,-1,  0,0,-1,  0,0,-1,     //front triangle
    -2,1,0,  -2,1,0,  -2,1,0,  -2,1,0,     //right
    0,1,0,   0,1,0,   0,1,0,   0,1,0,      //nothing
    2,1,0,   2,1,0,   2,1,0,   2,1,0,      //left
    0,-1,0,  0,-1,0,  0,-1,0,  0,-1,0,     //down
    0,0,1,   0,0,1,   0,0,1,   0,0,1       //back triangle
  ]);


  // Indices of the vertices
  var indices = new Uint8Array([
    0, 1, 2,   0, 2, 3,    // front
    4, 5, 6,   4, 6, 7,    // right
    8, 9,10,   8,10,11,    // up
   12,13,14,  12,14,15,    // left
   16,17,18,  16,18,19,    // down
   20,21,22,  20,22,23     // back
 ]);


  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function initShedBuffers(gl) {

  var offset = 0.66;

  var vertices = new Float32Array([   // Coordinates
    -1,-1,1,       1,-1,1,       -1,1,offset,   -1,1,offset,            //front triangle
    1,-1,-1,       1,-1,1,       -1,1,offset,   -1,1,-offset,           //right
    -1,1,-offset,  -1,1,offset,  -1,1,-offset,  -1,1,offset,             //nothing
    -1,-1,-1,      -1,-1,1,      -1,1,offset,   -1,1,-offset,           //left
    -1,-1,-1,      1,-1,-1,      1,-1,1,        -1,-1,1,                //down
    -1,-1,-1,      1,-1,-1,      -1,1,-offset,  -1,1,-offset            //back triangle
  ]);


  var colors = new Float32Array([    // Colors
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1　
  ]);

  var q = -2/(1-offset)

  var normals = new Float32Array([    // Normal
    0,1,-q,  0,1,-q,  0,1,-q,  0,1,-q,   //front triangle
    1,1,0,   1,1,0,   1,1,0,   1,1,0,    //right
    0,1,0,   0,1,0,   0,1,0,   0,1,0,    //nothing
    -1,0,0,  -1,0,0,  -1,0,0,  -1,0,0,   //left
    0,-1,0,  0,-1,0,  0,-1,0,  0,-1,0,   //down
    0,1,q,   0,1,q,   0,1,q,   0,1,q     //back triangle
  ]);


  // Indices of the vertices
  var indices = new Uint8Array([
    0, 1, 2,   0, 2, 3,    // front
    4, 5, 6,   4, 6, 7,    // right
    8, 9,10,   8,10,11,    // up
   12,13,14,  12,14,15,    // left
   16,17,18,  16,18,19,    // down
   20,21,22,  20,22,23     // back
 ]);


  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function initPrismBuffers(gl, p, isRightAngle) {

  var offset = p;

  var vertices = null;
  var normals = null;

  if(!isRightAngle){
    vertices= new Float32Array([   // Coordinates
      1.0-offset, 1.0, 1.0,   -1.0+offset, 1.0, 1.0,   -1.0+offset,-1.0, 1.0,   1.0-offset,-1.0, 1.0,  // v0-v1-v2-v3 front
      1.0-offset, 1.0, 1.0,   1.0-offset,-1.0, 1.0,    1.0,-1.0,-1.0,           1.0, 1.0,-1.0,         // v0-v3-v4-v5 right
      1.0-offset, 1.0, 1.0,   1.0, 1.0,-1.0,           -1.0, 1.0,-1.0,          -1.0+offset, 1.0, 1.0, // v0-v5-v6-v1 up
     -1.0+offset, 1.0, 1.0,   -1.0, 1.0,-1.0,          -1.0,-1.0,-1.0,          -1.0+offset,-1.0, 1.0, // v1-v6-v7-v2 left
     -1.0,-1.0,-1.0,          1.0,-1.0,-1.0,           1.0-offset,-1.0, 1.0,    -1.0+offset,-1.0, 1.0, // v7-v4-v3-v2 down
      1.0,-1.0,-1.0,          -1.0,-1.0,-1.0,          -1.0, 1.0,-1.0,          1.0, 1.0,-1.0          // v4-v7-v6-v5 back
    ]);
    normals = new Float32Array([    // Normal
      0.0, 0.0, 1.0,      0.0, 0.0, 1.0,       0.0, 0.0, 1.0,      0.0, 0.0, 1.0,      // v0-v1-v2-v3 front
      2.0, 0.0, offset,   2.0, 0.0, offset,    2.0, 0.0, offset,   2.0, 0.0, offset,   // v0-v3-v4-v5 right
      0.0, 1.0, 0.0,      0.0, 1.0, 0.0,       0.0, 1.0, 0.0,      0.0, 1.0, 0.0,      // v0-v5-v6-v1 up
     -2.0, 0.0, offset,   -2.0, 0.0, offset,   -2.0, 0.0, offset,  -2.0, 0.0, offset,  // v1-v6-v7-v2 left
      0.0,-1.0, 0.0,      0.0,-1.0, 0.0,       0.0,-1.0, 0.0,      0.0,-1.0, 0.0,      // v7-v4-v3-v2 down
      0.0, 0.0,-1.0,      0.0, 0.0,-1.0,       0.0, 0.0,-1.0,      0.0, 0.0,-1.0       // v4-v7-v6-v5 back
    ]);
  } else{
    vertices= new Float32Array([   // Coordinates
      1.0, 1.0, 1.0,   -1.0+offset, 1.0, 1.0,   -1.0+offset,-1.0, 1.0,   1.0,-1.0, 1.0,  // v0-v1-v2-v3 front
      1.0, 1.0, 1.0,   1.0,-1.0, 1.0,    1.0,-1.0,-1.0,           1.0, 1.0,-1.0,         // v0-v3-v4-v5 right
      1.0, 1.0, 1.0,   1.0, 1.0,-1.0,           -1.0, 1.0,-1.0,          -1.0+offset, 1.0, 1.0, // v0-v5-v6-v1 up
     -1.0+offset, 1.0, 1.0,   -1.0, 1.0,-1.0,          -1.0,-1.0,-1.0,          -1.0+offset,-1.0, 1.0, // v1-v6-v7-v2 left
     -1.0,-1.0,-1.0,          1.0,-1.0,-1.0,           1.0,-1.0, 1.0,    -1.0+offset,-1.0, 1.0, // v7-v4-v3-v2 down
      1.0,-1.0,-1.0,          -1.0,-1.0,-1.0,          -1.0, 1.0,-1.0,          1.0, 1.0,-1.0          // v4-v7-v6-v5 back
    ]);
    normals = new Float32Array([    // Normal
      0.0, 0.0, 1.0,      0.0, 0.0, 1.0,       0.0, 0.0, 1.0,      0.0, 0.0, 1.0,      // v0-v1-v2-v3 front
      1.0, 0.0, 0.0,   1.0, 0.0, 0.0,    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   // v0-v3-v4-v5 right
      0.0, 1.0, 0.0,      0.0, 1.0, 0.0,       0.0, 1.0, 0.0,      0.0, 1.0, 0.0,      // v0-v5-v6-v1 up
     -2.0, 0.0, offset,   -2.0, 0.0, offset,   -2.0, 0.0, offset,  -2.0, 0.0, offset,  // v1-v6-v7-v2 left
      0.0,-1.0, 0.0,      0.0,-1.0, 0.0,       0.0,-1.0, 0.0,      0.0,-1.0, 0.0,      // v7-v4-v3-v2 down
      0.0, 0.0,-1.0,      0.0, 0.0,-1.0,       0.0, 0.0,-1.0,      0.0, 0.0,-1.0       // v4-v7-v6-v5 back
    ]);
  }


  var colors = new Float32Array([    // Colors
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,     // v0-v1-v2-v3 front
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,     // v0-v3-v4-v5 right
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,     // v0-v5-v6-v1 up
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,     // v1-v6-v7-v2 left
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,     // v7-v4-v3-v2 down
    1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 0　    // v4-v7-v6-v5 back
 ]);

  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
 ]);


  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function initArrayBuffer (gl, attribute, data, num, type) {

  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  // Element size
  var FSIZE = data.BYTES_PER_ELEMENT;

  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, gl.FLOAT, false, FSIZE * num, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return true;
}

var g_matrixStack = []; // Array for storing a matrix
function pushMatrix(m) { // Store the specified matrix to the array
  var m2 = new Matrix4(m);
  g_matrixStack.push(m2);
}

function popMatrix() { // Retrieve the matrix from the array
  return g_matrixStack.pop();
}


function draw(gl, u_ModelMatrix, u_NormalMatrix, deltaTime) {

  // Rotate, and then translate
  modelMatrix.setTranslate(0, 0, 0);  // Translation (No translation is supported here)
  modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis


  // Get the storage location of u_Sampler
  var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
  if (!u_Sampler) {
    console.log('Failed to get the storage location of u_Sampler');
    return false;
  }

  var Floortexture = gl.createTexture();   // Create a texture object
  if (!Floortexture) {
    console.log('Failed to create the texture object');
    return false;
  }

  var Walltexture = gl.createTexture();   // Create a texture object
  if (!Walltexture) {
    console.log('Failed to create the texture object');
    return false;
  }

  var Glasstexture = gl.createTexture();
  if(!Glasstexture){
    console.log('Failed to create the texture object');
    return false;
  }

  var Doortexture = gl.createTexture();
  if(!Doortexture){
    console.log('Failed to create the texture object');
    return false;
  }

  var Roadtexture = gl.createTexture();
  if(!Roadtexture){
    console.log('Failed to create the texture object');
    return false;
  }

  var Roadtexture2 = gl.createTexture();
  if(!Roadtexture2){
    console.log('Failed to create the texture object');
    return false;
  }

  var Roadtexture3 = gl.createTexture();
  if(!Roadtexture3){
    console.log('Failed to create the texture object');
    return false;
  }

  Floortexture.image = new Image();  // Create the image object
  if (!Floortexture.image) {
    console.log('Failed to create the image object');
    return false;
  }

  Walltexture.image = new Image();  // Create the image object
  if (!Walltexture.image) {
    console.log('Failed to create the image object');
    return false;
  }

  Glasstexture.image = new Image();  // Create the image object
  if (!Glasstexture.image) {
    console.log('Failed to create the image object');
    return false;
  }

  Doortexture.image = new Image();  // Create the image object
  if (!Doortexture.image) {
    console.log('Failed to create the image object');
    return false;
  }

  Roadtexture.image = new Image();  // Create the image object
  if (!Roadtexture.image) {
    console.log('Failed to create the image object');
    return false;
  }

  Roadtexture2.image = new Image();  // Create the image object
  if (!Roadtexture2.image) {
    console.log('Failed to create the image object');
    return false;
  }

  Roadtexture3.image = new Image();  // Create the image object
  if (!Roadtexture3.image) {
    console.log('Failed to create the image object');
    return false;
  }

  road_offset = 0.4

  Roadtexture.image.onload = function(){
    var n = initVertexBuffers(gl);
    if (n < 0) {
      console.log('Failed to set the vertex information');
      return;
    }
    pushMatrix(modelMatrix);
      modelMatrix.translate(0, -1, 2.08)
      modelMatrix.scale(2, 0.02, 0.3); // Scale
      resetTexCoords(gl, road_offset, 2, 0.02, 0.5, 0, 0, 1, 0, 0, 0)
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Roadtexture, u_Sampler);
    modelMatrix = popMatrix();
  }
  Roadtexture.image.src = "src/grassroad.jpg"

  Roadtexture2.image.onload = function(){
    var n = initVertexBuffers(gl);
    if (n < 0) {
      console.log('Failed to set the vertex information');
      return;
    }
    pushMatrix(modelMatrix);
      modelMatrix.translate(0, -1, 2.68)
      modelMatrix.scale(2, 0.02, 0.3); // Scale
      resetTexCoords(gl, road_offset, 2, 0.02, 0.5, 0, 0, 1, 0, 0, 0)
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Roadtexture2, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(0, -1, 3.36)
      modelMatrix.scale(2, 0.02, 0.3); // Scale
      resetTexCoords(gl, road_offset, 2, 0.02, 0.5, 0, 0, 1, 0, 0, 0)
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Roadtexture2, u_Sampler);
    modelMatrix = popMatrix();
  }
  Roadtexture2.image.src = "src/asphalt.jpg"

  Roadtexture3.image.onload = function(){
    var n = initVertexBuffers(gl);
    if (n < 0) {
      console.log('Failed to set the vertex information');
      return;
    }
    pushMatrix(modelMatrix);
      modelMatrix.translate(0, -1, 3.02)
      modelMatrix.scale(2, 0.02, 0.04); // Scale
      resetTexCoords(gl, road_offset, 2, 0.02, 0.5, 0, 0, 1, 0, 0, 0)
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Roadtexture3, u_Sampler);
    modelMatrix = popMatrix();
  }
  Roadtexture3.image.src = "src/white_asphalt.jpg"


  floor_offset = 0.35
  // Tell the browser to load an image
  // Register the event handler to be called on loading an image
  Floortexture.image.onload = function(){
    var n = initVertexBuffers(gl);
    if (n < 0) {
      console.log('Failed to set the vertex information');
      return;
    }

    //Model the plane
    //front
    pushMatrix(modelMatrix);
      modelMatrix.translate(0, -1, 1.48)
      modelMatrix.scale(2, 0.02, 0.3); // Scale
      resetTexCoords(gl, floor_offset, 2, 0.02, 0.41, 0, 0, 1, 0, 0, 0)
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Floortexture, u_Sampler);
    modelMatrix = popMatrix();

    //back
    pushMatrix(modelMatrix);
      modelMatrix.translate(0, -1, -1.59)
      modelMatrix.scale(2, 0.02, 0.41); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Floortexture, u_Sampler);
    modelMatrix = popMatrix();
    //right
    pushMatrix(modelMatrix);
      modelMatrix.translate(1.77, -1, 0)
      modelMatrix.scale(0.23, 0.02, 1.18); // Scale
      resetTexCoords(gl, floor_offset, 0.23, 0.02, 1.18, 0, 0, 1, 0, 0, 0)
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Floortexture, u_Sampler);
    modelMatrix = popMatrix();
    //left
    pushMatrix(modelMatrix);
      modelMatrix.translate(-1.77, -1, 0)
      modelMatrix.scale(0.23, 0.02, 1.18); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Floortexture, u_Sampler);
    modelMatrix = popMatrix();
    //left corners ??? 1.24 and 1.01
    pushMatrix(modelMatrix);
      modelMatrix.translate(-1.24, -1, 1.01)
      modelMatrix.scale(0.3, 0.02, 0.17); // Scale
      resetTexCoords(gl, floor_offset, 0.3, 0.02, 0.17, 0, 0, 1, 0, 0, 0)
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Floortexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(-1.24, -1, -1.01)
      modelMatrix.scale(0.3, 0.02, 0.17); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Floortexture, u_Sampler);
    modelMatrix = popMatrix();
    //right corners ??? 1.24 and 1.01
    pushMatrix(modelMatrix);
      modelMatrix.translate(1.24, -1, 1.01)
      modelMatrix.scale(0.3, 0.02, 0.17); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Floortexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(1.24, -1, -1.01)
      modelMatrix.scale(0.3, 0.02, 0.17); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Floortexture, u_Sampler);
    modelMatrix = popMatrix();

    var a = initPrismBuffers(gl,0.54,false);
    if (a < 0) {
      console.log('Failed to set the vertex information');
      return;
    }

    // Model the prism gap - front gap
    pushMatrix(modelMatrix);
      modelMatrix.translate(0, -1, 1.06)
      modelMatrix.rotate(180,0,1,0)
      modelMatrix.scale(0.195, 0.02, 0.12); // Scale
      resetTexCoords(gl, floor_offset, 0.195, 0.02, 0.12, 0, 0, 1, 0, 0, 0)
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, a, Floortexture, u_Sampler);
    modelMatrix = popMatrix();

    // Model the prism gap - back gap
    pushMatrix(modelMatrix);
      modelMatrix.translate(0, -1, -1.06)
      modelMatrix.scale(0.195, 0.02, 0.12); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, a, Floortexture, u_Sampler);
    modelMatrix = popMatrix();

    var b = initPrismBuffers(gl,0.86,true);
    if (b < 0) {
      console.log('Failed to set the vertex information');
      return;
    }

    // Model the right angle corner gap
    //front left
    pushMatrix(modelMatrix);
      modelMatrix.translate(-0.827, -1, 1.06);
      modelMatrix.rotate(180,0,1,0)
      modelMatrix.scale(0.118, 0.02, 0.12); // Scale
      resetTexCoords(gl, floor_offset, 0.118, 0.02, 0.12, 0, 0, 1, 0, 0, 0)
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, b, Floortexture, u_Sampler);
    modelMatrix = popMatrix();
    //front right
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.827, -1, 1.06);
      modelMatrix.rotate(180,1,0,0)
      modelMatrix.scale(0.118, 0.02, 0.12); // Scale
      resetTexCoords(gl, floor_offset, 0.118, 0.02, 0.12, 0, 0, 0, 0, 1, 0)
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, b, Floortexture, u_Sampler);
    modelMatrix = popMatrix();
    //back left
    pushMatrix(modelMatrix);
      modelMatrix.translate(-0.827, -1, -1.06);
      modelMatrix.rotate(180,0,0,1)
      modelMatrix.scale(0.118, 0.02, 0.12); // Scale
      resetTexCoords(gl, floor_offset, 0.118, 0.02, 0.12, 0, 0, 0, 0, 1, 0)
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, b, Floortexture, u_Sampler);
    modelMatrix = popMatrix();
    //back right
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.827, -1, -1.06);
      modelMatrix.scale(0.118, 0.02, 0.12); // Scale
      resetTexCoords(gl, floor_offset, 0.118, 0.02, 0.12, 0, 0, 1, 0, 0, 0)
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, b, Floortexture, u_Sampler);
    modelMatrix = popMatrix();

  }
  Floortexture.image.src = 'src/grass.png';
  // Floortexture.image.src = 'src/texture.jpg';


  var offset = 0.5;

  Walltexture.image.onload = function(){
    var n = initVertexBuffers(gl);
    if (n < 0) {
      console.log('Failed to set the vertex information');
      return;
    }

    // Model the main building
      //front and back top
      pushMatrix(modelMatrix);
        modelMatrix.translate(0, 0.435, 0.97);  // Translation
        modelMatrix.scale(1, 0.18, 0.03); // Scale
        resetTexCoords(gl, offset, 1, 0.18, 0.03, 1, 1, 1, 1, 1, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(0, 0.435, -0.97);  // Translation
        modelMatrix.scale(1, 0.18, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      //front left
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.905, -0.365, 0.97);  // Translation
        modelMatrix.scale(0.095, 0.62, 0.03); // Scale
        resetTexCoords(gl, offset, 0.095, 0.62, 0.03, 1, 1, 1, 1, 0, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      //front middle
      pushMatrix(modelMatrix);
        modelMatrix.translate(0, -0.365, 0.97);  // Translation
        modelMatrix.scale(0.095, 0.62, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      //front right
      pushMatrix(modelMatrix);
        modelMatrix.translate(0.905, -0.365, 0.97);  // Translation
        modelMatrix.scale(0.095, 0.62, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      //back right
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.905, -0.365, -0.97);  // Translation
        modelMatrix.scale(0.095, 0.62, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      //back middle
      pushMatrix(modelMatrix);
        modelMatrix.translate(0, -0.365, -0.97);  // Translation
        modelMatrix.scale(0.095, 0.62, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      //back left
      pushMatrix(modelMatrix);
        modelMatrix.translate(0.905, -0.365, -0.97);  // Translation
        modelMatrix.scale(0.095, 0.62, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();

      //model tiny gap between main and side buildings
      //right left
      pushMatrix(modelMatrix);
        modelMatrix.translate(0.97, -0.38, 0.92);  // Translation
        modelMatrix.scale(0.03, 0.6, 0.08); // Scale
        resetTexCoords(gl, offset, 0.03, 0.6, 0.08, 1, 1, 1, 1, 1, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      //right right
      pushMatrix(modelMatrix);
        modelMatrix.translate(0.97, -0.38, -0.92);  // Translation
        modelMatrix.scale(0.03, 0.6, 0.08); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      //left right
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.97, -0.38, 0.92);  // Translation
        modelMatrix.scale(0.03, 0.6, 0.08); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      //left left
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.97, -0.38, -0.92);  // Translation
        modelMatrix.scale(0.03, 0.6, 0.08); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();

      //model left/right wall of main building
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.97, 0.42, 0);  // Translation
        modelMatrix.scale(0.03, 0.2, 1); // Scale
        resetTexCoords(gl, offset, 0.03, 0.2, 1, 1, 1, 1, 1, 1, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(0.97, 0.42, 0);  // Translation
        modelMatrix.scale(0.03, 0.2, 1); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();

      //model ceiling of main building
      pushMatrix(modelMatrix);
        modelMatrix.translate(0, 0.6, 0);  // Translation
        modelMatrix.scale(1, 0.02, 1); // Scale
        resetTexCoords(gl, offset, 1, 0.02, 1, 1, 1, 1, 1, 1, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();

    // Model the RHS prism window - front
      //horizontal
      pushMatrix(modelMatrix);
        modelMatrix.translate(0.45, 0.225, 1.21)
        modelMatrix.scale(0.3, 0.09, 0.03); // Scale
        resetTexCoords(gl, offset, 0.3, 0.09, 0.03, 1, 1, 1, 1, 1, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(0.45, -0.89, 1.21)
        modelMatrix.scale(0.3, 0.09, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(0.45, -0.34, 1.21)
        modelMatrix.scale(0.3, 0.07, 0.03); // Scale
        resetTexCoords(gl, offset, 0.3, 0.07, 0.03, 1, 1, 1, 1, 1, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      //vertical
      pushMatrix(modelMatrix);
        modelMatrix.translate(0.71, -0.605, 1.21)
        modelMatrix.scale(0.04, 0.2, 0.03); // Scale
        resetTexCoords(gl, offset, 0.04, 0.2, 0.03, 1, 1, 0, 1, 0, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(0.19, -0.605, 1.21)
        modelMatrix.scale(0.04, 0.2, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(0.71, -0.067, 1.21)
        modelMatrix.scale(0.04, 0.21, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(0.19, -0.067, 1.21)
        modelMatrix.scale(0.04, 0.21, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      // Model the RHS prism window - front - left side
      pushMatrix(modelMatrix);
        modelMatrix.translate(0.12, 0.225, 1.09)
        modelMatrix.rotate(113,0,1,0)
        modelMatrix.scale(0.15, 0.09, 0.03); // Scale
        resetTexCoords(gl, offset, 0.15, 0.09, 0.03, 1, 1, 1, 1, 1, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(0.12, -0.89, 1.09)
        modelMatrix.rotate(113,0,1,0)
        modelMatrix.scale(0.15, 0.09, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(0.12, -0.34, 1.09)
        modelMatrix.rotate(113,0,1,0)
        modelMatrix.scale(0.15, 0.07, 0.03); // Scale
        resetTexCoords(gl, offset, 0.15, 0.07, 0.03, 1, 1, 1, 1, 1, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      var degree = 67
      var factor = Math.tan(degree * Math.PI/180);
      var window_shift = 0.046
      var wall_shift = 0.04
      pushMatrix(modelMatrix);
        modelMatrix.translate(0.12+window_shift, -0.605, 1.09+factor*window_shift)
        modelMatrix.rotate(113,0,1,0)
        modelMatrix.scale(0.03, 0.2, 0.03); // Scale
        resetTexCoords(gl, offset, 0.03, 0.2, 0.03, 1, 1, 0, 1, 0, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(0.12+window_shift, -0.067, 1.09+factor*window_shift)
        modelMatrix.rotate(113,0,1,0)
        modelMatrix.scale(0.03, 0.21, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(0.12-wall_shift, -0.605, 1.09-factor*wall_shift)
        modelMatrix.rotate(113,0,1,0)
        modelMatrix.scale(0.02, 0.2, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(0.12-wall_shift, -0.067, 1.09-factor*wall_shift)
        modelMatrix.rotate(113,0,1,0)
        modelMatrix.scale(0.02, 0.21, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      // Model the RHS prism window - front - right side
      pushMatrix(modelMatrix);
        modelMatrix.translate(0.78, 0.225, 1.09)
        modelMatrix.rotate(67,0,1,0)
        modelMatrix.scale(0.15, 0.09, 0.03); // Scale
        resetTexCoords(gl, offset, 0.15, 0.09, 0.03, 1, 1, 1, 1, 1, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(0.78, -0.89, 1.09)
        modelMatrix.rotate(67,0,1,0)
        modelMatrix.scale(0.15, 0.09, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(0.78, -0.34, 1.09)
        modelMatrix.rotate(67,0,1,0)
        modelMatrix.scale(0.15, 0.07, 0.03); // Scale
        resetTexCoords(gl, offset, 0.15, 0.07, 0.03, 1, 1, 1, 1, 1, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(0.78-window_shift, -0.605, 1.09+factor*window_shift)
        modelMatrix.rotate(67,0,1,0)
        modelMatrix.scale(0.03, 0.2, 0.03); // Scale
        resetTexCoords(gl, offset, 0.03, 0.2, 0.03, 1, 1, 0, 1, 0, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(0.78-window_shift, -0.067, 1.09+factor*window_shift)
        modelMatrix.rotate(67,0,1,0)
        modelMatrix.scale(0.03, 0.21, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(0.78+wall_shift, -0.605, 1.09-factor*wall_shift)
        modelMatrix.rotate(67,0,1,0)
        modelMatrix.scale(0.02, 0.2, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(0.78+window_shift, -0.067, 1.09-factor*window_shift)
        modelMatrix.rotate(67,0,1,0)
        modelMatrix.scale(0.03, 0.21, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();

    // Model the LHS prism window - front
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.45, 0.225, 1.21)
        modelMatrix.scale(0.3, 0.09, 0.03); // Scale
        resetTexCoords(gl, offset, 0.3, 0.09, 0.03, 1, 1, 1, 1, 1, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.45, -0.89, 1.21)
        modelMatrix.scale(0.3, 0.09, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.45, -0.34, 1.21)
        modelMatrix.scale(0.3, 0.07, 0.03); // Scale
        resetTexCoords(gl, offset, 0.3, 0.07, 0.03, 1, 1, 1, 1, 1, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.71, -0.605, 1.21)
        modelMatrix.scale(0.04, 0.2, 0.03); // Scale
        resetTexCoords(gl, offset, 0.04, 0.2, 0.03, 1, 1, 0, 1, 0, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.19, -0.605, 1.21)
        modelMatrix.scale(0.04, 0.2, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.71, -0.067, 1.21)
        modelMatrix.scale(0.04, 0.21, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.19, -0.067, 1.21)
        modelMatrix.scale(0.04, 0.21, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      // Model the LHS prism window - front - right side
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.12, 0.225, 1.09)
        modelMatrix.rotate(67,0,1,0)
        modelMatrix.scale(0.15, 0.09, 0.03); // Scale
        resetTexCoords(gl, offset, 0.15, 0.09, 0.03, 1, 1, 1, 1, 1, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.12, -0.89, 1.09)
        modelMatrix.rotate(67,0,1,0)
        modelMatrix.scale(0.15, 0.09, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.12, -0.34, 1.09)
        modelMatrix.rotate(67,0,1,0)
        modelMatrix.scale(0.15, 0.07, 0.03); // Scale
        resetTexCoords(gl, offset, 0.15, 0.07, 0.03, 1, 1, 1, 1, 1, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();

      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.12-window_shift, -0.605, 1.09+factor*window_shift)
        modelMatrix.rotate(67,0,1,0)
        modelMatrix.scale(0.03, 0.2, 0.03); // Scale
        resetTexCoords(gl, offset, 0.03, 0.2, 0.03, 1, 1, 0, 1, 0, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.12-window_shift, -0.067, 1.09+factor*window_shift)
        modelMatrix.rotate(67,0,1,0)
        modelMatrix.scale(0.03, 0.21, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.12+wall_shift, -0.605, 1.09-factor*wall_shift)
        modelMatrix.rotate(67,0,1,0)
        modelMatrix.scale(0.02, 0.2, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.12+wall_shift, -0.067, 1.09-factor*wall_shift)
        modelMatrix.rotate(67,0,1,0)
        modelMatrix.scale(0.02, 0.21, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      // Model the LHS prism window - front - left side
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.78, 0.225, 1.09)
        modelMatrix.rotate(113,0,1,0)
        modelMatrix.scale(0.15, 0.09, 0.03); // Scale
        resetTexCoords(gl, offset, 0.15, 0.09, 0.03, 1, 1, 1, 1, 1, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.78, -0.89, 1.09)
        modelMatrix.rotate(113,0,1,0)
        modelMatrix.scale(0.15, 0.09, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.78, -0.34, 1.09)
        modelMatrix.rotate(113,0,1,0)
        modelMatrix.scale(0.15, 0.07, 0.03); // Scale
        resetTexCoords(gl, offset, 0.15, 0.07, 0.03, 1, 1, 1, 1, 1, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.78+window_shift, -0.605, 1.09+factor*window_shift)
        modelMatrix.rotate(113,0,1,0)
        modelMatrix.scale(0.03, 0.2, 0.03); // Scale
        resetTexCoords(gl, offset, 0.03, 0.2, 0.03, 1, 1, 0, 1, 0, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.78+window_shift, -0.067, 1.09+factor*window_shift)
        modelMatrix.rotate(113,0,1,0)
        modelMatrix.scale(0.03, 0.21, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.78-wall_shift, -0.605, 1.09-factor*wall_shift)
        modelMatrix.rotate(113,0,1,0)
        modelMatrix.scale(0.02, 0.2, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.78-window_shift, -0.067, 1.09-factor*window_shift)
        modelMatrix.rotate(113,0,1,0)
        modelMatrix.scale(0.03, 0.21, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();

    // Model the RHS prism window - back
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.45, 0.225, -1.21)
        modelMatrix.scale(0.3, 0.09, 0.03); // Scale
        resetTexCoords(gl, offset, 0.3, 0.09, 0.03, 1, 1, 1, 1, 1, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.45, -0.89, -1.21)
        modelMatrix.scale(0.3, 0.09, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.45, -0.34, -1.21)
        modelMatrix.scale(0.3, 0.07, 0.03); // Scale
        resetTexCoords(gl, offset, 0.3, 0.07, 0.03, 1, 1, 1, 1, 1, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.71, -0.605, -1.21)
        modelMatrix.scale(0.04, 0.2, 0.03); // Scale
        resetTexCoords(gl, offset, 0.04, 0.2, 0.03, 1, 1, 0, 1, 0, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.19, -0.605, -1.21)
        modelMatrix.scale(0.04, 0.2, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.71, -0.067, -1.21)
        modelMatrix.scale(0.04, 0.21, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.19, -0.067, -1.21)
        modelMatrix.scale(0.04, 0.21, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      // Model the RHS prism window - back - left side
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.12, 0.225, -1.09)
        modelMatrix.rotate(113,0,1,0)
        modelMatrix.scale(0.15, 0.09, 0.03); // Scale
        resetTexCoords(gl, offset, 0.15, 0.09, 0.03, 1, 1, 1, 1, 1, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.12, -0.89, -1.09)
        modelMatrix.rotate(113,0,1,0)
        modelMatrix.scale(0.15, 0.09, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.12, -0.34, -1.09)
        modelMatrix.rotate(113,0,1,0)
        modelMatrix.scale(0.15, 0.07, 0.03); // Scale
        resetTexCoords(gl, offset, 0.15, 0.07, 0.03, 1, 1, 1, 1, 1, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.12-window_shift, -0.605, -1.09-factor*window_shift)
        modelMatrix.rotate(113,0,1,0)
        modelMatrix.scale(0.03, 0.2, 0.03); // Scale
        resetTexCoords(gl, offset, 0.03, 0.2, 0.03, 1, 1, 0, 1, 0, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.12-window_shift, -0.067, -1.09-factor*window_shift)
        modelMatrix.rotate(113,0,1,0)
        modelMatrix.scale(0.03, 0.21, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.12+wall_shift, -0.605, -1.09+factor*wall_shift)
        modelMatrix.rotate(113,0,1,0)
        modelMatrix.scale(0.02, 0.2, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.12+wall_shift, -0.067, -1.09+factor*wall_shift)
        modelMatrix.rotate(113,0,1,0)
        modelMatrix.scale(0.02, 0.21, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      // Model the RHS prism window - front - right side
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.78, 0.225, -1.09)
        modelMatrix.rotate(67,0,1,0)
        modelMatrix.scale(0.15, 0.09, 0.03); // Scale
        resetTexCoords(gl, offset, 0.15, 0.09, 0.03, 1, 1, 1, 1, 1, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.78, -0.89, -1.09)
        modelMatrix.rotate(67,0,1,0)
        modelMatrix.scale(0.15, 0.09, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.78, -0.34, -1.09)
        modelMatrix.rotate(67,0,1,0)
        modelMatrix.scale(0.15, 0.07, 0.03); // Scale
        resetTexCoords(gl, offset, 0.15, 0.07, 0.03, 1, 1, 1, 1, 1, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.78+window_shift, -0.605, -1.09-factor*window_shift)
        modelMatrix.rotate(67,0,1,0)
        modelMatrix.scale(0.03, 0.2, 0.03); // Scale
        resetTexCoords(gl, offset, 0.03, 0.2, 0.03, 1, 1, 0, 1, 0, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.78+window_shift, -0.067, -1.09-factor*window_shift)
        modelMatrix.rotate(67,0,1,0)
        modelMatrix.scale(0.03, 0.21, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.78-wall_shift, -0.605, -1.09+factor*wall_shift)
        modelMatrix.rotate(67,0,1,0)
        modelMatrix.scale(0.02, 0.2, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-0.78-window_shift, -0.067, -1.09+factor*window_shift)
        modelMatrix.rotate(67,0,1,0)
        modelMatrix.scale(0.03, 0.21, 0.03); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();

    // Model the LHS prism window - back
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.45, 0.225, -1.21)
      modelMatrix.scale(0.3, 0.09, 0.03); // Scale
      resetTexCoords(gl, offset, 0.3, 0.09, 0.03, 1, 1, 1, 1, 1, 1)
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.45, -0.89, -1.21)
      modelMatrix.scale(0.3, 0.09, 0.03); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.45, -0.34, -1.21)
      modelMatrix.scale(0.3, 0.07, 0.03); // Scale
      resetTexCoords(gl, offset, 0.3, 0.07, 0.03, 1, 1, 1, 1, 1, 1)
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.71, -0.605, -1.21)
      modelMatrix.scale(0.04, 0.2, 0.03); // Scale
      resetTexCoords(gl, offset, 0.04, 0.2, 0.03, 1, 1, 1, 1, 1, 1)
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.19, -0.605, -1.21)
      modelMatrix.scale(0.04, 0.2, 0.03); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.71, -0.067, -1.21)
      modelMatrix.scale(0.04, 0.21, 0.03); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.19, -0.067, -1.21)
      modelMatrix.scale(0.04, 0.21, 0.03); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
    modelMatrix = popMatrix();
    // Model the LHS prism window - front - right side
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.12, 0.225, -1.09)
      modelMatrix.rotate(67,0,1,0)
      modelMatrix.scale(0.15, 0.09, 0.03); // Scale
      resetTexCoords(gl, offset, 0.15, 0.09, 0.03, 1, 1, 0, 1, 0, 1)
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.12, -0.89, -1.09)
      modelMatrix.rotate(67,0,1,0)
      modelMatrix.scale(0.15, 0.09, 0.03); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.12, -0.34, -1.09)
      modelMatrix.rotate(67,0,1,0)
      modelMatrix.scale(0.15, 0.07, 0.03); // Scale
      resetTexCoords(gl, offset, 0.15, 0.07, 0.03, 1, 1, 1, 1, 1, 1)
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.12+window_shift, -0.605, -1.09-factor*window_shift)
      modelMatrix.rotate(67,0,1,0)
      modelMatrix.scale(0.03, 0.2, 0.03); // Scale
      resetTexCoords(gl, offset, 0.03, 0.2, 0.03, 1, 1, 0, 1, 0, 1)
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.12+window_shift, -0.067, -1.09-factor*window_shift)
      modelMatrix.rotate(67,0,1,0)
      modelMatrix.scale(0.03, 0.21, 0.03); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.12-wall_shift, -0.605, -1.09+factor*wall_shift)
      modelMatrix.rotate(67,0,1,0)
      modelMatrix.scale(0.02, 0.2, 0.03); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.12-wall_shift, -0.067, -1.09+factor*wall_shift)
      modelMatrix.rotate(67,0,1,0)
      modelMatrix.scale(0.02, 0.21, 0.03); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
    modelMatrix = popMatrix();
    // Model the LHS prism window - front - left side
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.78, 0.225, -1.09)
      modelMatrix.rotate(113,0,1,0)
      modelMatrix.scale(0.15, 0.09, 0.03); // Scale
      resetTexCoords(gl, offset, 0.15, 0.09, 0.03, 1, 1, 1, 1, 1, 1)
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.78, -0.89, -1.09)
      modelMatrix.rotate(113,0,1,0)
      modelMatrix.scale(0.15, 0.09, 0.03); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.78, -0.34, -1.09)
      modelMatrix.rotate(113,0,1,0)
      modelMatrix.scale(0.15, 0.07, 0.03); // Scale
      resetTexCoords(gl, offset, 0.15, 0.07, 0.03, 1, 1, 1, 1, 1, 1)
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.78-window_shift, -0.605, -1.09-factor*window_shift)
      modelMatrix.rotate(113,0,1,0)
      modelMatrix.scale(0.03, 0.2, 0.03); // Scale
      resetTexCoords(gl, offset, 0.03, 0.2, 0.03, 1, 1, 0, 1, 0, 1)
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.78-window_shift, -0.067, -1.09-factor*window_shift)
      modelMatrix.rotate(113,0,1,0)
      modelMatrix.scale(0.03, 0.21, 0.03); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.78+wall_shift, -0.605, -1.09+factor*wall_shift)
      modelMatrix.rotate(113,0,1,0)
      modelMatrix.scale(0.02, 0.2, 0.03); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.78+window_shift, -0.067, -1.09+factor*window_shift)
      modelMatrix.rotate(113,0,1,0)
      modelMatrix.scale(0.03, 0.21, 0.03); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
    modelMatrix = popMatrix();


    // Model the left side building
      //left
      pushMatrix(modelMatrix);
        modelMatrix.translate(-1.57, -0.38, 0);  // Translation
        modelMatrix.scale(0.03, 0.6, 0.9); // Scale
        resetTexCoords(gl, offset, 0.03, 0.6, 0.9, 1, 1, 0, 1, 0, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      //front
      pushMatrix(modelMatrix);
        modelMatrix.translate(-1.3, -0.18, 0.87);  // Translation
        modelMatrix.scale(0.3, 0.4, 0.03); // Scale
        resetTexCoords(gl, offset, 0.3, 0.4, 0.03, 1, 0, 0, 1, 1, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-1.46, -0.78, 0.87);  // Translation
        modelMatrix.scale(0.08, 0.2, 0.03); // Scale
        resetTexCoords(gl, offset, 0.08, 0.2, 0.03, 1, 1, 0, 0, 0, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(-1.08, -0.78, 0.87);  // Translation
        modelMatrix.scale(0.08, 0.2, 0.03); // Scale
        resetTexCoords(gl, offset, 0.08, 0.2, 0.03, 1, 0, 0, 1, 0, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      //back
      pushMatrix(modelMatrix);
        modelMatrix.translate(-1.3, -0.38, -0.87);  // Translation
        modelMatrix.scale(0.3, 0.6, 0.03); // Scale
        resetTexCoords(gl, offset, 0.3, 0.6, 0.03, 1, 0, 0, 1, 0, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();

    // Model the right side building
      //right
      pushMatrix(modelMatrix);
        modelMatrix.translate(1.57, -0.38, 0);  // Translation
        modelMatrix.scale(0.03, 0.6, 0.9); // Scale
        resetTexCoords(gl, offset, 0.03, 0.6, 0.9, 1, 1, 0, 1, 0, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      //front
      pushMatrix(modelMatrix);
        modelMatrix.translate(1.3, -0.18, 0.87);  // Translation
        modelMatrix.scale(0.3, 0.4, 0.03); // Scale
        resetTexCoords(gl, offset, 0.3, 0.4, 0.03, 1, 0, 0, 1, 1, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(1.46, -0.78, 0.87);  // Translation
        modelMatrix.scale(0.08, 0.2, 0.03); // Scale
        resetTexCoords(gl, offset, 0.08, 0.2, 0.03, 1, 0, 0, 1, 0, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      pushMatrix(modelMatrix);
        modelMatrix.translate(1.08, -0.78, 0.87);  // Translation
        modelMatrix.scale(0.08, 0.2, 0.03); // Scale
        resetTexCoords(gl, offset, 0.08, 0.2, 0.03, 1, 1, 0, 0, 0, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();
      //back
      pushMatrix(modelMatrix);
        modelMatrix.translate(1.3, -0.38, -0.87);  // Translation
        modelMatrix.scale(0.3, 0.6, 0.03); // Scale
        resetTexCoords(gl, offset, 0.3, 0.6, 0.03, 1, 0, 0, 1, 0, 1)
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
      modelMatrix = popMatrix();

    // Model the chimney
    pushMatrix(modelMatrix);
      modelMatrix.translate(0, 1.3, 0);  // Translation
      modelMatrix.scale(0.15, 0.25, 0.15); // Scale
      resetTexCoords(gl, offset, 0.15, 0.25, 0.15, 1, 1, 0, 1, 0, 1)
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
    modelMatrix = popMatrix();

    // Model the main fences
    pushMatrix(modelMatrix);
      modelMatrix.translate(0, -0.91, 1.5);  // Translation
      modelMatrix.scale(1, 0.07, 0.035); // Scale
      resetTexCoords(gl, offset, 1, 0.07, 0.035, 1, 1, 1, 1, 0, 1)
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
    modelMatrix = popMatrix();

    // Model the left fences
    pushMatrix(modelMatrix);
      modelMatrix.translate(-1.52, -0.91, 1.2);  // Translation
      modelMatrix.scale(0.035, 0.07, 0.33); // Scale
      resetTexCoords(gl, offset, 0.035, 0.07, 0.33, 1, 1, 1, 1, 0, 1)
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
    modelMatrix = popMatrix();

    // Model the right fences
    pushMatrix(modelMatrix);
      modelMatrix.translate(1.52, -0.91, 1.2);  // Translation
      modelMatrix.scale(0.035, 0.07, 0.33); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
    modelMatrix = popMatrix();

    // Model the left attic block - front and back
    pushMatrix(modelMatrix);
      modelMatrix.translate(-0.45, 0.69, 0);  // Translation
      modelMatrix.scale(0.4, 0.075, 1); // Scale
      resetTexCoords(gl, offset, 0.4, 0.075, 1, 1, 1, 1, 1, 0, 1)
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
    modelMatrix = popMatrix();

    // Model the right attic block - front and back
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.45, 0.69, 0);  // Translation
      modelMatrix.scale(0.4, 0.075, 1); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
    modelMatrix = popMatrix();

    // Model the left attic top - front
    pushMatrix(modelMatrix);
      modelMatrix.translate(-0.45, 1.08, 0.96);  // Translation
      modelMatrix.scale(0.24, 0.075, 0.04); // Scale
      resetTexCoords(gl, offset, 0.24, 0.075, 0.04, 1, 1, 1, 1, 0, 1)
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
    modelMatrix = popMatrix();

    // Model the right attic top - front
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.45, 1.08, 0.96);  // Translation
      modelMatrix.scale(0.24, 0.075, 0.04); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
    modelMatrix = popMatrix();

    // Model the left attic top - back
    pushMatrix(modelMatrix);
      modelMatrix.translate(-0.45, 1.08, -0.96);  // Translation
      modelMatrix.scale(0.24, 0.075, 0.04); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
    modelMatrix = popMatrix();

    // Model the right attic top - back
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.45, 1.08, -0.96);  // Translation
      modelMatrix.scale(0.24, 0.075, 0.04); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, Walltexture, u_Sampler);
    modelMatrix = popMatrix();

    var m = initGableBuffers(gl);
    if (m < 0) {
      console.log('Failed to set the vertex information');
      return;
    }

    // Model the main building roof
    pushMatrix(modelMatrix);
      modelMatrix.translate(0, 0.915, 0)
      modelMatrix.rotate(90,0,1,0)
      modelMatrix.scale(0.6, 0.3, 1); // Scale
      resetTexCoords(gl, offset, 0.6, 0.3, 1, 1, 1, 0, 1, 0, 1)
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, m, Walltexture, u_Sampler);
    modelMatrix = popMatrix();

    // Model the left attic top triangle - front
    pushMatrix(modelMatrix);
      modelMatrix.translate(-0.45, 1.23, 0.96)
      modelMatrix.scale(0.24, 0.075, 0.04); // Scale
      resetTexCoords(gl, offset, 0.24, 0.075, 0.04, 1, 1, 0, 1, 0, 1)
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, m, Walltexture, u_Sampler);
    modelMatrix = popMatrix();

    // Model the right attic top triangle - front
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.45, 1.23, 0.96)
      modelMatrix.scale(0.24, 0.075, 0.04); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, m, Walltexture, u_Sampler);
    modelMatrix = popMatrix();

    // Model the left attic top triangle - back
    pushMatrix(modelMatrix);
      modelMatrix.translate(-0.45, 1.23, -0.96)
      modelMatrix.scale(0.24, 0.075, 0.04); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, m, Walltexture, u_Sampler);
    modelMatrix = popMatrix();

    // Model the right attic top triangle - back
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.45, 1.23, -0.96)
      modelMatrix.scale(0.24, 0.075, 0.04); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, m, Walltexture, u_Sampler);
    modelMatrix = popMatrix();

    var i = initShedBuffers(gl);
    if (i < 0) {
      console.log('Failed to set the vertex information');
      return;
    }

    // Model the right side building roof
    pushMatrix(modelMatrix);
      modelMatrix.translate(1.3, 0.42, 0)
      modelMatrix.scale(0.3, 0.2, 0.9); // Scale
      resetTexCoords(gl, offset, 0.3, 0.2, 0.9, 1, 1, 0, 1, 1, 1)
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, i, Walltexture, u_Sampler);
    modelMatrix = popMatrix();

    // Model the left side building roof
    pushMatrix(modelMatrix);
      modelMatrix.translate(-1.3, 0.42, 0)
      modelMatrix.rotate(180,0,1,0)
      modelMatrix.scale(0.3, 0.2, 0.9); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, i, Walltexture, u_Sampler);
    modelMatrix = popMatrix();

    var j = initPrismBuffers(gl,0.25,false);
    if (j < 0) {
      console.log('Failed to set the vertex information');
      return;
    }

    // Model the LHS prism window - front top
    pushMatrix(modelMatrix);
      modelMatrix.translate(-0.45, 0.285, 1.12)
      modelMatrix.scale(0.4, 0.03, 0.12); // Scale
      resetTexCoords(gl, offset, 0.4, 0.03, 0.12, 1, 1, 1, 1, 1, 1)
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, j, Walltexture, u_Sampler);
    modelMatrix = popMatrix();

    // Model the RHS prism window - front top
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.45, 0.285, 1.12)
      modelMatrix.scale(0.4, 0.03, 0.12); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, j, Walltexture, u_Sampler);
    modelMatrix = popMatrix();

    // Model the LHS prism window - back top
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.45, 0.285, -1.12)
      modelMatrix.rotate(180,0,1,0)
      modelMatrix.scale(0.4, 0.03, 0.12); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, j, Walltexture, u_Sampler);
    modelMatrix = popMatrix();

    // Model the RHS prism window - back top
    pushMatrix(modelMatrix);
      modelMatrix.translate(-0.45, 0.285, -1.12)
      modelMatrix.rotate(180,0,1,0)
      modelMatrix.scale(0.4, 0.03, 0.12); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, j, Walltexture, u_Sampler);
    modelMatrix = popMatrix();

    var k = initPrismBuffers(gl,0.4,false);
    if (k < 0) {
      console.log('Failed to set the vertex information');
      return;
    }

    // Model the left attic prism - front and back
    pushMatrix(modelMatrix);
      modelMatrix.translate(-0.45,0.89,0)
      modelMatrix.rotate(270,1,0,0)
      modelMatrix.scale(0.4, 1, 0.125); // Scale
      resetTexCoords(gl, offset, 0.4, 1, 0.125, 1, 1, 1, 1, 1, 1)
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, k, Walltexture, u_Sampler);
    modelMatrix = popMatrix();

    // Model the right attic prism - front and back
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.45,0.89,0)
      modelMatrix.rotate(270,1,0,0)
      modelMatrix.scale(0.4, 1, 0.125); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, k, Walltexture, u_Sampler);
    modelMatrix = popMatrix();
  }
  // Walltexture.image.src = 'src/texture.jpg';
  Walltexture.image.src = 'src/wall.jpg';

  Glasstexture.image.onload = function(){
    var c = initVertexBuffers(gl);
    if (c < 0) {
      console.log('Failed to set the vertex information');
      return;
    }

    windowTexCoords = new Float32Array([
      1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v0-v1-v2-v3 front
      0.0, 1.0,    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,  // v0-v3-v4-v5 right
      1.0, 0.0,    1.0, 1.0,   0.0, 1.0,   0.0, 0.0,  // v0-v5-v6-v1 up
      1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v1-v6-v7-v2 left
      0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0,  // v7-v4-v3-v2 down
      0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0   // v4-v7-v6-v5 back
    ]);

    if (!initArrayBuffer(gl, 'a_TexCoords', windowTexCoords, 2)) return -1;

    // Model the RHS prism window - front
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.45,-0.067,1.21)
      modelMatrix.scale(0.22,0.21,0.015); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.45,-0.605,1.21)
      modelMatrix.scale(0.22,0.2,0.015); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();
    //left side
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.12,-0.067,1.09)
      modelMatrix.rotate(113,0,1,0)
      modelMatrix.scale(0.085,0.21,0.015); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.12,-0.605,1.09)
      modelMatrix.rotate(113,0,1,0)
      modelMatrix.scale(0.085,0.2,0.015); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();
    //right side
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.78,-0.067,1.09)
      modelMatrix.rotate(67,0,1,0)
      modelMatrix.scale(0.085,0.21,0.015); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.78,-0.605,1.09)
      modelMatrix.rotate(67,0,1,0)
      modelMatrix.scale(0.085,0.2,0.015); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();

    //model the LHS prism window - front
    pushMatrix(modelMatrix);
      modelMatrix.translate(-0.45,-0.067,1.21)
      modelMatrix.scale(0.22,0.21,0.015); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(-0.45,-0.605,1.21)
      modelMatrix.scale(0.22,0.2,0.015); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();
    //left side
    pushMatrix(modelMatrix);
      modelMatrix.translate(-0.12,-0.067,1.09)
      modelMatrix.rotate(67,0,1,0)
      modelMatrix.scale(0.085,0.21,0.015); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(-0.12,-0.605,1.09)
      modelMatrix.rotate(67,0,1,0)
      modelMatrix.scale(0.085,0.2,0.015); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();
    //right side
    pushMatrix(modelMatrix);
      modelMatrix.translate(-0.78,-0.067,1.09)
      modelMatrix.rotate(113,0,1,0)
      modelMatrix.scale(0.085,0.21,0.015); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(-0.78,-0.605,1.09)
      modelMatrix.rotate(113,0,1,0)
      modelMatrix.scale(0.085,0.2,0.015); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();

    // Model the LHS prism window - back
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.45,-0.067,-1.21)
      modelMatrix.scale(0.22,0.21,0.015); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.45,-0.605,-1.21)
      modelMatrix.scale(0.22,0.2,0.015); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();
    //left side
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.12,-0.067,-1.09)
      modelMatrix.rotate(67,0,1,0)
      modelMatrix.scale(0.085,0.21,0.015); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.12,-0.605,-1.09)
      modelMatrix.rotate(67,0,1,0)
      modelMatrix.scale(0.085,0.2,0.015); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();
    //right side
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.78,-0.067,-1.09)
      modelMatrix.rotate(113,0,1,0)
      modelMatrix.scale(0.085,0.21,0.015); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.78,-0.605,-1.09)
      modelMatrix.rotate(113,0,1,0)
      modelMatrix.scale(0.085,0.2,0.015); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();

    //model the RHS prism window - back
    pushMatrix(modelMatrix);
      modelMatrix.translate(-0.45,-0.067,-1.21)
      modelMatrix.scale(0.22,0.21,0.015); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(-0.45,-0.605,-1.21)
      modelMatrix.scale(0.22,0.2,0.015); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();
    //left side
    pushMatrix(modelMatrix);
      modelMatrix.translate(-0.12,-0.067,-1.09)
      modelMatrix.rotate(113,0,1,0)
      modelMatrix.scale(0.085,0.21,0.015); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(-0.12,-0.605,-1.09)
      modelMatrix.rotate(113,0,1,0)
      modelMatrix.scale(0.085,0.2,0.015); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();
    //right side
    pushMatrix(modelMatrix);
      modelMatrix.translate(-0.78,-0.067,-1.09)
      modelMatrix.rotate(67,0,1,0)
      modelMatrix.scale(0.085,0.21,0.015); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(-0.78,-0.605,-1.09)
      modelMatrix.rotate(67,0,1,0)
      modelMatrix.scale(0.085,0.2,0.015); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();
    //model the top windows
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.47,0.63,1);
      modelMatrix.scale(0.18, 0.21, 0.001);
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(-0.47,0.63,1);
      modelMatrix.scale(0.18, 0.21, 0.001);
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(-0.47,0.63,-1);
      modelMatrix.scale(0.18, 0.21, 0.001);
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(0.47,0.63,-1);
      modelMatrix.scale(0.18, 0.21, 0.001);
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();
    //model the side windows - front
    pushMatrix(modelMatrix);
      modelMatrix.translate(1.27,-0.18,0.9);
      modelMatrix.scale(0.11, 0.2, 0.001);
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(-1.27,-0.18,0.9);
      modelMatrix.scale(0.11, 0.2, 0.001);
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(1.27,-0.18,-0.9);
      modelMatrix.scale(0.11, 0.2, 0.001);
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(-1.27,-0.18,-0.9);
      modelMatrix.scale(0.11, 0.2, 0.001);
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();
    //model the side windows - side
    pushMatrix(modelMatrix);
      modelMatrix.translate(-1.6,-0.117,0)
      modelMatrix.rotate(90,0,1,0)
      modelMatrix.scale(0.22,0.21,0.001); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(1.6,-0.117,0)
      modelMatrix.rotate(90,0,1,0)
      modelMatrix.scale(0.22,0.21,0.001); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();
    //model the roof window
    pushMatrix(modelMatrix);
      modelMatrix.translate(-1,0.83,0)
      modelMatrix.rotate(90,0,1,0)
      modelMatrix.scale(0.15,0.15,0.001); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
      modelMatrix.translate(1,0.83,0)
      modelMatrix.rotate(90,0,1,0)
      modelMatrix.scale(0.15,0.15,0.001); // Scale
      loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, c, Glasstexture, u_Sampler);
    modelMatrix = popMatrix();
  }
  Glasstexture.image.src = "src/glass.jpg"
  // Glasstexture.image.src = "src/texture.jpg"

  Doortexture.image.onload = function(){
    var d = initVertexBuffers(gl);
    if (d < 0) {
      console.log('Failed to set the vertex information');
      return;
    }

    doorTexCoords = new Float32Array([
      0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0,  // v0-v1-v2-v3 front
      0.0, 0.0,    0.0, 0.0,   0.0, 0.0,   0.0, 0.0,  // v0-v3-v4-v5 right
      0.0, 0.0,    0.0, 0.0,   0.0, 0.0,   0.0, 0.0,  // v0-v5-v6-v1 up
      0.0, 0.0,    0.0, 0.0,   0.0, 0.0,   0.0, 0.0,  // v1-v6-v7-v2 left
      0.0, 0.0,    0.0, 0.0,   0.0, 0.0,   0.0, 0.0,  // v7-v4-v3-v2 down
      0.0, 1.0,   1.0, 1.0,    1.0, 0.0,   0.0, 0.0   // v4-v7-v6-v5 back
    ]);
    if (!initArrayBuffer(gl, 'a_TexCoords', doorTexCoords, 2)) return -1;
    if(!rightDoor){
      pushMatrix(modelMatrix);
        modelMatrix.translate(1.27,-0.78,0.87)
        modelMatrix.scale(0.11,0.2,0.015); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, d, Doortexture, u_Sampler);
      modelMatrix = popMatrix();
    } else{
      pushMatrix(modelMatrix);
        modelMatrix.translate(1.39,-0.78,0.77)
        modelMatrix.rotate(90,0,1,0)
        modelMatrix.scale(0.13,0.2,0.015); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, d, Doortexture, u_Sampler);
      modelMatrix = popMatrix();
    }

    doorTexCoords = new Float32Array([
      1.0, 0.0,    0.0, 0.0,   0.0, 1.0,   1.0, 1.0,  // v0-v1-v2-v3 front
      0.0, 0.0,    0.0, 0.0,   0.0, 0.0,   0.0, 0.0,  // v0-v3-v4-v5 right
      0.0, 0.0,    0.0, 0.0,   0.0, 0.0,   0.0, 0.0,  // v0-v5-v6-v1 up
      0.0, 0.0,    0.0, 0.0,   0.0, 0.0,   0.0, 0.0,  // v1-v6-v7-v2 left
      0.0, 0.0,    0.0, 0.0,   0.0, 0.0,   0.0, 0.0,  // v7-v4-v3-v2 down
      1.0, 1.0,    0.0, 1.0,    0.0, 0.0,    1.0, 0.0     // v4-v7-v6-v5 back
    ]);

    if (!initArrayBuffer(gl, 'a_TexCoords', doorTexCoords, 2)) return -1;
    if(!leftDoor){
      pushMatrix(modelMatrix);
        modelMatrix.translate(-1.27,-0.78,0.87)
        modelMatrix.scale(0.11,0.2,0.015); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, d, Doortexture, u_Sampler);
      modelMatrix = popMatrix();
    } else{
      pushMatrix(modelMatrix);
        modelMatrix.translate(-1.39,-0.78,0.77)
        modelMatrix.rotate(90,0,1,0)
        modelMatrix.scale(0.13,0.2,0.015); // Scale
        loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, d, Doortexture, u_Sampler);
      modelMatrix = popMatrix();
    }
  }
  Doortexture.image.src = "src/door.jpg"
  // Doortexture.image.src = "src/texture.jpg"

  var Randomtexture = gl.createTexture();
  if(!Randomtexture){
    console.log('Failed to create the texture object');
    return false;
  }

  Randomtexture.image = new Image();  // Create the image object
  if (!Randomtexture.image) {
    console.log('Failed to create the image object');
    return false;
  }

  Randomtexture.image.onload = function(){
    var e = initVertexBuffers(gl);
    if (e < 0) {
      console.log('Failed to set the vertex information');
      return;
    }

    wheelRotation -= deltaTime * ( 180 / Math.PI );
    distance += speed;
    if(distance > 1.75){
      distance = -1.75;
    }

    // setTexCoords(gl,[0.8,0, 1,0, 1,0.4, 0.8,0.4]); //black
    // setTexCoords(gl,[0.6,0, 0.7,0, 0.7,0.4, 0.6,0.4]); //grey
    // setTexCoords(gl,[0.6,0.6, 1,0.6, 1,1, 0.6,1]); //green
    // setTexCoords(gl,[0,0, 0,0.4, 0.4,0.4, 0.4,0]); //yello
    // setTexCoords(gl,[0,0.6, 0.4,0.6, 0.4,1, 0,1]); //red

    var color = [255,255,255]
    resetColor(gl,[color,color,color,color,color,color])

    setTexCoords(gl,[0,0.6, 0.4,0.6, 0.4,1, 0,1]); //red
    // Model the body of the car
    pushMatrix(modelMatrix);
    modelMatrix.translate(0+distance, -0.83, 2.7); // Scale
    modelMatrix.scale(0.25, 0.1, 0.2); // Scale
    loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, e, Randomtexture, u_Sampler);
    modelMatrix = popMatrix();
    // Model the top of the car
    pushMatrix(modelMatrix);
    modelMatrix.translate(-0.1+distance, -0.67, 2.7); // Scale
    modelMatrix.scale(0.15, 0.06, 0.2); // Scale
    loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, e, Randomtexture, u_Sampler);
    modelMatrix = popMatrix();
    // Model the wheel of the car right behind
    color = [180,180,180]
    resetColor(gl,[color,color,color,color,color,color])
    pushMatrix(modelMatrix);
    modelMatrix.translate(-0.13+distance, -0.92, 2.9); // Scale
    modelMatrix.rotate(wheelRotation,0,0,1);
    modelMatrix.scale(0.06, 0.06, 0.03); // Scale
    loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, e, Randomtexture, u_Sampler);
    modelMatrix = popMatrix();
    // Model the wheel of the car right front
    pushMatrix(modelMatrix);
    modelMatrix.translate(0.13+distance, -0.92, 2.9); // Scale
    modelMatrix.rotate(wheelRotation,0,0,1);
    modelMatrix.scale(0.06, 0.06, 0.03); // Scale
    loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, e, Randomtexture, u_Sampler);
    modelMatrix = popMatrix();
    // Model the wheel of the car left behind
    pushMatrix(modelMatrix);
    modelMatrix.translate(-0.13+distance, -0.92, 2.5); // Scale
    modelMatrix.rotate(wheelRotation,0,0,1);
    modelMatrix.scale(0.06, 0.06, 0.03); // Scale
    loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, e, Randomtexture, u_Sampler);
    modelMatrix = popMatrix();
    // Model the wheel of the car left front
    pushMatrix(modelMatrix);
    modelMatrix.translate(0.13+distance, -0.92, 2.5); // Scale
    modelMatrix.rotate(wheelRotation,0,0,1);
    modelMatrix.scale(0.06, 0.06, 0.03); // Scale
    loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, e, Randomtexture, u_Sampler);
    modelMatrix = popMatrix();
    color = [255,255,255]
    resetColor(gl,[color,color,color,color,color,color])
    // Model the behind window of the car
    setTexCoords(gl,[0.6,0, 0.7,0, 0.7,0.4, 0.6,0.4]); //grey
    pushMatrix(modelMatrix);
    modelMatrix.translate(-0.25+distance, -0.71, 2.7); // Scale
    modelMatrix.scale(0.01, 0.07, 0.16); // Scale
    loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, e, Randomtexture, u_Sampler);
    modelMatrix = popMatrix();
    // Model two lights of the car
    setTexCoords(gl,[0,0, 0,0.4, 0.4,0.4, 0.4,0]); //yello
    pushMatrix(modelMatrix);
    modelMatrix.translate(0.25+distance, -0.8, 2.82); // Scale
    modelMatrix.scale(0.02, 0.04, 0.04); // Scale
    loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, e, Randomtexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
    modelMatrix.translate(0.25+distance, -0.8, 2.58); // Scale
    modelMatrix.scale(0.02, 0.04, 0.04); // Scale
    loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, e, Randomtexture, u_Sampler);
    modelMatrix = popMatrix();

    distance2 += speed2;
    if(distance2 > 1.75){
      distance2 = -1.75;
    }

    setTexCoords(gl,[0.6,0.6, 1,0.6, 1,1, 0.6,1]); //blue
    // Model the body of the car
    pushMatrix(modelMatrix);
    modelMatrix.translate(0-distance2, -0.83, 3.35); // Scale
    modelMatrix.scale(0.25, 0.1, 0.2); // Scale
    loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, e, Randomtexture, u_Sampler);
    modelMatrix = popMatrix();
    // Model the top of the car
    pushMatrix(modelMatrix);
    modelMatrix.translate(0.1-distance2, -0.67, 3.35); // Scale
    modelMatrix.scale(0.15, 0.06, 0.2); // Scale
    loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, e, Randomtexture, u_Sampler);
    modelMatrix = popMatrix();
    // Model the wheel of the car right behind
    color = [180,180,180]
    resetColor(gl,[color,color,color,color,color,color])
    pushMatrix(modelMatrix);
    modelMatrix.translate(0.13-distance2, -0.92, 3.55); // Scale
    modelMatrix.rotate(-wheelRotation,0,0,1);
    modelMatrix.scale(0.06, 0.06, 0.03); // Scale
    loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, e, Randomtexture, u_Sampler);
    modelMatrix = popMatrix();
    // Model the wheel of the car right front
    pushMatrix(modelMatrix);
    modelMatrix.translate(-0.13-distance2, -0.92, 3.55); // Scale
    modelMatrix.rotate(-wheelRotation,0,0,1);
    modelMatrix.scale(0.06, 0.06, 0.03); // Scale
    loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, e, Randomtexture, u_Sampler);
    modelMatrix = popMatrix();
    // Model the wheel of the car left behind
    pushMatrix(modelMatrix);
    modelMatrix.translate(0.13-distance2, -0.92, 3.15); // Scale
    modelMatrix.rotate(-wheelRotation,0,0,1);
    modelMatrix.scale(0.06, 0.06, 0.03); // Scale
    loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, e, Randomtexture, u_Sampler);
    modelMatrix = popMatrix();
    // Model the wheel of the car left front
    pushMatrix(modelMatrix);
    modelMatrix.translate(-0.13-distance2, -0.92, 3.15); // Scale
    modelMatrix.rotate(-wheelRotation,0,0,1);
    modelMatrix.scale(0.06, 0.06, 0.03); // Scale
    loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, e, Randomtexture, u_Sampler);
    modelMatrix = popMatrix();
    color = [255,255,255]
    resetColor(gl,[color,color,color,color,color,color])
    // Model the behind window of the car
    setTexCoords(gl,[0.6,0, 0.7,0, 0.7,0.4, 0.6,0.4]); //grey
    pushMatrix(modelMatrix);
    modelMatrix.translate(0.25-distance2, -0.71, 3.35); // Scale
    modelMatrix.scale(0.01, 0.07, 0.16); // Scale
    loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, e, Randomtexture, u_Sampler);
    modelMatrix = popMatrix();
    // Model two lights of the car
    setTexCoords(gl,[0,0, 0,0.4, 0.4,0.4, 0.4,0]); //yello
    pushMatrix(modelMatrix);
    modelMatrix.translate(-0.25-distance2, -0.8, 3.47); // Scale
    modelMatrix.scale(0.02, 0.04, 0.04); // Scale
    loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, e, Randomtexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
    modelMatrix.translate(-0.25-distance2, -0.8, 3.23); // Scale
    modelMatrix.scale(0.02, 0.04, 0.04); // Scale
    loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, e, Randomtexture, u_Sampler);
    modelMatrix = popMatrix();

    var f = initPersonBuffers(gl);
    if (f < 0) {
      console.log('Failed to set the vertex information');
      return;
    }

    humanWaving += deltaTime * ( 180 / Math.PI );
    var direction = humanWaving;
    if(humanWaving >= WAVING_ANGLE/2){
      humanWaving = humanWaving % (WAVING_ANGLE/2)
      direction = -direction;
    }
    walkDistance += walkSpeed;
    if(walkDistance > 1.95){
      walkDistance = -1.95
    }

    setTexCoords(gl,[0.6,0, 0.7,0, 0.7,0.4, 0.6,0.4]); //grey
    //model the head of a person
    pushMatrix(modelMatrix);
    modelMatrix.translate(0-walkDistance, -0.44, 2.1); // Scale
    modelMatrix.scale(0.1, 0.1, 0.1); // Scale
    loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, f, Randomtexture, u_Sampler);
    modelMatrix = popMatrix();
    //model the body of a person
    pushMatrix(modelMatrix);
    modelMatrix.translate(0-walkDistance, -0.54, 2.1); // Scale
    modelMatrix.scale(0.1, 0.26, 0.16); // Scale
    loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, f, Randomtexture, u_Sampler);
    modelMatrix = popMatrix();
    //model the legs of a person
    pushMatrix(modelMatrix);
    modelMatrix.translate(0-walkDistance, -0.78, 2.055); // Scale
    modelMatrix.rotate(direction,0,0,1);
    modelMatrix.scale(0.07, 0.2, 0.07); // Scale
    loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, f, Randomtexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
    modelMatrix.translate(0-walkDistance, -0.78, 2.145); // Scale
    modelMatrix.rotate(-direction,0,0,1);
    modelMatrix.scale(0.07, 0.2, 0.07); // Scale
    loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, f, Randomtexture, u_Sampler);
    modelMatrix = popMatrix();
    //model the hands of a person
    pushMatrix(modelMatrix);
    modelMatrix.translate(0-walkDistance, -0.545, 1.987); // Scale
    modelMatrix.rotate(direction,0,0,1);
    modelMatrix.scale(0.06, 0.28, 0.06); // Scale
    loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, f, Randomtexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
    modelMatrix.translate(0-walkDistance, -0.545, 2.213); // Scale
    modelMatrix.rotate(-direction,0,0,1);
    modelMatrix.scale(0.06, 0.28, 0.06); // Scale
    loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, f, Randomtexture, u_Sampler);
    modelMatrix = popMatrix();

    var g = initVertexBuffers(gl);
    if (g < 0) {
      console.log('Failed to set the vertex information');
      return;
    }

    traffic += deltaTime;
    var thisLight = currentLight;
    if(traffic > 3){
      thisLight = Math.floor((Math.random() * 3) + 1);
      while(thisLight == currentLight){
        thisLight = Math.floor((Math.random() * 3) + 1);
      }
      currentLight = thisLight
      traffic -= 3;
    }

    // setTexCoords(gl,[0.6,0.6, 1,0.6, 1,1, 0.6,1]); //green
    // setTexCoords(gl,[0,0, 0,0.4, 0.4,0.4, 0.4,0]); //yello
    // setTexCoords(gl,[0,0.6, 0.4,0.6, 0.4,1, 0,1]); //red

    setTexCoords(gl,[0.8,0, 1,0, 1,0.4, 0.8,0.4]) //black
    //model the traffic light
    pushMatrix(modelMatrix);
    modelMatrix.translate(1.85, -0.86, 2.25); // Scale
    modelMatrix.rotate(45,0,1,0);
    modelMatrix.scale(0.03, 0.14, 0.03); // Scale
    loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, g, Randomtexture, u_Sampler);
    modelMatrix = popMatrix();
    pushMatrix(modelMatrix);
    modelMatrix.translate(1.85, -0.56, 2.25); // Scale
    modelMatrix.rotate(45,0,1,0);
    modelMatrix.scale(0.06, 0.2, 0.06); // Scale
    loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, g, Randomtexture, u_Sampler);
    modelMatrix = popMatrix();

    if(thisLight == 1){
      setTexCoords(gl,[0,0.6, 0.4,0.6, 0.4,1, 0,1]); //red
    } else{
      setTexCoords(gl,[0.8,0, 1,0, 1,0.4, 0.8,0.4]) //black
    }
    pushMatrix(modelMatrix);
    modelMatrix.translate(1.81, -0.44, 2.29); // Scale
    modelMatrix.rotate(-45,0,1,0);
    modelMatrix.scale(0.04, 0.04, 0.005); // Scale
    loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, g, Randomtexture, u_Sampler);
    modelMatrix = popMatrix();

    if(thisLight == 2){
      setTexCoords(gl,[0,0, 0,0.4, 0.4,0.4, 0.4,0]); //yello
    } else{
      setTexCoords(gl,[0.8,0, 1,0, 1,0.4, 0.8,0.4]) //black
    }
    pushMatrix(modelMatrix);
    modelMatrix.translate(1.81, -0.56, 2.29); // Scale
    modelMatrix.rotate(-45,0,1,0);
    modelMatrix.scale(0.04, 0.04, 0.005); // Scale
    loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, g, Randomtexture, u_Sampler);
    modelMatrix = popMatrix();

    if(thisLight == 3){
      setTexCoords(gl,[0.6,0.6, 1,0.6, 1,1, 0.6,1]); //green
    } else{
      setTexCoords(gl,[0.8,0, 1,0, 1,0.4, 0.8,0.4]) //black
    }
    pushMatrix(modelMatrix);
    modelMatrix.translate(1.81, -0.68, 2.29); // Scale
    modelMatrix.rotate(-45,0,1,0);
    modelMatrix.scale(0.04, 0.04, 0.005); // Scale
    loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, g, Randomtexture, u_Sampler);
    modelMatrix = popMatrix();

  }
  Randomtexture.image.src = "src/color.jpg"
}

function loadTexAndDraw(gl, u_ModelMatrix, u_NormalMatrix, n, texture, u_Sampler) {
  pushMatrix(modelMatrix);

  // Pass the model matrix to the uniform variable
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  // Calculate the normal transformation matrix and pass it to u_NormalMatrix
  g_normalMatrix.setInverseOf(modelMatrix);
  g_normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

  // activate TEXTURE0
  gl.activeTexture(gl.TEXTURE0);

  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, texture.image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

  // Assign u_Sampler to TEXTURE0
  gl.uniform1i(u_Sampler, 0);

  // Draw the cube
  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

  modelMatrix = popMatrix();
}

function setTexCoords(gl,p){
  var list = []
  for(var i = 0; i < 6; i++){
    for(var j in p){
      list.push(p[j]);
    }
  }
  var final = new Float32Array(list);
  if (!initArrayBuffer(gl, 'a_TexCoords', final, 2)) return -1;
}

function resetTexCoords(gl, offset, x, y, z, front, right, up, left, down, back){

  x = x/offset;
  y = y/offset;
  z = z/offset;

  var coords = [];

  if(!front){
    for(var i = 0; i < 8; i++){
      coords.push(0)
    }
  } else{
    coords.push(x)
    coords.push(y)
    coords.push(0)
    coords.push(y)
    coords.push(0)
    coords.push(0)
    coords.push(x)
    coords.push(0)
  }

  if(!right){
    for(var i = 0; i < 8; i++){
      coords.push(0)
    }
  } else{
    coords.push(0)
    coords.push(y)
    coords.push(0)
    coords.push(0)
    coords.push(z)
    coords.push(0)
    coords.push(z)
    coords.push(y)
  }

  if(!up){
    for(var i = 0; i < 8; i++){
      coords.push(0)
    }
  } else{
    coords.push(x)
    coords.push(0)
    coords.push(x)
    coords.push(z)
    coords.push(0)
    coords.push(z)
    coords.push(0)
    coords.push(0)
  }

  if(!left){
    for(var i = 0; i < 8; i++){
      coords.push(0)
    }
  } else{
    coords.push(z)
    coords.push(y)
    coords.push(0)
    coords.push(y)
    coords.push(0)
    coords.push(0)
    coords.push(z)
    coords.push(0)
  }

  if(!down){
    for(var i = 0; i < 8; i++){
      coords.push(0)
    }
  } else{
    coords.push(0)
    coords.push(0)
    coords.push(x)
    coords.push(0)
    coords.push(x)
    coords.push(z)
    coords.push(0)
    coords.push(z)
  }

  if(!back){
    for(var i = 0; i < 8; i++){
      coords.push(0)
    }
  } else{
    coords.push(0)
    coords.push(0)
    coords.push(x)
    coords.push(0)
    coords.push(x)
    coords.push(y)
    coords.push(0)
    coords.push(y)
  }

  var final = new Float32Array(coords);

  if (!initArrayBuffer(gl, 'a_TexCoords', final, 2)) return -1;
}

var colors = new Float32Array([    // Colors
  1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,
  1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,
  1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,
  1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,
  1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1,
  1, 1, 1,   1, 1, 1,   1, 1, 1,  1, 1, 1　
]);

function resetColor(gl, sides){
  var list = []
  for(var i in sides){
    for(var j = 0; j < 4; j++){
      for(var k in sides[i]){
        list.push(sides[i][k]/255)
      }
    }
  }
  var colors = new Float32Array(list);
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
}
