// @ts-check

import * as T from "../libs/Three/build/three.module.js";
import { OrbitControls } from "../libs/Three/examples/jsm/controls/OrbitControls.js";
import { Models } from "./models.js"
import { GameLogic } from "./gameLogic.js"

function version1() {
      /** Setup the window */
    let renderer = new T.WebGLRenderer({ preserveDrawingBuffer: true });
    renderer.setSize(600, 400);


    document.getElementById("button_area").appendChild(renderer.domElement);
    document.body.appendChild(renderer.domElement);

    const scene = new T.Scene();

    scene.background = new T.Color(0xdddddd);
    scene.add(new T.AmbientLight("white", 0.8));

    // two lights - both a little off white to give some contrast
    let dirLight1 = new T.DirectionalLight(0xf0e0d0, 1);
    dirLight1.position.set(1, 1, 0);
    scene.add(dirLight1);

    let dirLight2 = new T.DirectionalLight(0xd0e0f0, 1);
    dirLight2.position.set(-1, 1, -0.2);
    scene.add(dirLight2);

    // make a ground plane
    let groundBox = new T.BoxGeometry(10, 0.1, 10);
    let groundMesh = new T.Mesh(
        groundBox,
        new T.MeshStandardMaterial({ color: 0x88b888, roughness: 0.9 })
    );
    // put the top of the box at the ground level (0)
    groundMesh.position.y = -0.05;
    // scene.add(groundMesh);

    const plane = new T.PlaneGeometry(120, 16);
    const planeMesh = new T.Mesh(
        plane,
        new T.MeshStandardMaterial({ color: 0x88b888, roughness: 0.9, side: T.DoubleSide }),
    );

    const rampAngle = -0.2;
    planeMesh.position.y = 0;
    planeMesh.rotation.set(-Math.PI / 2, rampAngle, 0);
    scene.add(planeMesh);


    const plane2 = new T.PlaneGeometry(300, 100);
    const planeMesh2 = new T.Mesh(
        plane2,
        new T.MeshStandardMaterial({ color: 'gray', roughness: 0.9 })
    );
    planeMesh2.position.y = -10;
    planeMesh2.position.z = 0;
    planeMesh2.rotation.set(-Math.PI / 2, 0, 0);
    scene.add(planeMesh2);


    const hammerModel = new Models({
        model_input: "../models/hammer.glb",
        position: new T.Vector3(-10, 3, 0),
        rotation: new T.Euler(0, 0, Math.PI / 2),
        scale: new T.Vector3(1.5, 1.5, 1.5)
    })
    scene.add(hammerModel);


    const cyberTruck = new Models({
        model_input: "../textures/cybertruck.glb",
        position: new T.Vector3(-10, 1.5, 0),
        rotation: new T.Euler(0, -Math.PI, rampAngle),
        scale: new T.Vector3(0.5, 0.5, 0.5)
    })
    scene.add(cyberTruck);


    document.addEventListener("keydown", keyDown, false);
    document.addEventListener("mousedown", mouseDown, false);
    


    const main_camera = new T.PerspectiveCamera(
        40,
        renderer.domElement.width / renderer.domElement.height,
        1,
        1000
    );
    main_camera.position.set(10, 10, 20);
    main_camera.lookAt(0, 0, 0);
    // this will be the "current camera" - we will switch when a button is pressed
    let active_camera = main_camera;
    let camera_1 = new T.PerspectiveCamera(
        40,
        renderer.domElement.width / renderer.domElement.height,
        1,
        1000
    );
    // add orbit controls - but only to the main camera
    let controls = new OrbitControls(main_camera, renderer.domElement);

    function setupOrbitalCamButton(name, camera) {
        const button = document.getElementById(name);
        if (!(button instanceof HTMLButtonElement))
            throw new Error(`Button ${name} doesn't exist`);
    
        button.onclick = function () {
            // Update camera mode and active camera
            gameLogic.cameraMode = 0; // Update the mode explicitly
            active_camera = camera;
            controls = new OrbitControls(camera, renderer.domElement); // Enable orbit controls
            renderer.render(scene, active_camera);
        };
    }
    
    setupOrbitalCamButton("orbital_cam", main_camera);

    //used for first person function
    function setupFunctionButton(name, switchFunction) {
        const button = document.getElementById(name);
        if (!(button instanceof HTMLButtonElement))
            throw new Error(`Button ${name} doesn't exist`);
        button.onclick = function () {
            switchFunction(); // Call the switch function provided
            renderer.render(scene, active_camera); // Update the rendering to reflect the new mode
        };
    }

    //instanstiate gameLogic
    const gameLogic = new GameLogic({ ramp_Angle: rampAngle, camera: active_camera, scene: scene });

    //define functions 
    const {
        addCar,
        addHammer,
        frameLoop,
        cam_SwitchToFirstPerson,
        collisionMode,
        playGame,
        moveRight,
        moveLeft,
        slowDown,
        speedUp
    } = gameLogic;

    //setup switching to first person
    setupFunctionButton("cam_1", cam_SwitchToFirstPerson); // Calls cam_SwitchToFirstPerson

    document.addEventListener('DOMContentLoaded', function () {
        // Retrieve the slider element
        const hammer_slider = document.getElementById("slider_hammer");
        
        // Check if the slider is found
        if (hammer_slider) {
            // Add an event listener to update hammer speed when the slider value changes
            hammer_slider.addEventListener('input', function () {
                // Parse the slider value (which will be a string) to a floating-point number
                const newHammerSpeed = parseFloat(hammer_slider.value);
                gameLogic.setHammerSpeed(newHammerSpeed); // Make sure this method exists in your GameLogic class
            });
        } else {
            console.error('Slider element with ID "slider_hammer" not found.');
        }
    });

    //setup collision buttons
    function setupCollisionButton(name, switchFunction) {
        const button = document.getElementById(name);
        if (!(button instanceof HTMLButtonElement)) {
            throw new Error(`Button ${name} doesn't exist`);
        }
        button.onclick = function () {
            switchFunction(); // Call the provided function
            renderer.render(scene, active_camera); // Update the rendering to reflect the new mode
        };
    }
    setupCollisionButton("collision_normal", () => collisionMode(1));
    setupCollisionButton("collision_particle", () => collisionMode(2));
    

    //create car and hammer
    addCar(cyberTruck);
    addHammer(hammerModel);
    // animation loop
    function animateLoop(timeStep) {
        renderer.render(scene, active_camera);
        window.requestAnimationFrame(animateLoop);

        frameLoop(timeStep);
    }

    window.requestAnimationFrame(animateLoop);

    // Ensure the active camera is rendered
    renderer.render(scene, active_camera);

    //left click starts animation
    function mouseDown() {
        playGame();
    }


    //create what happens for different keyboard inputs
    function keyDown(event) {
        const key = event.key;

        switch (key) {
            case 'a':
            case 'A':
                moveLeft();
                break;

            case 'd':
            case 'D':
                moveRight();
                break;

            case 's':
            case 'S':
                slowDown();
                break;

            case 'w':
            case 'W':
                speedUp();
                break;

            default:
                break;
        }

    };
    }
version1();