import * as THREE from 'libs/three.js'

let ctx   = canvas.getContext('webgl2')

console.log("111111111111111111111111111")
console.log(ctx)
console.log("111111111111111111111111111")
let scene
let camera
let renderer
let cube

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
    scene     = new THREE.Scene()
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    renderer  = new THREE.WebGLRenderer({ context: ctx })
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    console.log(renderer.capabilities)
    //... 其它代码块 ...
    const geometry = new THREE.BoxGeometry( 1, 1, 1 );
    const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    cube = new THREE.Mesh( geometry, material );
    scene.add( cube );

    camera.position.z = 5;
    // 开始循环
    this.loop()
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