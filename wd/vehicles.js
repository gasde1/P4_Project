import * as T from "../libs/Three/build/three.module.js";
import { Group } from "../libs/Three/build/three.module.js";

//train windows
let loader = new T.TextureLoader();
let grey_window = loader.load("../textures/grey.png");

//define materials
let top_cabin_mats = [
    new T.MeshStandardMaterial({ color: 'firebrick', flatShading: true }), //original material
    new T.MeshStandardMaterial({ color: 'firebrick', map: grey_window })  //window texture material
];

let bot_cabin_mat = new T.MeshStandardMaterial({ color: 'firebrick', flatShading: true });

let engine_mat = new T.MeshStandardMaterial({
    color: 'black',
    flatShading: true,
});

let detail_mat = new T.MeshStandardMaterial({
    color: 'darkslategray',
    flatShading: true,
});

//define train geometries
//train cabine
let top_cabin_geo = new T.BoxGeometry(2, 1, 1.5);
let bottom_cabin_geo = new T.BoxGeometry(2, 1.75, 1.5);

//each face so we can apply windows to only the sides
top_cabin_geo.addGroup(0, 6, 0);
top_cabin_geo.addGroup(6, 8, 1); //front.  Not sure why it's only 6-8, but it works....6-12 covers the top
top_cabin_geo.addGroup(12, 18, 0);
top_cabin_geo.addGroup(24, 36, 1); 

//train engine
let engine_geo = new T.CylinderGeometry(0.75, 0.75, 3, 12);

//wheels (only need to define one)
let wheel_geo = new T.CylinderGeometry(0.4, 0.4, 1.75, 16);

//smokestack (or just stack)
let stack_geo = new T.CylinderGeometry(0.3, 0.1, 0.5);

export class Train extends Group{
    constructor(params = {}) {
        super();

        //create the train meshes
        let top_cabin = new T.Mesh(top_cabin_geo, top_cabin_mats);
        let bottom_cabin = new T.Mesh(bottom_cabin_geo, bot_cabin_mat)
        bottom_cabin.position.set(1.5, 1.15, 0);
        top_cabin.position.set(1.5, 2.5, 0);
        
        let stack = new T.Mesh(stack_geo, detail_mat);
        stack.position.set(-2, 1.9, 0);
      
        let engine = new T.Mesh(engine_geo, engine_mat);
        engine.position.set(-1, 1, 0);
        engine.rotation.z = Math.PI / 2;
      
        let smallWheelRear = new T.Mesh(wheel_geo, detail_mat);
        smallWheelRear.position.y = 0.5;
        smallWheelRear.rotation.x = Math.PI / 2;
      
        let smallWheelCenter = smallWheelRear.clone();
        smallWheelCenter.position.x = -1;
      
        let smallWheelFront = smallWheelRear.clone();
        smallWheelFront.position.x = -2;
      
        let bigWheel = smallWheelRear.clone();
        bigWheel.position.set(1.5, 0.9, 0);
        bigWheel.scale.set(2, 1.25, 2);

        this.add(top_cabin, bottom_cabin, stack, engine, smallWheelRear, smallWheelCenter, smallWheelFront, bigWheel);
        //parameters for moving and rotating object
        this.translateX(params.x);
        this.translateZ(params.z);

        //rotation, default is 0
        this.rotateY(params.ry || 0);
        this.scale.set(params.sx || 1, params.sy || 1, params.sz || 1)

    }
}

//cyber SUV car like a model X

import { GLTFLoader } from '../libs/Three/examples/jsm/loaders/GLTFLoader.js';

export class CyberTruck extends Group{
    constructor(params = {}) {
        super();
        
        const loader = new GLTFLoader();
        loader.load("../textures/cybertruck.glb", (gltf) => {
            this.add( gltf.scene );
            this.translateY(0.35);
        });
        
        //parameters for moving and rotating object
        this.translateX(params.x);
        this.translateZ(params.z);

        //rotation, default is 0
        this.rotateY(params.ry || 0);
        this.scale.set(params.sx || 1, params.sy || 1, params.sz || 1)
        
    }
}