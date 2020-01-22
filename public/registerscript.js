const CHOOSE_CIRCLE_MOUSE_APPROACH_RANGE = 70;
// const CHOOSE_CIRCLE_APPROACH_BOX_SIDE = 100;
const CHOOSE_CIRCLE_DEFAULT_DIAMETER = 30;
const CHOOSE_CIRCLE_MAX_DIAMETER = 40;
const CHOOSE_CIRCLE_CONTAINER_SIDE = 42;
const CHOOSE_CIRCLE_APPROACH_DIAMETER_DIFF = CHOOSE_CIRCLE_MAX_DIAMETER - CHOOSE_CIRCLE_DEFAULT_DIAMETER;
const TICK_COUNT = 12;
const TICK_INACTIVE_DISTANCE = 80;
const TICK_INACTIVE_BG_HEX = '#ddd';
const TICK_ACTIVE_DISTANCE = 108;

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

// used to edit hover of name field
let additionalStyle = document.createElement('style');
additionalStyle.type = 'text/css';
document.getElementsByTagName('head')[0].appendChild(additionalStyle);

// fetch colors
// $.getJSON(circleColorsJsonURL, function (dataArray) {
$.getJSON(circleColorsLocalJsonUrl, function (dataArray) {
	// console.log(dataArray);
	// console.log(result[0]);
	let circleColorsHtml = '';
	for (let j = 0; j < 3; j++) {
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
	}
	$regChooseCircleColor.append(circleColorsHtml);

	circleChoiceContainers = $regChooseCircleColor.children();
	updateCircleWrapperValues();
	for (let i = 0; i < circleChoiceContainers.length; i++) {
		let container = circleChoiceContainers[i];
		let $circle = $($(container).children()[0]);
		$circle.click(function () {
			// console.log($('body').css('width'));
			// console.log($circle.offset().left + " : " + $circle.offset().top);
			if ($selectedCircle != null && !($circle.get(0) === $selectedCircle.get(0))) {
				// console.log('tryna animate');
				$selectedCircle.animate({
					'min-width': CHOOSE_CIRCLE_DEFAULT_DIAMETER,
					'min-height': CHOOSE_CIRCLE_DEFAULT_DIAMETER
				}, {
					duration: 200,
					step: function (now, fx) {
						let selectedCircleCenter = getElementCenterCoords($(this));
						let selectedCircleCenterX = selectedCircleCenter[0];
						let selectedCircleCenterY = selectedCircleCenter[1];

						let mouseDistanceToObjectCenter = Math.round(euclideanDistance(selectedCircleCenterX, selectedCircleCenterY, mouseX, mouseY));

						let isMouseInRange = mouseDistanceToObjectCenter < CHOOSE_CIRCLE_MOUSE_APPROACH_RANGE;

						if (isMouseInRange) {
							let howCloseToCenterModifier = 1 - (mouseDistanceToObjectCenter) / (CHOOSE_CIRCLE_MOUSE_APPROACH_RANGE);

							let howCloseToEdgeModifier = 1 - (mouseDistanceToObjectCenter - CHOOSE_CIRCLE_MAX_DIAMETER / 2) / (CHOOSE_CIRCLE_MOUSE_APPROACH_RANGE - CHOOSE_CIRCLE_MAX_DIAMETER / 2);

							let circleSupposedDiameter = Math.round((CHOOSE_CIRCLE_DEFAULT_DIAMETER + CHOOSE_CIRCLE_APPROACH_DIAMETER_DIFF * howCloseToEdgeModifier) * 10) / 10;
							let minWidth = parseInt($(this).css('min-width'));
							// console.log(circleSupposedDiameter, minWidth);
							// console.log(minWidth);
							if (circleSupposedDiameter >= minWidth) {
								$(this).stop();
								// $(this).css('min-width', circleSupposedDiameter);
							}
						}
					}
				});
			}
			yourCircleRGBString = getRGBStringFromBackgroundStyle($circle.css('background'));

			// console.log(yourCircleRGBString);
			yourCircleSelectedStyle = constructBackgroundStyle(yourCircleRGBString, selectedDegree);
			arrowColor = yourCircleRGBString.match(rgbRegexSingle)[0];
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

$regYourNameField.focus(updateNameFieldUnderlineColors);

$regYourNameField.focusout(function () {
	$regYourNameFieldUnderline.css({
		'background': '#ccc',
		'height': '2px'
	});
})

placeTicks();

// place ticks (ticks are selectedDegree values)
function placeTicks() {
	let tickHtml = '<div class="tick"></div>';
	let ticksHtml = tickHtml.repeat(TICK_COUNT);
	$regYourCircle.append(ticksHtml);
	ticks = $regYourCircle.children();
	let tickDeltaDegree = 360 / ticks.length;
	for (let i = 0; i < ticks.length; i++) {
		let $tick = $(ticks[i]);
		$tick.css('transform', `rotate(${i * tickDeltaDegree}deg) translate(${TICK_INACTIVE_DISTANCE}px)`);
	}
	$regYourCircleHover.mouseenter(function () {
		// console.log("hovering");
		for (let i = 0; i < ticks.length; i++) {
			let $tick = $(ticks[i]);
			$tick.css('transform', `rotate(${i * tickDeltaDegree}deg) translate(${TICK_ACTIVE_DISTANCE}px)`);
		}
	});
	$regYourCircleHover.mouseleave(function () {
		// console.log("unhovering");
		for (let i = 0; i < ticks.length; i++) {
			let $tick = $(ticks[i]);
			$tick.css('transform', `rotate(${i * tickDeltaDegree}deg) translate(${TICK_INACTIVE_DISTANCE}px)`);
		}
		$regYourCircle.css('background', yourCircleSelectedStyle);
	});

	$regYourCircleHover.mousemove(function (mouseEvent) {
		let $closestTickToMouse;
		let smallestTickDistanceToMouse;
		let degree = 0;
		for (let i = 0; i < ticks.length; i++) {
			$tick = $(ticks[i]);
			$tick.empty();
			tickCenterCoords = getElementCenterCoords($tick);
			tickCenterX = tickCenterCoords[0];
			tickCenterY = tickCenterCoords[1];
			tickDistanceToMouse = euclideanDistance(tickCenterX, tickCenterY, mouseEvent.pageX, mouseEvent.pageY);
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
		$closestTickToMouse.css('background', arrowColor);
		$closestTickToMouse.append(`<div id="arrow"></div>`);
		arrowCenter = getElementCenterCoords($closestTickToMouse);
		let $arrow = $('#arrow');
		$arrow.css({
			'border-bottom-color': arrowColor,
			// 'transform': `rotate(90deg) translate(-6px, 10px)`
			'transform': `rotate(90deg) translate(-4px, 0)`
		});

		hoveredDegree = degree - 90;
		hoveredStyle = constructBackgroundStyle(yourCircleRGBString, hoveredDegree); // will be needed when desired direction is selected
		$regYourCircle.css('background', hoveredStyle);
	});

	$regYourCircleHover.click(function () {
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

function updateNameFieldUnderlineColors() {
	$regYourNameFieldUnderline.css({
		'background': `linear-gradient(90deg, ${yourCircleRGBString})`,
		'height': '3px'
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
			$circle.css({
				'min-width': CHOOSE_CIRCLE_MAX_DIAMETER,
				'min-height': CHOOSE_CIRCLE_MAX_DIAMETER
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