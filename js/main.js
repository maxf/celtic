/*jslint devel: true, browser: true, maxerr: 50, indent: 2 */
var pattern;


var mouseX = 0, mouseY = 0;

			var windowHalfX = window.innerWidth / 2;
			var windowHalfY = window.innerHeight / 2;



// set the scene size
var WIDTH = 800, HEIGHT = 800;

// set some camera attributes
var VIEW_ANGLE = 45,
ASPECT = WIDTH / HEIGHT,
NEAR = 0.1,
FAR = 10000;


$("#tabs").tabs();
$('#slider-shape1').slider({ value: 0, min: -2, max: 2, step: 0.01 });
$('#slider-shape2').slider({ value: 0, min: -2, max: 2, step: 0.01 });
$('#slider-width').slider({ value: 5, min: 1, max: 10, step: 0.1 });
$('#slider-step').slider({ value: 0.01, min: 0.01, max: 0.5, step: 0.01 });
$('#slider-margin').slider({ value: 0, min: 0, max: 200, step: 1 });
$('#slider-nb_orbits').slider({value:3, min:2, max:11, step:1});
$('#slider-nb_nodes_per_orbit').slider({value:5, min:4, max:13, step:1});
$('#slider-triangle-edge_size').slider({value:80, min:20, max:200, step:.1});
$('#slider-tgrid-edge_size').slider({value:60, min:40, max:200, step:.1});
$('#slider-kennicott-edge_size').slider({value:80, min:70, max:90, step:.1});
$('#slider-kennicott-cluster_size').slider({value:10, min:5, max:30, step:.1});


// get the DOM element to attach to
// - assume we've got jQuery to hand
var $container = $('#container');

// create a WebGL renderer, camera
// and a scene
var renderer = new THREE.WebGLRenderer();
var camera = new THREE.PerspectiveCamera(
  VIEW_ANGLE,
  ASPECT,
  NEAR,
  FAR );

     var scene = new THREE.Scene();

     // the camera starts at 0,0,0 so pull it back
     camera.position.x = 0;
     camera.position.y = 0;
     camera.position.z = 1500;

     // start the renderer
     renderer.setSize(WIDTH, HEIGHT);

     // attach the render-supplied DOM element
     $container.append(renderer.domElement);

     var pattern = new Celtic({type: 2,
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
     //pattern.getGraph().draw(scene);
//     var group = new THREE.Object3D();
//     pattern.pattern.draw(scene, false);
     //pattern.draw(scene);

//     scene.add(group);

     // create a point light
     var pointLight = new THREE.PointLight( 0xFFFFFF );

     // set its position
     pointLight.position.x = 100;
     pointLight.position.y = 100;
     pointLight.position.z = 130;

     // add to the scene
     scene.add(pointLight);

     // draw!
     //renderer.render(scene, camera);
     animate();
     document.addEventListener( 'mousemove', onDocumentMouseMove, false );



			function onDocumentMouseMove(event) {

				mouseX = ( event.clientX - windowHalfX ) * 10;
				mouseY = ( event.clientY - windowHalfY ) * 10;
			}

			//

			function animate() {
				render();
				requestAnimationFrame( animate );
			}

var phi = 0, theta = 0;
var t=0, step=0.005;


			function render() {
  /* update scene */
  if (t < 1) {
    t2 = (t + step > 1) ? 1 : t + step;
    pattern.drawAt(scene, t, t2);
    t = t2;
  }

  phi =  mouseX  * .001;
  theta =  mouseY  * .001;

  camera.position.x = 2000 * Math.cos(phi) * Math.sin(theta);
  camera.position.y = 2000 * Math.sin(phi) * Math.sin(theta);
  camera.position.z = 2000 * Math.cos(phi);

				camera.lookAt( scene.position );

				renderer.render( scene, camera );

			}



//         $("#go").bind("click", function(event, ui) {
//           pattern = new Celtic({type: $("#tabs").tabs().tabs('option','selected'),
//                        shape1: $('#slider-shape1').slider('value'),
//                        shape2: $('#slider-shape2').slider('value'),
//                        width: $('#slider-width').slider('value'),
//                        step: $('#slider-step').slider('value'),
//                        margin: $('#slider-margin').slider('value'),
//                        nb_orbits: $('#slider-nb_orbits').slider('value'),
//                        nb_nodes_per_orbit: $('#slider-nb_nodes_per_orbit').slider('value'),
//                        triangle_edge_size: $('#slider-triangle-edge_size').slider('value'),
//                        tgrid_edge_size: $('#slider-tgrid-edge_size').slider('value'),
//                        kennicott_edge_size: $('#slider-kennicott-edge_size').slider('value'),
//                        kennicott_cluster_size: $('#slider-kennicott-cluster_size').slider('value')
//                       });
//             pattern.getGraph().draw(scene);
//           pattern.draw(scene);
//         });
