/*jslint devel: true, browser: true, maxerr: 50, indent: 2 */
var $, THREE, Celtic, requestAnimationFrame;
(function () {
  "use strict";

  var
    pattern,
    mouseX = 0, mouseY = 0,
    windowHalfX = window.innerWidth / 2,
    windowHalfY = window.innerHeight / 2,
    WIDTH = window.innerWidth, HEIGHT = window.innerHeight,
    VIEW_ANGLE = 45,
    ASPECT = WIDTH / HEIGHT,
    NEAR = 0.1,
    FAR = 10000,
    $container = $('#container'),
    renderer = new THREE.WebGLRenderer(),
    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR),
    scene = new THREE.Scene(),
    mesh = new THREE.Object3D(),
    pointLight = new THREE.PointLight(0xFFFFFF),
    t = 0, t2 = 0, step = 0.005,
    phi, theta;

  function render() {
    /* update scene */
    if (t < 1) {
      t2 = (t + step > 1) ? 1 : t + step;
      pattern.drawAt(mesh, t, t2);
      t = t2;
    }
    phi = mouseX * 0.001;
    theta = mouseY * 0.001;

    camera.position.x = 2000 * Math.cos(phi) * Math.sin(theta);
    camera.position.y = 2000 * Math.sin(phi) * Math.sin(theta);
    camera.position.z = 2000 * Math.cos(phi);

    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }

  function animate() {
    render();
    requestAnimationFrame(animate);
  }

  function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) * 10;
    mouseY = (event.clientY - windowHalfY) * 10;
  }

  function rndInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min + 1);
  }

  function rnd(min, max) {
    return Math.random * (max - min) + min;
  }

  function newPattern() {
    scene.remove(mesh);
    mesh = new THREE.Object3D();
    pattern = new Celtic({type: 0});
    scene.add(mesh);
    t = 0;
  }

  pattern = new Celtic({type: 2,
                        shape1: 1,
                        shape2: 2,
                        width: 400,
                        step: 0.1,
                        margin: 0,
                        nb_orbits: 4,
                        nb_nodes_per_orbit: 8,
                        triangle_edge_size: 100,
                        tgrid_edge_size: 400,
                        kennicott_edge_size: 80,
                        kennicott_cluster_size: 10
                       });
  renderer.setSize(WIDTH, HEIGHT);
  $container.append(renderer.domElement);


  // the camera starts at 0,0,0 so pull it back
  camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = 1500;
  scene.add(camera);

  pointLight.position.x = 100;
  pointLight.position.y = 100;
  pointLight.position.z = 130;
  scene.add(pointLight);

  scene.add(mesh);
  animate();
  document.addEventListener('mousemove', onDocumentMouseMove, false);
  $container.click(function () { newPattern(); });

}());