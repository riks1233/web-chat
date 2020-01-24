const CHOOSE_CIRCLE_MOUSE_APPROACH_RANGE = 70;
// const CHOOSE_CIRCLE_APPROACH_BOX_SIDE = 100;
const CHOOSE_CIRCLE_DEFAULT_DIAMETER = 30;
const CHOOSE_CIRCLE_MAX_DIAMETER = 46;
const CHOOSE_CIRCLE_HOVER_DIAMETER = CHOOSE_CIRCLE_MAX_DIAMETER + 20;
const CHOOSE_CIRCLE_CONTAINER_SIDE = 50;
const CHOOSE_CIRCLE_APPROACH_DIAMETER_DIFF = CHOOSE_CIRCLE_MAX_DIAMETER - CHOOSE_CIRCLE_DEFAULT_DIAMETER;
const TICK_COUNT = 12;
// const TICK_WIDTH = 10;
// const TICK_HEIGHT = 2;
const TICK_INACTIVE_DISTANCE = 70;
const TICK_INACTIVE_BG_HEX = '#ddd';
const TICK_ACTIVE_DISTANCE = 134;

circleColorsJsonURL = window.location.href + 'circle_colors';
circleColorsLocalJsonUrl = './circle_colors.json';
let socket = io.connect();
//rgb color regex
let rgbRegex = /rgb\([0-9,]*\)/g; //g for global match (find all matches rather than stopping after the first match)
let rgbRegexSingle = /rgb\([0-9,]*\)/;

// let $redLocator = $('#redLocator');

let $chooseCircleWrapper = $('#chooseCircleWrapper');
const $regChooseCircleColor = $('#regChooseCircleColor');
let circleChoiceContainers;
// console.log(circleChoiceContainers);
let $selectedCircle;
// circleChoiceContainers = $regChooseCircleColor.children();
let $regYourCircleHover = $('#regYourCircleHover');
let $regYourCircle = $('#regYourCircle');
let $regYourNameField = $('#regYourNameField');
let $regYourNameFieldUnderline = $('#regYourNameFieldUnderline');

let selectedDegree = 180; //gradient direction

let yourName = 'not_initialized';
let yourCircleSelectedStyle = $regYourCircle.css('background');
let yourCircleRGBString = getRGBStringFromBackgroundStyle(yourCircleSelectedStyle);
let arrowColor = yourCircleRGBString.match(rgbRegexSingle)[0]; // changes when new color is selected
let hoveredDegree = 0;
let hoveredStyle;

// last mouse coords from mousemove on body event
let mouseX;
let mouseY;

let circlesInRow;
let circlesInCol;
let lastAffectedCircleContainersArray = [];

let ticks;
let $currentTick;
let currentTickDistanceToMouse;
let $arrow;
let $greyArrow;

let colorChoiceSfx = new Audio('./sfx/color_choice.mp3');
let colorDirectionSfx = new Audio('./sfx/color_direction.mp3');

// used to edit hover of name field
let additionalStyle = document.createElement('style');
additionalStyle.type = 'text/css';
document.getElementsByTagName('head')[0].appendChild(additionalStyle);

// fetch colors
// $.getJSON(circleColorsJsonURL, function (dataArray) {
$.getJSON(circleColorsJsonURL, function (dataArray) {
	// console.log(dataArray);
	// console.log(result[0]);
	let circleColorsHtml = '';
	// for (let j = 0; j < 3; j++) {
	for (let i = 0; i < dataArray.length; i++) {
		let colorData = dataArray[i];
		let colorName = colorData.name;
		let colorsArray = colorData.colors;
		// circleColorsHtml += `
		// <div class="circle_choice_container">
		// <div class="circle_choice" style="background: linear-gradient(${selectedDegree},`;
		circleColorsHtml += `
		<div class="circle_choice_container">
		<div class="circle_choice" style="background: linear-gradient(180deg,`;
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
	// }
	$regChooseCircleColor.append(circleColorsHtml);

	circleChoiceContainers = $regChooseCircleColor.children();
	updateCircleWrapperValues();
	// $($(circleChoiceContainers[3]).children()[0]).append('<div class="checkmark draw"></div>');
	for (let i = 0; i < circleChoiceContainers.length; i++) {
		let container = circleChoiceContainers[i];
		let $circle = $($(container).children()[0]);
		$circle.click(function () {
			colorChoiceSfx.pause();
			colorChoiceSfx.currentTime = 0;
			colorChoiceSfx.play();
			$circle.css({
				'min-width': CHOOSE_CIRCLE_MAX_DIAMETER,
				'min-height': CHOOSE_CIRCLE_MAX_DIAMETER
			});
			// console.log($('body').css('width'));
			// console.log($circle.offset().left + " : " + $circle.offset().top);
			if ($selectedCircle != null && !($circle.get(0) === $selectedCircle.get(0))) {
				$selectedCircle.empty(); // remove check mark
				// console.log('tryna animate');
				// remove transition to not interfere with jquery animation
				$selectedCircle.css('transition', '0s');
				$selectedCircle.animate({
					'min-width': CHOOSE_CIRCLE_DEFAULT_DIAMETER,
					'min-height': CHOOSE_CIRCLE_DEFAULT_DIAMETER
				}, {
					duration: 200,
					complete: function () {
						$(this).css('transition', '0.1s');
					},
					step: function (now, fx) {
						// let $container = $(container);
						let offset = $(this).offset();
						let width = $(this).width();
						let height = $(this).height();

						let selectedCircleCenterX = offset.left + width / 2;
						let selectedCircleCenterY = offset.top + height / 2;


						let mouseDistanceToObjectCenter = Math.round(euclideanDistance(selectedCircleCenterX, selectedCircleCenterY, mouseX, mouseY));

						let isMouseInRange = mouseDistanceToObjectCenter < CHOOSE_CIRCLE_MOUSE_APPROACH_RANGE;

						if (isMouseInRange) {
							let howCloseToCenterModifier = 1 - (mouseDistanceToObjectCenter) / (CHOOSE_CIRCLE_MOUSE_APPROACH_RANGE);

							let howCloseToEdgeModifier = 1 - (mouseDistanceToObjectCenter - CHOOSE_CIRCLE_MAX_DIAMETER / 2) / (CHOOSE_CIRCLE_MOUSE_APPROACH_RANGE - CHOOSE_CIRCLE_MAX_DIAMETER / 2);

							let circleSupposedDiameter = Math.round((CHOOSE_CIRCLE_DEFAULT_DIAMETER + CHOOSE_CIRCLE_APPROACH_DIAMETER_DIFF * howCloseToEdgeModifier) * 10) / 10;
							let minWidth = parseInt($(this).css('min-width'));
							// console.log(circleSupposedDiameter , minWidth);
							// console.log(minWidth);
							if (circleSupposedDiameter >= minWidth) {
								// console.log('stop');
								$(this).stop();
								$(this).css('transition', '0.1s');
								// $(this).css({
								// 	'min-width': circleSupposedDiameter,
								// 	'min-height': circleSupposedDiameter
								// });
								// $(this).css('min-width', circleSupposedDiameter);
								// $(this).css('min-height', circleSupposedDiameter);
							}
						}
					}
				});
			}
			// checkmark credits: https://codepen.io/scottloway/pen/zqoLyQ
			$circle.append('<div class="checkmark draw"></div>');
			let $checkmark = $('.checkmark');
			$checkmark.css('transform', 'translate(15px, 24px)');
			$checkmark.toggle();

			yourCircleRGBString = getRGBStringFromBackgroundStyle($circle.css('background'));

			// console.log(yourCircleRGBString);
			yourCircleSelectedStyle = constructBackgroundStyle(yourCircleRGBString, selectedDegree);
			arrowColor = yourCircleRGBString.match(rgbRegexSingle)[0];
			if (!($arrow == null)) {
				// $arrow = $('#arrow');
				// console.log($arrow.get(0));
				$arrow.css({
					'border-bottom-color': arrowColor
				});
			}
			// console.log(`border-image: linear-gradient(90deg, ${yourCircleRGBString});`);

			// $regYourNameField.focus(function () {
			// 	$regYourNameFieldUnderline.css({
			// 		'background': `linear-gradient(90deg, ${yourCircleRGBString})`,
			// 		'height': '3px'
			// 	});
			// });
			$regYourCircle.css('background', yourCircleSelectedStyle);
			$selectedCircle = $circle;
		});
		$circle.mouseleave(function () {
			$regYourCircle.css('background', yourCircleSelectedStyle);
		})
	}
});

placeTicks();
// place ticks (ticks are selectedDegree values)
function placeTicks() {
	let tickHtml = '<div class="tick"></div>';
	let ticksHtml = tickHtml.repeat(TICK_COUNT);
	// not putting ticks under your circle directly because of jiggling when clicked
	$regYourCircleHover.append(ticksHtml);
	ticks = $regYourCircleHover.children();
	ticks = ticks.slice(1, ticks.length);
	let tickDeltaDegree = 360 / ticks.length;
	let degreeOffset = -90;
	for (let i = 0; i < ticks.length; i++) {
		let $tick = $(ticks[i]);
		$tick.css('transform', `translate(-50%, -50%)
		rotate(${i * tickDeltaDegree + degreeOffset}deg)
		translate(${TICK_INACTIVE_DISTANCE}px)
		`);
		// $tick.css('transform', `translate(-50%, -50%)
		// translate(${TICK_INACTIVE_DISTANCE}px)
		// `);
	}
	$(ticks[0]).append(`<div id="arrow"></div>`); // create an arrow on first tick
	$arrow = $('#arrow');
	$arrow.css({
		'border-bottom-color': arrowColor,
		'transform': `rotate(90deg) translate(-13px, 8px)`
	});
	$currentTick = $(ticks[0]);
	// $arrow = $('#arrow');
	$regYourCircleHover.mouseenter(function () {
		// console.log("hovering");
		for (let i = 0; i < ticks.length; i++) {
			let $tick = $(ticks[i]);
			// $tick.css('background-color', `#ddd`);
			$tick.css('transform', `translate(-50%, -50%)
			rotate(${i * tickDeltaDegree + degreeOffset}deg)
			translate(${TICK_ACTIVE_DISTANCE}px)
			`);
			// $tick.empty();

		}
	});
	$regYourCircleHover.mouseleave(function () {
		// console.log("unhovering");
		for (let i = 0; i < ticks.length; i++) {
			let $tick = $(ticks[i]);
			$tick.css('transform', `translate(-50%, -50%)
			rotate(${i * tickDeltaDegree + degreeOffset}deg)
			translate(${TICK_INACTIVE_DISTANCE}px)
			`);
		}
		$regYourCircle.css('background', yourCircleSelectedStyle);
	});

	$regYourCircleHover.mousemove(function (mouseEvent) {
		// console.log('mousemove');
		// calc can be done once
		let circleCenterCoords = getElementCenterCoords($regYourCircleHover);
		let circleCenterX = Math.floor(circleCenterCoords[0]);
		let circleCenterY = Math.floor(circleCenterCoords[1]);
		let centerToMouseVector = [mouseEvent.pageX - circleCenterX, mouseEvent.pageY - circleCenterY];
		// console.log(centerToMouseVector);
		let vectorMagnitude = Math.sqrt(Math.pow(centerToMouseVector[0], 2) + Math.pow(centerToMouseVector[1], 2));
		// console.log(vectorMagnitude);
		let normalizedVector = [centerToMouseVector[0] / vectorMagnitude, centerToMouseVector[1] / vectorMagnitude];
		// console.log(normalizedVector);
		let mouseCoordsOnTickCircle = [circleCenterX + normalizedVector[0] * TICK_ACTIVE_DISTANCE, circleCenterY + normalizedVector[1] * TICK_ACTIVE_DISTANCE];

		// console.log(mouseCoordsOnTickCircle);

		// console.log(circleCenterX, circleCenterY, mouseCoordsOnTickCircle[0], mouseCoordsOnTickCircle[1]);
		// console.log(mouseEvent.pageX, mouseEvent.pageY);
		// console.log(cicleCenterX, cicleCenterY);
		let $closestTickToMouse;
		let smallestTickDistanceToMouse;
		let degree = 0;
		for (let i = 0; i < ticks.length; i++) {

			$tick = $(ticks[i]);
			// $tick.empty();
			tickCenterCoords = getElementCenterCoords($tick);
			tickCenterX = tickCenterCoords[0];
			tickCenterY = tickCenterCoords[1];
			tickDistanceToMouse = euclideanDistance(tickCenterX, tickCenterY, mouseCoordsOnTickCircle[0], mouseCoordsOnTickCircle[1]);
			// if ($tick.get(0) == $currentTick.get(0)) {
			// 	console.log('sup');

			// 	// currentTickDistanceToMouse = tickDistanceToMouse;
			// }
			if (smallestTickDistanceToMouse == null) {
				smallestTickDistanceToMouse = tickDistanceToMouse;
			}
			if ($closestTickToMouse == null) {
				$closestTickToMouse = $tick;
			}
			if (tickDistanceToMouse < smallestTickDistanceToMouse) {
				smallestTickDistanceToMouse = tickDistanceToMouse;
				$closestTickToMouse = $tick;
				degree = i * tickDeltaDegree;
			}
			$tick.css('background', TICK_INACTIVE_BG_HEX);
			// break;
		}
		// redirect gradient here
		// $closestTickToMouse.css('background', arrowColor);
		// a freshly appended element cannot be animated
		// $arrow = $('#arrow');
		// $arrow.remove();
		// $currentTick = $closestTickToMouse;
		// $closestTickToMouse.append(`<div id="arrow"></div>`);
		// $arrow = $('#arrow');
		// $arrow.css({
		// 	'border-bottom-color': arrowColor,
		// 	// 'transform': `rotate(90deg) translate(-6px, 10px)`
		// 	// 'transform': `rotate(90deg) translate(-4px, 0)`
		// 	'transform': `rotate(90deg) translate(-13px, 14px)`
		// });
		$greyArrow = $('#greyArrow');
		$greyArrow.remove();
		if ($currentTick.get(0) != $closestTickToMouse.get(0)) {
			colorDirectionSfx.pause();
			colorDirectionSfx.volume = 0.2;
			colorDirectionSfx.currentTime = 0;
			colorDirectionSfx.play();
		}
		$currentTick = $closestTickToMouse;
		if (!($closestTickToMouse.children().length)) {
			$closestTickToMouse.append(`<div id="greyArrow"></div>`);
			$greyArrow = $('#greyArrow');
			$greyArrow.css({
				// 'transform': `rotate(90deg) translate(-6px, 10px)`
				// 'transform': `rotate(90deg) translate(-4px, 0)`
				'transform': `rotate(90deg) translate(-7px, 4px)`
			});
		}

		hoveredDegree = degree + degreeOffset -90;
		hoveredStyle = constructBackgroundStyle(yourCircleRGBString, hoveredDegree); // will be needed when desired direction is selected
		// $regYourCircle.css('background', hoveredStyle);
		// $regYourCircle.css('transform', `rotate(${hoveredDegree}deg)`);
		// }

		// if (currentTickDistanceToMouse >= 10 && currentTickDistanceToMouse <= 50) {
		// 	// console.log('yo');
		// 	let arrowMinSize = 20;
		// 	let arrowMaxSize = 28;
		// 	let arrowSizeInterval = arrowMaxSize - arrowMinSize;
		// 	// 50 - 10 = 40 (is distance interval)
		// 	let arrowSize = arrowMinSize + arrowSizeInterval - ((currentTickDistanceToMouse - 10) * arrowSizeInterval / 40);
		// 	$arrow.css({
		// 		'border-width': `0 ${arrowSize/2}px ${arrowSize}px ${arrowSize/2}px`,
		// 		'transform': `rotate(90deg) translate(-${arrowSize/2}px, ${arrowSize/2}px)`
		// 	});
		// }

	});

	$regYourCircleHover.click(function () {
		colorDirectionSfx.pause();
		colorDirectionSfx.volume = 1;
		colorDirectionSfx.currentTime = 0;
		colorDirectionSfx.play();
		if (!($arrow == null)) {
			$arrow.remove();
		}
		$currentTick.empty();
		$currentTick.append(`<div id="arrow"></div>`);
		$arrow = $('#arrow');
		$arrow.css({
			'border-bottom-color': arrowColor,
			'transform': `rotate(90deg) translate(-13px, 8px)`
		});

		// $arrow.css({
		// 	// 'transform': `rotate(90deg) translate(-4px, 0)`
		// 	'transition': '1s',
		// 	'transition-property': 'transform'});

		// $arrow.css('transform', `rotate(90deg) translate(-13px, 2px)`);

		yourCircleSelectedStyle = hoveredStyle;
		selectedDegree = hoveredDegree;
		$regYourCircle.css('background', yourCircleSelectedStyle);
	});
}



// $chooseCircleWrapper.get(0).addEventListener('mousemove', function (mouseEvent) {
document.body.addEventListener('mousemove', function (mouseEvent) {
	mouseX = mouseEvent.pageX;
	mouseY = mouseEvent.pageY;
	updateChoiceCirclesVisuals(mouseX, mouseY);
}, false);

document.body.addEventListener('click', function (mouseEvent) {
	// console.log(mouseX, mouseY);
});

$(window).resize(function () {
	updateCircleWrapperValues();
});

$regYourNameField.on('keypress', function (key) {
	if (key.which == 13) {
		goToChat();
		return false;
	}
});

$regYourNameField.focus(updateNameFieldUnderlineColors);

$regYourNameField.focusout(function () {
	$regYourNameFieldUnderline.css({
		'background': '#ccc',
		'height': '2px'
	});
});

function updateNameFieldUnderlineColors() {
	$regYourNameFieldUnderline.css({
		'background': `linear-gradient(90deg, ${yourCircleRGBString})`,
		'height': '4px'
	});
}

function updateChoiceCirclesVisuals(mouseX, mouseY) {
	if (circleChoiceContainers == null) return;

	// NEW OPTIMIZED WAY, LOOKING THROUGH CIRCLES THAT ARE IN APPROACH RANGE
	let wrapperBoxLeft = $regChooseCircleColor.offset().left;
	let wrapperBoxRight = wrapperBoxLeft + $regChooseCircleColor.width();
	let wrapperBoxTop = $regChooseCircleColor.offset().top;
	let wrapperBoxBottom = wrapperBoxTop + $regChooseCircleColor.height();

	let mouseBoxLeft = mouseX - CHOOSE_CIRCLE_MOUSE_APPROACH_RANGE;
	let mouseBoxRight = mouseX + CHOOSE_CIRCLE_MOUSE_APPROACH_RANGE;
	let mouseBoxTop = mouseY - CHOOSE_CIRCLE_MOUSE_APPROACH_RANGE;
	let mouseBoxBottom = mouseY + CHOOSE_CIRCLE_MOUSE_APPROACH_RANGE;

	// check if mouseBox collides with wrapper, perform calculations if is
	if (!(mouseBoxLeft <= wrapperBoxRight && mouseBoxTop <= wrapperBoxBottom &&
		mouseBoxRight >= wrapperBoxLeft && mouseBoxBottom >= wrapperBoxTop)) {
		return;
	}

	updateAffectedChoiceCircleVisuals(lastAffectedCircleContainersArray);

	// check which row elements are in mouse range
	let firstAffectedColumnIndex = Math.min(Math.max(Math.floor((mouseBoxLeft - wrapperBoxLeft) / CHOOSE_CIRCLE_CONTAINER_SIDE), 0), circlesInRow);
	let lastAffectedColumnIndex = Math.max(Math.min(Math.floor((mouseBoxRight - wrapperBoxLeft) / CHOOSE_CIRCLE_CONTAINER_SIDE) + 1, circlesInRow), 0);
	// check which column elements are in mouse range
	let firstAffectedRowIndex = Math.min(Math.max(Math.floor((mouseBoxTop - wrapperBoxTop) / CHOOSE_CIRCLE_CONTAINER_SIDE), 0), circlesInCol);
	let lastAffectedRowIndex = Math.max(Math.min(Math.floor((mouseBoxBottom - wrapperBoxTop) / CHOOSE_CIRCLE_CONTAINER_SIDE) + 1, circlesInCol), 0);

	let affectedCircleContainersArray = [];

	for (let row = firstAffectedRowIndex; row < lastAffectedRowIndex + 1; row++) {
		for (let col = firstAffectedColumnIndex; col < lastAffectedColumnIndex + 1; col++) {
			let circleIndex = row * circlesInRow + col;
			if (circleIndex > circleChoiceContainers.length - 1) {
				continue;
			}
			affectedCircleContainersArray.push(circleChoiceContainers[row * circlesInRow + col]);
		}
	}
	updateAffectedChoiceCircleVisuals(affectedCircleContainersArray);
	lastAffectedCircleContainersArray = affectedCircleContainersArray;
}

function updateAffectedChoiceCircleVisuals(affectedCircleContainersArray) {
	for (let i = 0; i < affectedCircleContainersArray.length; i++) {
		let container = affectedCircleContainersArray[i];
		let $container = $(container);
		let $circle = $($(container).children()[0]);

		let containerCenter = getElementCenterCoords($container);
		let containerCenterX = containerCenter[0];
		let containerCenterY = containerCenter[1];

		let mouseDistanceToObjectCenter = Math.round(euclideanDistance(containerCenterX, containerCenterY, mouseX, mouseY));
		let isMouseInRange = mouseDistanceToObjectCenter < CHOOSE_CIRCLE_MOUSE_APPROACH_RANGE;
		// make selected circle bigger than others
		if ($selectedCircle != null && $circle.get(0) === $selectedCircle.get(0)) {
			// do nothing
		} else if ($circle.is(":hover")) {
			// console.log('a circle is hovered');
			// $circle.css('transition-property', 'min-width, min-height, box-shadow');
			$circle.css({
				'min-width': CHOOSE_CIRCLE_HOVER_DIAMETER,
				'min-height': CHOOSE_CIRCLE_HOVER_DIAMETER

				// 'min-width': CHOOSE_CIRCLE_MAX_DIAMETER,
				// 'min-height': CHOOSE_CIRCLE_MAX_DIAMETER
			});
			let hoveredCircleRGBString = getRGBStringFromBackgroundStyle($circle.css('background'));
			if (yourCircleRGBString != hoveredCircleRGBString) {
				let hoveredCircleStyle = constructBackgroundStyle(hoveredCircleRGBString, selectedDegree);
				$regYourCircle.css('background', hoveredCircleStyle);
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
}

function goToChat() {
	yourName = $regYourNameField.val();
	if (!yourName.trim().length) { //if empty
		yourName = 'Noname';
		// console.log('noname set');
	}
	const url = window.location.href + 'chat';
	// const reqData = {
	// 	'name': name,
	// 	'style': yourCircleSelectedStyle
	// }

	$.get(url, function (resData, status) {
		// console.log(`${resData} and status is ${status}`);
		// $('body').html(resData);
		document.open();
		document.write(resData);
		document.close();
	});

	// console.log(`sending post request with data: ${reqData.name}`);
	// $.post(url, reqData, function (resData, status) {
	// 	console.log(`${resData} and status is ${status}`);
	// 	// $('body').html(resData);
	// 	document.open();
	// 	document.write(resData);
	// 	document.close();
	// });

	// $.ajax({
	// 	url : url,
	// 	type: 'POST',
	// 	data: reqData,
	// 	success: function (resData) {
	// 		console.log(`${resData} and status is ${status}`);
	// 	},
	// 	error: function (error) {
	// 		console.log(`error ${error}`);
	// 	}
	// });


	// go to chat page

}

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

function getElementCenterCoords($elem) {
	let offset = $elem.offset();
	let width = $elem.width();
	let height = $elem.height();

	let elemCenterX = offset.left + width / 2;
	let elemCenterY = offset.top + height / 2;
	return [elemCenterX, elemCenterY];
}

function updateCircleWrapperValues() {
	let circleWrapperWidth = $regChooseCircleColor.width();
	circlesInRow = Math.floor(circleWrapperWidth / CHOOSE_CIRCLE_CONTAINER_SIDE);
	circlesInCol = Math.floor(circleChoiceContainers.length / circlesInRow);
}

function getRGBStringFromBackgroundStyle(backgroundStyle) {
	backgroundStyle = backgroundStyle.replace(/ /g, '');
	let matches = backgroundStyle.match(rgbRegex);
	let RGBString = '';
	for (let i = 0; i < matches.length; i++) {
		RGBString += matches[i];
		if (i != matches.length - 1) {
			RGBString += ',';
		}
	}
	return RGBString;
}

function constructBackgroundStyle(RGBString, degree) {
	return `linear-gradient(${degree}deg,${RGBString})`;
}

// to move red locator
// 	$redLocator.css({
// 		left:  mouseEvent.pageX,
// 		top:   mouseEvent.pageY
//  });