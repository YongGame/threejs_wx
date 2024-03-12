import * as THREE from 'libs/three.js'
import { KTXLoader } from 'KTXLoader.js';
import * as SPECTOR from 'libs/spector.js'

let ctx = canvas.getContext('webgl2') // {premultipliedAlpha:false, alpha:false}
console.log(ctx)

let spector = new SPECTOR.Spector();
  spector.onCapture.add((capture) => {
  // Do something with capture.
  console.log(JSON.stringify(capture));
});


  setTimeout(function () {
  //  需要执行的代码
  console.log('定时器执行了')
  spector.captureCanvas(canvas);
  }, 3000); // 2000为毫秒级参数，表示2秒
    
let scene
let camera
let renderer
let cube
let texture
let aa

let formats

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
		camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
		renderer = new THREE.WebGLRenderer({ context: ctx })
		renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(renderer.domElement);

		formats = {
			astc: renderer.extensions.has('WEBGL_compressed_texture_astc'),
			etc1: renderer.extensions.has('WEBGL_compressed_texture_etc1'),
			etc2: renderer.extensions.has('WEBGL_compressed_texture_etc'),
			s3tc: renderer.extensions.has('WEBGL_compressed_texture_s3tc'), // pc
			pvrtc: renderer.extensions.has('WEBGL_compressed_texture_pvrtc') // ios
		};
		console.log(formats.astc); // 安卓
		console.log(formats.etc1); // 安卓
		console.log(formats.etc2); // 安卓
		console.log(formats.s3tc); // PC
		console.log(formats.pvrtc); // IOS

		//... 其它代码块 ...
		texture = new THREE.TextureLoader().load("images/bg.jpg");
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		console.log(texture)

		this.createBox1();
		this.createBox2();

		this.testCompressTex();
		this.createLine();
		camera.position.x = 3;
		camera.position.y = 3;
		camera.position.z = 3;
		camera.lookAt(new THREE.Vector3(0, 0, 0))
		// 开始循环
		this.loop()
	}

	testCompressTex() {
		// https://threejs.org/examples/webgl_loader_texture_ktx.html
		

		const texture = new THREE.CompressedTexture();
		const geometry = new THREE.BoxGeometry( 1, 1, 1 );
		let material1 = new THREE.MeshBasicMaterial( {
			map: texture
		} );
		material1.map.colorSpace = THREE.SRGBColorSpace;
		const mesh = new THREE.Mesh( geometry, material1 );
		mesh.position.z = 2;
		scene.add(mesh);
		
		if(formats.s3tc){
			console.log("pc")
			this.loadKtx('http://127.0.0.1:5501/images/compressed/disturb_BC1.ktx', texture); // pc的地址和安卓不同 。web服务使用vscode的Go Live 搭建。
		}
		if(formats.etc1){
			console.log("安卓")
			//this.loadKtx('http://192.168.240.132:5501/images/compressed/disturb_ETC1.ktx', texture); // 安卓
		}
		if(formats.astc){
			console.log("安卓")
			this.loadKtx('http://192.168.240.132:5501/images/compressed/lensflare_ASTC8x8.ktx', texture); // 安卓
		}
			
	}

	loadKtx(url, texture){
		// threejs 自带的 KTXLoader -> FileLoader 无法正确加载，这里自定义加载方式
		// 1. 创建一个 new XMLHttpRequest 对象
		let xhr = new XMLHttpRequest();
		xhr.responseType = "arraybuffer";
		xhr.open('GET', url);
		// 2. 配置它：从 URL /article/.../load GET-request
		// 4. 当接收到响应后，将调用此函数
		xhr.onload = function() {
			if (xhr.status != 200) { // 分析响应的 HTTP 状态
				console.log(`Error`,xhr.status); // 例如 404: Not Found
			} else { // 显示结果
				console.log(`Done`); // response 是服务器响应
	
				console.log(xhr.response);
				const loader = new KTXLoader();
				let texDatas = loader.parse(xhr.response, true); // true 生成 mipmap
				console.log(texDatas);
	
				
				texture.image.width = texDatas.width;
				texture.image.height = texDatas.height;
				texture.mipmaps = texDatas.mipmaps;
				if ( texDatas.mipmapCount === 1 ) texture.minFilter = THREE.LinearFilter;
				texture.format = texDatas.format;
				texture.needsUpdate = true;
			}
		};
		xhr.onerror = function() {
			console.log("Request failed",xhr.status);
		};

		// 3. 通过网络发送请求
		xhr.send();
	}

	createBox2() {
		const geometry = new THREE.BoxGeometry(1, 1, 1);
		//const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
		const material = new THREE.MeshBasicMaterial({ map: texture });
		let cube1 = new THREE.Mesh(geometry, material);
		cube1.translateX(2)
		scene.add(cube1);
	}

	createBox1() {
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

		let fragmentShader = `
            precision mediump float;
            precision mediump int;
            out vec4 outColor;
            
            uniform sampler2D map;
            uniform sampler2D aaa;

            in vec2 uv2;

            void main()	{
                
              vec4 aa = texture( aaa, uv2 );
                vec4 diff = texture( map, uv2 );
                
                diff.rgb *= aa.r;
                
                //if(aa.r < 0.1) diff.rgb = vec3(1.0,0.0,0.0);
                outColor = aa;

            }
        `;
		
		
		let bg;
		let a;
		if(formats.etc1){
			bg = new THREE.CompressedTexture();
			a = new THREE.CompressedTexture();
			this.loadKtx('http://192.168.240.132:5501/images/compressed/bg.KTX', bg); // 安卓
			this.loadKtx('http://192.168.240.132:5501/images/compressed/a2.KTX', a); // 安卓
		}
		if(formats.s3tc){
			bg = new THREE.TextureLoader().load( "images/bg.jpg");
			a = new THREE.TextureLoader().load("images/a2.png");
		}

		const rawMaterial = new THREE.RawShaderMaterial({
			glslVersion: THREE.GLSL3,
			name: 'haha',
			uniforms: {
				map: { value: bg },
				aaa: { value: a }
			},
			vertexShader: vertexShader,
			fragmentShader: fragmentShader,
			side: THREE.DoubleSide,
			transparent: false
		});

		const geometry = new THREE.BoxGeometry(1, 1, 1);
		cube = new THREE.Mesh(geometry, rawMaterial);
		scene.add(cube);
	}

	onLoaded(tex) {

		// 读取加载的图像的像素值
		// 先将 img 绘制到帧缓冲，然后使用 readPixels 进行读取
		let gl = ctx;
		gl.activeTexture(gl.TEXTURE0);
		let texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		const framebuffer = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, aa.image);
		gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
		let data = new Uint8Array(5 * 5 * 4);
		gl.readPixels(0, 0, 5, 5, gl.RGBA, gl.UNSIGNED_BYTE, data);
		console.log(data)

		// 读取图像的像素值
		/*
		var canvas = document.createElement('canvas');
			  var context = canvas.getContext('2d');
			  context.drawImage(tex.image, 0, 0, 512, 512);
		console.log(context.getImageData(0, 0, 5, 5).data);
		*/
	}

	createLine() {

		const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
		const points = [];
		points.push(new THREE.Vector3(0, 0, 0));
		points.push(new THREE.Vector3(10, 0, 0));

		points.push(new THREE.Vector3(0, 0, 0));
		points.push(new THREE.Vector3(0, 10, 0));

		points.push(new THREE.Vector3(0, 0, 0));
		points.push(new THREE.Vector3(0, 0, 10));

		const geometry = new THREE.BufferGeometry().setFromPoints(points);
		const line = new THREE.Line(geometry, material);
		scene.add(line)
	}

	// UPDATE 更新
	update() {
		// ... 数据更新代码块 ...
		//cube.rotation.x += 0.01;
		//cube.rotation.y += 0.01;
	}

	// RENDER 渲染
	render() {
		// ... 渲染代码块 ...
		renderer.render(scene, camera);
	}

	// 实现游戏帧循环
	loop() {
		this.update()
		this.render()

		window.requestAnimationFrame(this.loop.bind(this), canvas)
	}
}