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
//    mesh = new THREE.Object3D(),

    particleSetCount = 3000,
    numParticleSets,
    particleSets = [], particleSystems = [],
    particleMaterials = [],
    p,
    pointLight = new THREE.PointLight(0xFFFFFF),
    t = 0, t2 = 0, step = 0.005,
    phi, theta;

  function render() {
    /* update scene */
    var i, j, pointIndexAlongPattern, splines = pattern.pattern.splines(), particle;



    for (i = 0; i < numParticleSets; i += 1) {
      for (j = 0; j < particleSetCount; j += 1) {
        particle = particleSets[i].vertices[j];

        particle.celticT += particle.velocity;
        if (particle.celticT > 1.0) { particle.celticT = particle.celticT - 1.0; }

        pointIndexAlongPattern = splines[i].value_at(particle.celticT);
        particle.position.x = pointIndexAlongPattern.getX() + particle.offsetX;
        particle.position.y = pointIndexAlongPattern.getY() + particle.offsetY;
        particle.position.z = pointIndexAlongPattern.getZ() + particle.offsetZ;
      }
      particleSystems[i].geometry.__dirtyVertices = true;
    }

    // update camera position from mouse
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
    mouseX = (event.clientX - windowHalfX) * 5;
    mouseY = (event.clientY - windowHalfY) * 5;
  }

  function rndInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min + 1);
  }

  function rnd(min, max) {
    return Math.random * (max - min) + min;
  }

  function newPattern() {
    var pX, pY, pZ, particle, pointIndexAlongPattern, i, j, splines, pOffsetX, pOffsetY, pOffsetZ, maxOffset;
//    pattern = new Celtic({type: 0});
    pattern = new Celtic({type: 2,
                        shape1: 1,
                        shape2: 1,
                        width: 400,
                        step: 0.1,
                        margin: 0,
                        nb_orbits: 2,
                        nb_nodes_per_orbit: 3,
                        triangle_edge_size: 100,
                        tgrid_edge_size: 200,
                        kennicott_edge_size: 80,
                        kennicott_cluster_size: 10
                       });

    splines = pattern.pattern.splines();
    numParticleSets = splines.length;
    particleSets = [];
    particleSystems = [];

    for (i = 0; i < numParticleSets; i += 1) {
      scene.remove(particleSystems[i]);
    }

//    scene.remove(mesh);
//    mesh = new THREE.Object3D();
//    pattern = new Celtic({type: 0});
//    scene.add(mesh);

    for (i = 0; i < numParticleSets; i += 1) {
      particleSets[i] = new THREE.Geometry();
      for (j = 0; j < particleSetCount; j += 1) {

        maxOffset = 30;
        pOffsetX = (Math.random() - 0.5) * maxOffset;
        pOffsetY = (Math.random() - 0.5) * maxOffset;
        pOffsetZ = (Math.random() - 0.5) * maxOffset;

        pointIndexAlongPattern = splines[i].value_at(0);
        pX = pointIndexAlongPattern.getX() + pOffsetX;
        pY = pointIndexAlongPattern.getY() + pOffsetY;
        pZ = pointIndexAlongPattern.getZ() + pOffsetZ;
        particle = new THREE.Vertex(new THREE.Vector3(pX, pY, pZ));
        particle.celticT = 0;
        particle.velocity = Math.random() * 0.0005 + 0.00003;
//        particle.radialPosition = Math.random() * 2 * Math.PI;
//        particle.distanceFromCurve = Math.random() * 0.0001;
        particle.offsetX = pOffsetX;
        particle.offsetY = pOffsetY;
        particle.offsetZ = pOffsetZ;



        // add it to the geometry
        particleSets[i].vertices.push(particle);

        particleMaterials[i] = new THREE.ParticleBasicMaterial({ color: Math.random() * 0x999999 + 0x666666,
                                                                 size: 20,
                                                                 map: THREE.ImageUtils.loadTexture("images/particle.png"),
                                                                 blending: THREE.AdditiveBlending,
                                                                 transparent: true });

      }

      // create the particle system
      particleSystems[i] = new THREE.ParticleSystem(particleSets[i], particleMaterials[i]);
      particleSystems[i].sortParticles = true;
      scene.add(particleSystems[i]);
    }
  }


//  pattern = new Celtic({type: 2,
//                        shape1: 1,
//                        shape2: 2,
//                        width: 400,
//                        step: 0.1,
//                        margin: 0,
//                        nb_orbits: 4,
//                        nb_nodes_per_orbit: 8,
//                        triangle_edge_size: 100,
//                        tgrid_edge_size: 400,
//                        kennicott_edge_size: 80,
//                        kennicott_cluster_size: 10
//                       });
  newPattern();

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

  animate();
  document.addEventListener('mousemove', onDocumentMouseMove, false);
  $container.click(function () { newPattern(); });

}());