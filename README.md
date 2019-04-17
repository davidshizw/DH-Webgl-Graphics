SM Computer Graphics Summative Assignment

>>> Introduction

I developed a small 3D environment based on a building located in Gilesgate, Durham. There are three folders and one source file in the parent directory of this document. They are:

1. index.html -> You can use your browser to open this file to view my 3D model
2. /src -> stores all texture images of my implementation
3. /lib -> stores all graphic packages given by the professor
4. /js -> stores .js file of my implentation

>>> Requirement

To view my 3D environment, your browser has to support WebGL. Please visit this link to check your browser: https://get.webgl.org/. If you are a Chrome user, you have to enable the '--allow-file-access-from-files' functionality to view the building properly. Please visit this link for further information: https://cmatskas.com/interacting-with-local-data-files-using-chrome/.

Alternatively, I hosted my 3D environment in IBM cloud server. You can check it by visiting https://webgl.eu-gb.mybluemix.net/

In order to have a better perforance, I strongly recommand you to open my file by Microsoft Edge. If the scene is very laggy, e.g., the person's legs and hands rotate 360 degrees, you can watch the demonstration video provided in the folder for reference.

>>> Features

I built my 3D environment wall by wall. You can see the interior of the building by rotating the scene using arrow keys. Alternatively, you can drag the xView, yView, and zView to 0, 0, 0 respectively to put the virtual camera in the building. There are five movable objects in my implementation. They are the building doors, walking person, two cars, and traffic light. The traffic light will change color every 3 seconds. You can customize other objects by clicking the buttons provided.