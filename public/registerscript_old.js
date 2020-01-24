circleColorsJsonURL = window.location.href + 'circle_colors';
const CHOOSE_CIRCLE_MOUSE_APPROACH_RANGE = 50;
// const CHOOSE_CIRCLE_APPROACH_BOX_SIDE = 100;
const CHOOSE_CIRCLE_DEFAULT_DIAMETER = 30;
const CHOOSE_CIRCLE_MAX_DIAMETER = 50;
const CHOOSE_CIRCLE_APPROACH_DIAMETER_DIFF = CHOOSE_CIRCLE_MAX_DIAMETER - CHOOSE_CIRCLE_DEFAULT_DIAMETER;

// 0: "#1488CC"
// 1: "#2B32B2"

// let $redLocator = $('#redLocator');

let $chooseCircleWrapper = $('#chooseCircleWrapper');
let $regChooseCircleColor = $('#regChooseCircleColor');
let circleChoiceContainers;
// console.log(circleChoiceContainers);
let $selectedCircle;
// circleChoiceContainers = $regChooseCircleColor.children();
let $regYourCircle = $('#regYourCircle');
let degree = '90deg';

let yourCircleSelectedStyle = $regYourCircle.css('background');

let lastMouseX;
let lastMouseY;

$.getJSON('./circle_colors.json', function (dataArray) {
	// console.log(result[0]);
	let circleColorsHtml = '';
	for (let i = 0; i < dataArray.length; i++) {
		let colorData = dataArray[i];
		let colorName = colorData.name;
		let colorsArray = colorData.colors;
		// circleColorsHtml += `
		// <div class="circle_choice_container">
		// <div class="circle_choice" style="background: linear-gradient(${degree},`;
		circleColorsHtml += `
		<div class="circle_choice_container">
		<div class="circle_choice" style="background: linear-gradient(${degree},`;
		//+rgbs
		for (let j = 0; j < colorsArray.length; j++) {
			circleColorsHtml += hexToRgbString(colorsArray[j]);
			if (j != colorsArray.length - 1) {
				circleColorsHtml += ',';
			}
		}
		// circleColorsHtml += `);"></div></div>`;
		circleColorsHtml += `);"></div></div>`;
		// break;
	}
	$regChooseCircleColor.append(circleColorsHtml);
	circleChoiceContainers = $regChooseCircleColor.children();
	for (let i = 0; i < circleChoiceContainers.length; i++) {
		let container = circleChoiceContainers[i];
		let $circle = $($(container).children()[0]);
		$circle.click(function () {
			console.log($('body').css('width'));
			if ($selectedCircle != null && !($circle.get(0) === $selectedCircle.get(0))) {
				// console.log('tryna animate');
				$selectedCircle.animate({
					'min-width': CHOOSE_CIRCLE_DEFAULT_DIAMETER,
					'min-height': CHOOSE_CIRCLE_DEFAULT_DIAMETER
				}, {
					duration: 200,
					step: function (now, fx) {
						// let $container = $(container);
						let offset = $(this).offset();
						let width = $(this).width();
						let height = $(this).height();

						let selectedCircleCenterX = offset.left + width / 2;
						let selectedCircleCenterY = offset.top + height / 2;
						

						let mouseDistanceToObjectCenter = Math.round(euclideanDistance(selectedCircleCenterX, selectedCircleCenterY, lastMouseX, lastMouseY));

						let isMouseInRange = mouseDistanceToObjectCenter < CHOOSE_CIRCLE_MOUSE_APPROACH_RANGE;

						if (isMouseInRange) {
							let howCloseToCenterModifier = 1 - (mouseDistanceToObjectCenter) / (CHOOSE_CIRCLE_MOUSE_APPROACH_RANGE);

							let howCloseToEdgeModifier = 1 - (mouseDistanceToObjectCenter - CHOOSE_CIRCLE_MAX_DIAMETER / 2) / (CHOOSE_CIRCLE_MOUSE_APPROACH_RANGE - CHOOSE_CIRCLE_MAX_DIAMETER / 2);

							let circleSupposedDiameter = Math.round((CHOOSE_CIRCLE_DEFAULT_DIAMETER + CHOOSE_CIRCLE_APPROACH_DIAMETER_DIFF * howCloseToEdgeModifier) * 10) / 10;
							let minWidth = parseInt($(this).css('min-width'));
							console.log(circleSupposedDiameter , minWidth);
							// console.log(minWidth);
							if (circleSupposedDiameter >= minWidth) {
								$(this).stop();
								// $(this).css('min-width', circleSupposedDiameter);
							}
						}
					}
				});
			}
			yourCircleSelectedStyle = $circle.css('background');
			$regYourCircle.css('background', yourCircleSelectedStyle);
			$selectedCircle = $circle;
		});
		// $circle.on('mouseenter mouseleave', function (e) {
		// 	$regYourCircle.trigger(e.type); // trigger same events on your circle (needed for smooth color change)
		// });
	}

	// approach functionality (does not work because of overlapping elements (you cannot catch hover on 2 elements at once))
});

// $chooseCircleWrapper.get(0).addEventListener('mousemove', function (mouseEvent) {
document.body.addEventListener('mousemove', function (mouseEvent) {

	lastMouseX = mouseEvent.pageX;
	lastMouseY = mouseEvent.pageY;

	if (circleChoiceContainers == null) return;
	isAnyCircleHovered = false;

	for (let i = 0; i < circleChoiceContainers.length; i++) {
		let container = circleChoiceContainers[i];
		let $circle = $($(container).children()[0]);
		let $container = $(container);
		let offset = $container.offset();
		let width = $container.width();
		let height = $container.height();

		let containerCenterX = offset.left + width / 2;
		let containerCenterY = offset.top + height / 2;

		let mouseDistanceToObjectCenter = Math.round(euclideanDistance(containerCenterX, containerCenterY, mouseEvent.pageX, mouseEvent.pageY));
		let isMouseInRange = mouseDistanceToObjectCenter < CHOOSE_CIRCLE_MOUSE_APPROACH_RANGE;
		// make selected circle bigger than others
		if ($selectedCircle != null && $circle.get(0) === $selectedCircle.get(0)) {
			// do nothing
		} else if ($circle.is(":hover")) {
			isAnyCircleHovered = true;
			$circle.css({
				'min-width': CHOOSE_CIRCLE_MAX_DIAMETER,
				'min-height': CHOOSE_CIRCLE_MAX_DIAMETER
			});
			circleStyle = $circle.css('background');
			if (yourCircleSelectedStyle != circleStyle) {
				$regYourCircle.css('background', circleStyle);
			}
		} else if (isMouseInRange) {
			// $('#testoutput').text(mouseDistanceToObjectCenter);
			let howCloseToCenterModifier = 1 - (mouseDistanceToObjectCenter) / (CHOOSE_CIRCLE_MOUSE_APPROACH_RANGE);

			let howCloseToEdgeModifier = 1 - (mouseDistanceToObjectCenter - CHOOSE_CIRCLE_MAX_DIAMETER / 2) / (CHOOSE_CIRCLE_MOUSE_APPROACH_RANGE - CHOOSE_CIRCLE_MAX_DIAMETER / 2);

			let circleDiameter = Math.round((CHOOSE_CIRCLE_DEFAULT_DIAMETER + CHOOSE_CIRCLE_APPROACH_DIAMETER_DIFF * howCloseToEdgeModifier) * 10) / 10;
			$circle.css({
				'min-width': circleDiameter,
				'min-height': circleDiameter
			});
		} else {
			$circle.css({
				'min-width': CHOOSE_CIRCLE_DEFAULT_DIAMETER,
				'min-height': CHOOSE_CIRCLE_DEFAULT_DIAMETER
			});
		}
	}

	// interrupts changing background on hover
	if (!isAnyCircleHovered) {
		console.log("set");
		$regYourCircle.css('background', yourCircleSelectedStyle);
	}


}, false);

function hexToRgbString(hex) {
	hex = hex.replace('#', '');
	let r = parseInt(hex.substring(0, 2), 16);
	let g = parseInt(hex.substring(2, 4), 16);
	let b = parseInt(hex.substring(4, 6), 16);
	return 'rgb(' + r + "," + g + "," + b + ')';
}

function euclideanDistance(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2));
}

function getPageWidth() {
	return Math.max(
		document.body.scrollWidth,
		document.documentElement.scrollWidth,
		document.body.offsetWidth,
		document.documentElement.offsetWidth,
		document.documentElement.clientWidth
	);
}

// to move red locator
// 	$redLocator.css({
// 		left:  mouseEvent.pageX,
// 		top:   mouseEvent.pageY
//  });


// http://jsfiddle.net/ThinkingStiff/UhE2C/
// function isMouseOverCircleApproachBox(container, mouseEvent) {
// 	var $container = $(container);
// 	var offset = $container.offset();
// 	var width = $container.width();
// 	var height = $container.height();

// 	var containerCenterX = offset.left + width / 2;
// 	var containerCenterY = offset.top + height / 2;

// 	var left = containerCenterX - CHOOSE_CIRCLE_APPROACH_BOX_SIDE / 2,
// 		top = containerCenterY - CHOOSE_CIRCLE_APPROACH_BOX_SIDE / 2,
// 		right = left + CHOOSE_CIRCLE_APPROACH_BOX_SIDE,
// 		bottom = top + CHOOSE_CIRCLE_APPROACH_BOX_SIDE;
// 	// console.log(container.offsetLeft);
// 	return (mouseEvent.pageX > left && mouseEvent.pageX < right && mouseEvent.pageY > top && mouseEvent.pageY < bottom);
// }

// function calculateDistance($elem, mouseX, mouseY) {
// 	return Math.floor(Math.sqrt(Math.pow(mouseX - ($elem.offset().left + ($elem.width() / 2)), 2) + Math.pow(mouseY - ($elem.offset().top + ($elem.height() / 2)), 2)));
// }

// function isMouseInRange(elemenetCenterX, elementCenterY, mouseX, mouseY, range) {

// }