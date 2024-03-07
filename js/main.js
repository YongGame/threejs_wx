import * as THREE from 'libs/three.js'

let ctx   = canvas.getContext('webgl2')
console.log(ctx)

let scene
let camera
let renderer
let cube
let texture

// ... 其它变量／常量 ...

/**
 * 游戏主函数
 */
export default class Main {
  constructor() {
    this.start()
  }

  start() {
    // 初始化
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    renderer  = new THREE.WebGLRenderer({ context: ctx })
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    //... 其它代码块 ...
    texture = new THREE.TextureLoader().load( "images/leaf.png" );
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    console.log(texture)

    this.createBox1();
    this.createBox2();
    

    this.createLine();
    camera.position.x = 3;
    camera.position.y = 3;
    camera.position.z = 3;
    camera.lookAt(new THREE.Vector3(0,0,0))
    // 开始循环
    this.loop()
  }

  createBox2(){
    const geometry = new THREE.BoxGeometry( 1, 1, 1 );
    //const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    const material = new THREE.MeshBasicMaterial( { map: texture } );
    let cube1 = new THREE.Mesh( geometry, material );
    cube1.translateX(2)
    scene.add( cube1 );
  }

  createBox1(){
    let vertexShader = `
            precision mediump float;
            precision mediump int;

            uniform mat4 modelViewMatrix; // optional
            uniform mat4 projectionMatrix; // optional

            in vec3 position;
            in vec2 uv;

            out vec2 uv2;

            void main()	{
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
                uv2 = uv;
            }
        `;

        let fragmentShader=`
            precision mediump float;
            precision mediump int;
            out vec4 outColor;
            
            uniform sampler2D map;

            in vec2 uv2;

            void main()	{
                
                vec4 diff = texture( map, uv2 );
                
                outColor = diff;

            }
        `;
      
        const rawMaterial = new THREE.RawShaderMaterial( {
          glslVersion: THREE.GLSL3,
          name: 'haha',
          uniforms: {
              map:{value: texture}
          },
          vertexShader: vertexShader,
          fragmentShader: fragmentShader,
          side: THREE.DoubleSide,
          transparent: false
      } );

    const geometry = new THREE.BoxGeometry( 1, 1, 1 );
    cube = new THREE.Mesh( geometry, rawMaterial );
    scene.add( cube );
  }

  createLine(){

    const material = new THREE.LineBasicMaterial( { color: 0x0000ff } );
    const points = [];
    points.push( new THREE.Vector3( 0, 0, 0 ) );
    points.push( new THREE.Vector3( 10, 0, 0 ) );

    points.push( new THREE.Vector3( 0, 0, 0 ) );
    points.push( new THREE.Vector3( 0, 10, 0 ) );

    points.push( new THREE.Vector3( 0, 0, 0 ) );
    points.push( new THREE.Vector3( 0, 0, 10 ) );

    const geometry = new THREE.BufferGeometry().setFromPoints( points );
    const line = new THREE.Line( geometry, material );
    scene.add(line)
  }

  // UPDATE 更新
  update() {
    // ... 数据更新代码块 ...
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
  }

  // RENDER 渲染
  render() {
    // ... 渲染代码块 ...
    renderer.render( scene, camera );
  }

  // 实现游戏帧循环
  loop() {
    this.update()
    this.render()

    window.requestAnimationFrame( this.loop.bind(this), canvas )
  }
}