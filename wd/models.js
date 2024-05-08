import * as T from "../libs/Three/build/three.module.js";
import { Group } from "../libs/Three/build/three.module.js";
import { GLTFLoader } from '../libs/Three/examples/jsm/loaders/GLTFLoader.js';

//cyber SUV car like a model X

export class Models extends Group {
    constructor(params = {}) {
        super();

        const {
            model_input,
            position = new T.Vector3(),
            rotation = new T.Euler(),
            scale = new T.Vector3(1, 1, 1)
        } = params


        const loader = new GLTFLoader();
        loader.load(model_input, (gltf) => {
            this.add(gltf.scene);
        });

        this.position.copy(position);
        this.rotation.copy(rotation);
        this.scale.copy(scale);
    }
}