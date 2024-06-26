import * as T from "../libs/Three/build/three.module.js";
import { Group } from "../libs/Three/build/three.module.js";
import { GLTFLoader } from '../libs/Three/examples/jsm/loaders/GLTFLoader.js';

const offsetCam = new T.Vector3(5, 2, 0);

export class GameLogic {
    constructor(params = {}) {
        // game settings
        this.cameraMode = 0;
        this.pause = true;
        this.crashed = false;

        // players objects
        this.player = null;
        this.incrementedPosition = new T.Vector3()
        this.hammer = null;

        // delta and animation timeline
        this.framedelta = 0;
        this.accelaratedDelta = 0;
        this.maxDelta = 1000; // game duration
        this.hammerSpeed = 1;

        this.wheelDirection = 0;

        // vectors; TODO: Make them dynamic to players car size
        this.startingPoint = new T.Vector3(10, 2.2, 0.25);
        this.currentPoint = new T.Vector3();
        this.endingPoint = new T.Vector3(-30, -5.8, 0.25);
        this.speedFactor = 0.7;
        this.camera = params.camera
        this.scene = params.scene;
        // Initialize particle system settings
        this.explosionParticles = null;
        this.explosionStart = null;
        // Call the particle initialization function
        this.initializeParticles();
        let collision_mode = 1;
        this.collision_mode = collision_mode;
    }

    //allow different camera perspectives
    cam_SwitchToOrbital = () => {
        this.cameraMode = 0;
    }

    cam_SwitchToFirstPerson = () => {
        this.cameraMode = 1;
    }
    
    //controls functions
    moveRight = () => {
        if (this.pause) {
            return;
        }
        if (this.wheelDirection < -0.2) {
            return;
        }
        this.wheelDirection -= 0.003;
    }

    moveLeft = () => {
        if (this.pause) {
            return;
        }
        if (this.wheelDirection > 0.2) {
            return;
        }
        this.wheelDirection += 0.003;
    }

    slowDown = () => {
        // Reduce speed 
        this.accelaratedDelta = Math.max(this.accelaratedDelta - this.speedFactor, 0);
    }

    speedUp = () => {
        //increase the accelerated delta to speed up
        this.accelaratedDelta += this.speedFactor;
    }

    addCar = (model) => {
        this.player = model;
    }

    addHammer = (model) => {
        this.hammer = model;
    }

    setHammerSpeed = (newSpeed) => {
        this.hammerSpeed = newSpeed;
    }

    removeCar = () => {
        this.player = null;
    }

    // Initialize the particle system
    initializeParticles = () => {
        const numParticles = 500;
        
        //shape of particles
        const particleGeometry = new T.BufferGeometry();
        const positions = new Float32Array(numParticles * 3);
        this.particleVelocities = new Float32Array(numParticles * 3); // Store velocity for each particle

        for (let i = 0; i < numParticles; i++) {
            //random initial pos
            positions[i * 3] = (Math.random() - 0.5) * 2;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 2;

            //random velocityies
            this.particleVelocities[i * 3] = (Math.random() - 0.5) * 0.5;
            this.particleVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
            this.particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
        }

        particleGeometry.setAttribute('position', new T.BufferAttribute(positions, 3));

        const particleMaterial = new T.PointsMaterial({
            color: "black",
            size: 0.3 
        });

        //object for particles
        this.explosionParticles = new T.Points(particleGeometry, particleMaterial);
        this.explosionParticles.visible = false;
        this.scene.add(this.explosionParticles);
    }

    //particle explosion trigger
    triggerExplosion = (position) => {
        this.explosionParticles.position.copy(position);
        this.explosionStart = Date.now(); // Start the explosion
        this.explosionParticles.visible = true;
    }

    //Used LLM to help with this part
    //update particle positions
    updateParticles = () => {
        if (!this.explosionStart) return;

        //move outwards
        const positions = this.explosionParticles.geometry.attributes.position.array;
        const scalingFactor = 0.3; //paricle speed
        for (let i = 0; i < positions.length / 3; i++) {
            //velocity vectors of particles
            positions[i * 3] += this.particleVelocities[i * 3] * scalingFactor;
            positions[i * 3 + 1] += this.particleVelocities[i * 3 + 1] * scalingFactor;
            positions[i * 3 + 2] += this.particleVelocities[i * 3 + 2] * scalingFactor;
        }

        // Update positions
        this.explosionParticles.geometry.attributes.position.needsUpdate = true;

        //dissapear after 3 seconds
        const elapsed = (Date.now() - this.explosionStart) / 1000;
        if (elapsed > 3) {
            this.explosionStart = null;
            this.explosionParticles.visible = false;
        }
    }

    //reset positions for next colliiosin
    resetParticles = () => {
        const positions = this.explosionParticles.geometry.attributes.position.array;
        for (let i = 0; i < positions.length / 3; i++) {

            positions[i * 3] = (Math.random() - 0.5) * 2;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 2;

            this.particleVelocities[i * 3] = (Math.random() - 0.5) * 0.5;
            this.particleVelocities[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
            this.particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
        }

        // Mark positions as needing an update
        this.explosionParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Update the crashed state
    updateCrashedState = () => {
        if (this.crashed) {
            this.resetParticles(); // Reset particles and velocities before triggering
            this.triggerExplosion(this.player.position); // Trigger explosion at the player's position
            this.crashed = false;
            this.reset(); // Optional: Reset after explosion
        }
    }


    //check if there is a cooliision based on box of hammer and car (player)
    checkForCollision = () => {

        const bBox1 = new T.Box3().setFromObject(this.player);
        const bBox2 = new T.Box3().setFromObject(this.hammer);

        const intersection = bBox1.intersectsBox(bBox2);
        if (!intersection) {
            return;
        }
        this.crashed = true;   //set crashed status
        this.pauseGame();
    }

    reset = () => {
        this.incrementedPosition.z = 0;
        this.accelaratedDelta = 0;
        this.pauseGame();
        this.framedelta = 0;
        this.player.position.copy(this.startingPoint);
        this.wheelDirection = 0;
    }


    //functions for pausing and playing game
    pauseGame = () => {
        this.pause = true;
    }

    playGame = () => {
        this.pause = false;
    }

    collisionMode = (mode) => {
        this.collision_mode = mode;
    }

    //change camera
    cameraController = () => {
        // First-person camera mode
        if (this.cameraMode === 1 && this.player) {
            this.camera.position.copy(this.player.position).add(offsetCam);
            this.camera.lookAt(this.player.position);
        } else if (this.cameraMode === 0) {
            // Do not override active camera settings in orbital mode
            return;
        }
    }

    wheelController = () => {
        this.player.rotation.y = this.wheelDirection - Math.PI;
        this.player.rotation.z = -Math.cos(this.wheelDirection) * 0.25 + 0.1;
    }

    //like animation loop but moved to game logic
    frameLoop = (timeStep) => {
        this.cameraController()
        this.wheelController()

        //hammer animation
        if (this.hammer) {
            const hammerRotationSpeed = this.hammerSpeed * 0.001; // Adjust this scaling factor as needed
            const elapsedTime = timeStep * hammerRotationSpeed;
            const hammerAngle = Math.sin(elapsedTime) * 1.5;
    
            this.hammer.setRotationFromEuler(new T.Euler(hammerAngle, 0, Math.PI / 2));
        }

        //animation if it hits the hammer
        if (this.collision_mode === 1) {
            if (this.crashed) {
                this.player.position.lerp(
                    new T.Vector3(
                        12,
                        30,
                        60
                    ), 0.01
                );
    
                const distanceFromHammer = this.player.position.distanceTo(this.hammer.position)
                if (distanceFromHammer > 25) {
                    this.crashed = false
                    this.reset()
                };
                return;
            }
        } else {
            if (this.crashed) {
            //if there was a crash set it
            this.updateCrashedState();
            }
        }

        //update particles for animation
        this.updateParticles();

        //don't do anything if the game is pasued
        if (this.pause) {
            return;
        }

        if (this.framedelta > this.maxDelta) {
            this.reset();
        }

        //check if the hammer hit the car
        this.checkForCollision();

        // calculate delta and mid position
        this.accelaratedDelta += .05;
        this.framedelta += this.accelaratedDelta;

        this.incrementedPosition.z += this.wheelDirection;

        this.currentPoint.copy(this.endingPoint).sub(this.startingPoint).multiplyScalar(this.framedelta / this.maxDelta).add(this.startingPoint);

        if (this.player) {
            this.player.position.copy(this.currentPoint.add(
                this.incrementedPosition
            ));
        }

    }
}