// Further Explorations in Cartography (Cartographics 2)
// 2022 Mandy Brigwell
// Fonts from Google Fonts, released under open source licenses and usable in any non-commercial or commercial project.

// Variables
var randomSeedValue = ~~(fxrand()*123456);
var noiseSeedValue = ~~(fxrand()*456789);
var screenSize;

// These values strike a compromise between speed and detail
// Altering them will affect border render
var mapSize = 1440;
var mapResolution = mapSize/8;
var mapGridSize = mapSize/mapResolution;

// Labels
var showLabels = false
if (fxrand() < 0.2) {
	showLabels = true;
}

// Name
var showName = false
if (fxrand() < 0.2) {
	showName = true;
}

// Apply slight rotation to the border and label
var mapRotation = (-1+(fxrand()*2))/48;

// Define graphics buffers
var namedBorderMap, borderMap, landmarksMap, mapRender, shadowMap, outputMap;

// Number of landmarks from 4 to 8
var landmarks = 4+~~(fxrand()*5);

// A sea level from 0 to 1.25 works best with high and low islandLevels
var seaLevel = (fxrand()*1.25);

// Island level of 0 produces little sea; 2 produces small islands
var islandLevel = (fxrand()*2).toFixed(2);

// Sort out the level of detail for the fxhash features
var detailLevels, detailLevelsDescription;
if (fxrand() < 0.5) {
	detailLevels = 6;
	detailLevelsDescription = "Normal";
} else if (fxrand() < 0.5) {
	detailLevels = 5;
	detailLevelsDescription = "Low";
} else {
	detailLevels = 7;
	detailLevelsDescription = "High";
}

// Scenarios
// Datastructure contains name, eight landmarks, eight sea landmarks
var dataStructure = [];
defineData();
var selectedData = dataStructure[~~(fxrand()*dataStructure.length)];
var mapTitle = selectedData[0];
var landmarkNames = selectedData.slice(1, 10);
var underwaterLandmarkNames = selectedData.slice(10, 18);

// Colours
// Color is 2 sea colours, 3 land colours
var colorStructure = [];
defineColors();
var selectedColorStructure = colorStructure[~~(fxrand()*colorStructure.length)];
var colorMapName = selectedColorStructure[0];
var colorMapValues = selectedColorStructure.slice(1, 6);

// Wait messages
var waitMessages = [];
defineWaitMessages();

// Prepare fonts for preloading
var titleFont, labelFont;

window.$fxhashFeatures = {
	"Color Scheme": colorMapName,
	"Landmarks": landmarks,
	"Sea Level": (seaLevel*10)|0,
	"Islandosity": (islandLevel*10)|0,
	"Detail Level": detailLevelsDescription
}

function preload() {
	titleFont = loadFont("PermanentMarkerFont.ttf");
	labelFont = loadFont("PatrickHandSC-Regular.ttf");
}

function setup() {
	pixelDensity(1);
	noiseSeed(noiseSeedValue);
	randomSeed(randomSeedValue);
	screenSize = min(windowWidth, windowHeight);
	createCanvas(screenSize, screenSize);
	colorMode(HSB, 360);
	// Create graphics buffers
	
	// Two varieties of border
	borderMap = createGraphics(mapSize, mapSize);
	borderMap.textFont(titleFont);
	namedBorderMap = createGraphics(mapSize, mapSize);
	namedBorderMap.textFont(titleFont);
	
	// Landmarks overlay
	landmarksMap = createGraphics(mapSize, mapSize);
	landmarksMap.textFont(labelFont);
	landmarksMap.shadowOffsetY = 2;
	landmarksMap.drawingContext.shadowOffsetX = 2;
	landmarksMap.drawingContext.shadowBlur = 4;
	landmarksMap.drawingContext.shadowColor = "#333333";
	
	// Main map and output
	mapRender = createGraphics(mapSize, mapSize);
	outputMap = createGraphics(mapSize, mapSize);
	
	// Shadowed version to render border
	shadowMap = createGraphics(mapSize, mapSize);
	shadowMap.shadowOffsetY = 8;
	shadowMap.drawingContext.shadowOffsetX = 8;
	shadowMap.drawingContext.shadowBlur = 32;
	shadowMap.drawingContext.shadowColor = "#000000";
}

function draw() {
	
	// As rendering progresses, blank screen and put up image to let the user know rendering is taking place
	if (frameCount <= 4) {
		background(0);
		fill(360);
		translate(screenSize/2, screenSize/2);
		textSize(32);
		textAlign(CENTER, CENTER);
		text("Please Wait", 0, 0);
		textSize(18);
		text(waitMessages[~~(fxrand()*waitMessages.length)], 0, 32);
		text("'L' to toggle landmarks, 'N' to toggle name; In full-screen mode: 'S' to save the map.", 0, (screenSize/2)-64);
		translate(-screenSize/2, -screenSize/2);
	}
	
	switch(frameCount) {
		case 1:
			drawNamedBorder();
		break;
		case 2:
			drawBorder();
		break;
		case 3:
			drawLandmarks();
		break;
		case 4:
			drawMap();
			drawGlyphs();
		break;
	}
	
	// On all other frames, composite the image and display
	if (frameCount > 4) {
		background(360);
		shadowMap.clear();
		image(mapRender, 0, 0, screenSize, screenSize);

		if (showLabels) {
			image(landmarksMap, 0, 0, screenSize, screenSize);
		}
		
		shadowMap.clear();
		if (showName) {
			shadowMap.image(namedBorderMap, 0, 0);
		} else {
			shadowMap.image(borderMap, 0, 0);
		}
		image(shadowMap, 0, 0, screenSize, screenSize);
		fxpreview();
	}
}

function drawMap() {
	for (var i=0.05; i<0.95; i+=1/mapResolution) {
		for (var j=0.05; j<0.95; j+=1/mapResolution) {
			var noiseValue = returnNoise(i, j);			
			if (noiseValue < 1.5) {
				noiseValue = 0;
			}
      		if (noiseValue > 3.5) {
      		noiseValue = 4;
      		}
      //noiseValue = int(map(i, 0.05, 0.95, 0, 5));
      mapRender.noStroke();
      mapRender.fill(colorMapValues[~~(noiseValue)]);
      mapRender.rect(w(i), h(j), mapGridSize, mapGridSize);
      
      // Land texture
      if (noiseValue > 2) {
        for (var k=w(i); k<w(i)+mapGridSize; k+=4) {
          for (var l=h(j); l<h(j)+mapGridSize; l+=4) {
            var lPos = l;
            if (~~k%3 == 0) {
              lPos += random(2);
            }
				mapRender.strokeWeight(1);
				mapRender.stroke(0, 0, 0, 120);
				mapRender.point(k, lPos);
				mapRender.stroke(0, 0, 180, 120);
				mapRender.point(k-2, lPos+random(-1, 1));
          }
        }
      }

      // Forests
      if (noiseValue > 2 && noiseValue - floor(noiseValue) < 0.25) {
        mapRender.noStroke();
        mapRender.fill(0, 10, 10, 64+random(-16, 16));
        var variedSize = mapGridSize*random(0.7, 1.1);
        mapRender.ellipse(w(i) + random(-1, 1)/2, h(j) + random(-1, 1)/2, variedSize, variedSize);
      }

      // Sea Texture
      if (noiseValue <= 2) {
        for (var l=0; l<mapGridSize; l+=2) {
          mapRender.strokeWeight(0.5);
          var offset=random(8);
          mapRender.stroke(0, 0, 360, 90);
          mapRender.line(w(i)-offset, h(j)+sin(l*8), w(i)+offset, h(j)+cos(l*4));
          mapRender.stroke(0, 0, 0, 30);
          mapRender.line(w(i)-offset, h(j)-sin(l*8), w(i)+offset, h(j)-cos(l*4));
        }
      }
      
    }
  }
}

// Glyphs are rare and subtle decorative elements on the main map
function drawGlyphs() {
	var glyphsList = [];
	glyphsList.push(["XX", "XX"]);
	glyphsList.push(["X X", " X", "X X"]);
	glyphsList.push(["XXX", "XXX", "XXX"]);
	glyphsList.push([" X ", "X X", " X"]);
	glyphsList.push(["  X", " X X", "X   X", " X X", "  X"]);
	glyphsList.push(["XXXXXX", "X    X", "X    X", "XXXXXX"]);
	if (fxrand() < 0.5) {
		glyphsList.push(["XX", "XX"]);
		glyphsList.push(["X X", " X", "X X"]);
		glyphsList.push(["  X", " X X", "X   X", " X X", "  X"]);
		glyphsList.push(["XXX", "X X", "X X", "X X", "X X", "X X", "XXX"]);
	}
	if (fxrand() < 0.25) {
		glyphsList.push(["XX", "XX"]);
		glyphsList.push(["X X", " X", "X X"]);
		glyphsList.push(["X  ", "X  ", "XXX"]);
		glyphsList.push([" X ", "X X", " X"]);
	}

	// Rare glyphs
	if (fxrand() < 0.25) { // Key
		glyphsList.push([" XXX", "X   X", "X   X", " XXX", "  X", "  X", "  XX", "  X", "  XX"]);
	}
	if (fxrand() < 0.25) { // Pin
		glyphsList.push([" XXX", "XXX X", "XXXXX", "XXXXX", " XXX", "  X", "  X", "  X", "  X", "  X"]);
	}
	if (fxrand() < 0.25) { // Arrow
		glyphsList.push(["X", "XX", "XXX", "XXXX", "XXXXX", "XXXXXX", "XXXXXXX", "XXX", "XX", "X"]);
	}
	if (fxrand() < 0.25) { // X
	glyphsList.push([" X    X",	"XXX  XXX", " XXXXXX", "  XXXX", "  XXXX", " XXXXXX", "XXX  XXX", " X    X "]);
	}

	// Rarer glyphs
	if (fxrand() < 0.05) { // GhostSpiderThing
		glyphsList.push(["  XXX  "," X X X "," XXXXX "," XXXXX "," X X X "]);
	}
	if (fxrand() < 0.05) { // Circle
		glyphsList.push(["  XXXX"," X    X","X    X X","X X    X","XX     X","X X X  X"," X X  X ","  XXXX  "]);
	}
	if (fxrand() < 0.05) { // Banner
		glyphsList.push(["  XX  XX", "XX  XX X", "X      X", "X      X", "X XX  XX", "XX  XX"]);
	}
	if (fxrand() < 0.05) { // Pentagram
		glyphsList.push(["     XXXXX", 		"   XX  X  XX", 		"  X    X    X", 		" X    X X    X", 		" X    X X    X", 		"XXXXXXXXXXXXXXX", 		"X XX X   X XX X", 		"X   XX   XX   X", 		"X   XX   XX   X", 		"X   X XXX X   X", 		" X  X X X X  X", 		" X XXX   XXX X", 		"  XX       XX", 		"   XX     XX", 		"     XXXXX"]);
	}
	mapRender.noStroke();
	for (var i=0; i<glyphsList.length; i++) {
		mapRender.push();
		mapRender.translate(mapGridSize*~~random(mapResolution*0.1, mapResolution*0.9), mapGridSize*~~random(mapResolution*0.1, mapResolution*0.9));
		var currentGlyph = glyphsList[i];
		for (var j=0; j<currentGlyph.length;j++) {
			var currentLine = currentGlyph[j];
			for (var k=0; k<currentLine.length; k++) {
				var glyphScale = random(0.975, 1.025);
				mapRender.fill(random(170, 190), random(30, 45));
				if (currentLine[k] == "X") {
					mapRender.ellipse(k*mapGridSize*glyphScale, j*mapGridSize*glyphScale, mapGridSize*glyphScale, mapGridSize*glyphScale);
				}
			} // k
		} // j
		mapRender.pop();
	} // i
}

function renderGlyph(glyphArray, xPos, yPos) {
	landmarksMap.resetMatrix();
	landmarksMap.translate(xPos, yPos);
	landmarksMap.noStroke();
	landmarksMap.fill(0, random(60, 90));
	for (var j=0; j<glyphArray.length;j++) {
		var currentLine = glyphArray[j];
		for (var k=0; k<currentLine.length; k++) {
			if (currentLine[k] == "X") {
				landmarksMap.rect(k*mapGridSize, j*mapGridSize, mapGridSize, mapGridSize);
			}
		} // k
	} // j
}

function drawLandmarks() {
	landmarksMap.textSize(mapGridSize*5);
	var missedLandmarks = [2, 2];
	while (missedLandmarks.length < landmarks) {
		missedLandmarks.push(1);
	}
	while (missedLandmarks.length < 10) {
		missedLandmarks.splice(~~(random(missedLandmarks.length)), 0, 0);
	}
	for (var i=0; i<10; i++) {
		var hPos = random(0.2, 0.65);
		var wPos = (missedLandmarks[i]*random(-0.025, 0.025)) + map(i, 0, missedLandmarks.length+1, 0.1, 0.9);
		if (missedLandmarks[i] != 0) {
			if (returnNoise(hPos, wPos) >= 1.5) {
				addLandmark(h(hPos), w(wPos));
			} else {
				addUnderwaterLandmark(h(hPos), w(wPos));
			}
		}
	}
}

function addLandmark(xPos, yPos) {
	landmarksMap.resetMatrix();
	landmarksMap.translate(xPos, yPos);
	landmarksMap.strokeWeight(mapGridSize*0.75);
	landmarksMap.fill(0, 60);
	landmarksMap.stroke(60, 300);
	switch(int(random(5))) {
		case 0:
			renderGlyph(["XXXX", "X  X", "X  X", "XXXX"], xPos, yPos);
		break;
		case 1:
			renderGlyph([" XX", "X  X", "X  X", " XX"], xPos, yPos);
		break;
		case 2:
			renderGlyph(["X X", " X", "X X"], xPos, yPos);
		break;
		case 3:
			renderGlyph(["XXXX", "X XX", "XX X", "XXX"], xPos, yPos);
		break;
		case 4:
			renderGlyph(["X X", " X X", "X X", " X X"], xPos, yPos);
		break;
		case 5:
			renderGlyph([" XX", "X  X", "X  X", "XXXX"], xPos, yPos);
		break;
  }
	// Choose name and add to map
	var chosenLandmarkNumber = ~~random(landmarkNames.length);
	landmarksMap.stroke(0, 300);
	landmarksMap.fill(360, 300);
	landmarksMap.rotate(random(-0.08, 0.08));
	landmarksMap.text(landmarkNames[chosenLandmarkNumber], mapGridSize*5, mapGridSize*3.5);
	landmarkNames.splice(chosenLandmarkNumber, 1);
}

function addUnderwaterLandmark(xPos, yPos) {
	landmarksMap.resetMatrix();
	landmarksMap.translate(xPos, yPos);
	landmarksMap.strokeWeight(mapGridSize*0.75);
	landmarksMap.fill(360, 120);
	landmarksMap.stroke(360, 180);
	switch(int(random(3))) {
		case 0:
			renderGlyph([" XX", "X  X", "X  X", " XX"], xPos, yPos);
		break;
		case 1:
			renderGlyph(["X X", " X", "X X"], xPos, yPos);
		break;
		case 2:
			renderGlyph(["XXX" ,"X X", "XXX"], xPos, yPos);
		break;
  }
	
	// Choose name and add to map
	var chosenLandmarkNumber = ~~random(underwaterLandmarkNames.length);
	landmarksMap.strokeWeight(mapGridSize*0.75);
	landmarksMap.stroke(0, 300);
	landmarksMap.fill(360, 300);
	landmarksMap.rotate(random(-0.08, 0.08));
	landmarksMap.text(underwaterLandmarkNames[chosenLandmarkNumber], mapGridSize*3, mapGridSize*1.5);
	underwaterLandmarkNames.splice(chosenLandmarkNumber, 1);
}

function drawNamedBorder() {
	// Colormode, rotate slightly
	namedBorderMap.colorMode(HSB, 360);
	namedBorderMap.translate(mapSize/2, mapSize/2);
	namedBorderMap.rotate(mapRotation);
	namedBorderMap.translate(-mapSize/2, -mapSize/2);
	
	// Inner border
	namedBorderMap.noFill();
	namedBorderMap.strokeWeight(w(0.12));
	namedBorderMap.stroke(60, 20, 360);
	namedBorderMap.rect(0, 0, mapSize, mapSize);
	// Increase size of lower edge
	namedBorderMap.rect(0, borderMap.height-112, borderMap.width, 16);

	// Thin black inner border
	namedBorderMap.strokeWeight(w(0.003));
	namedBorderMap.stroke(0);
	namedBorderMap.rect(w(0.06), h(0.06), w(0.88), h(0.80));
	
	// Outer border
	namedBorderMap.strokeWeight(w(0.07));
	namedBorderMap.stroke(0, 60);
	namedBorderMap.rect(0, 0, mapSize, mapSize);
	namedBorderMap.strokeWeight(w(0.05));
	namedBorderMap.stroke(0);
	namedBorderMap.rect(0, 0, mapSize, mapSize);
	
	// Writing
	namedBorderMap.strokeWeight(mapGridSize*0.75);
	namedBorderMap.noStroke();
	namedBorderMap.fill(0);
	namedBorderMap.textSize(48);
	namedBorderMap.textAlign(CENTER, CENTER);
	namedBorderMap.text(mapTitle, borderMap.width/2, borderMap.height-134)
}

function drawBorder() {
	// Colormode, rotate slightly
	borderMap.colorMode(HSB, 360);
	borderMap.translate(mapSize/2, mapSize/2);
	borderMap.rotate(mapRotation);
	borderMap.translate(-mapSize/2, -mapSize/2);
	
	// Inner border
	borderMap.noFill();
	borderMap.strokeWeight(w(0.12));
	borderMap.stroke(60, 20, 360);
	borderMap.rect(0, 0, mapSize, mapSize);
	borderMap.rect(0, borderMap.height, borderMap.width, 16);

	// Thin black inner border
	borderMap.strokeWeight(w(0.003));
	borderMap.stroke(0);
	borderMap.rect(w(0.06), h(0.06), w(0.88), h(0.88));
	
	// Outer border
	borderMap.strokeWeight(w(0.07));
	borderMap.stroke(0, 60);
	borderMap.rect(0, 0, mapSize, mapSize);
	borderMap.strokeWeight(w(0.05));
	borderMap.stroke(0);
	borderMap.rect(0, 0, mapSize, mapSize);
	}

function returnNoise(xPos, yPos) {
	var islandModifier = 1-(islandLevel*dist(xPos, yPos, 0.5, 0.5));
	return (islandModifier*detailLevels*noise(xPos*detailLevels, yPos*detailLevels)+seaLevel);
}

function w(value) {
  return (mapSize*value);
}

function h(value) {
  return (mapSize*value);
}

function windowResized() {
		if (navigator.userAgent.indexOf("HeadlessChrome") == -1) {
			screenSize = min(windowWidth, windowHeight);
			resizeCanvas(screenSize, screenSize);
		}
}

function keyPressed() {
	if (key == 's') {
		outputMap.clear();
		shadowMap.clear();
		outputMap.image(mapRender, 0, 0);
	
		// Place landmarks on screen dependent on user option toggled with 'l'
		if (showLabels) {
			outputMap.image(landmarksMap, 0, 0);
		}
		
		if (showName) {
			shadowMap.image(namedBorderMap, 0, 0);
		} else {
			shadowMap.image(borderMap, 0, 0);
		}
		outputMap.image(shadowMap, 0, 0);
		save(outputMap, "Map.png");
	}
	
	if (key == 'l') {
		showLabels = !showLabels;
	}
	
	if (key == 'n') {
		showName = !showName;
	}
}

function defineData() {

	// Generic commons
	dataStructure.push([synonym("EVENT"), "Emergency Bunker", "Safety Shelter", "Covert Surveillance Unit", "Military Installation", "Alien Spacecraft", "Smoking Crater", "Transmitter", "Science Facility",	"Ruins", "Dry seabed", "Ruins", "Lack of water", "Ruins", "Dry seabed", "Ruins", "Lack of water"]);
	dataStructure.push(["Doomed Mission to " + synonym("PLANET"),	"Hive", "Egg Silo", "Secondary Hive", "Dead Colonists",	"Communications Centre", "Launch Pad", "Shuttle", "Hadley's Hope",	"Rock", "Rock", "Rock", "Rock",	"Rock", "Rock", "Rock", "Rock",	]);
	dataStructure.push(["Lunar " + synonym("Cartography"), "Apollo 11", "Apollo 12", "Lunar Rover", "Insula Ventorum",	"Mons Agnes", "Mons Hansteen", "Dorsum Azara", "Vallis Alpes",	"Mare Imbrium", "Mare Serenitatis", "Mare Crisium", "Oceanus Procellarum",	"Mare Nectaris", "Mare Australe", "Mare Vaporum", "Mare Parvum"	]);
	dataStructure.push(["Our " + synonym("CAMPING") + " Camping Holiday", "Unexploded Ordnance", "Remains of Tent", "Abandoned Uranium Mine", "Pack of Mad Yaks", "Poison Ivy", synonym("Mysterious")+ " Monolith", "Lava Flow", "Museum of Spoons",	synonym("Unusually")+"-Foamy Lake", "Too-hot Springs", "Piranhas", "Killer Pikes",	"Sewage Outlet", "Broody Albatross", "Rocks", "Unusual Rocks"]);
	dataStructure.push([synonym("OZYMANDIAS"), "Lone, level sands", "Lone, level sands", "Lone, level sands", "Lone, level sands",	"Lone, level sands", "Lone, level sands", "Lone, level sands", "Colossal Wreck",	"Lone, level seabed", "Lone, level seabed", "Lone, level seabed", "Lone, level seabed",	"Lone, level seabed", "Lone, level seabed", "Lone, level seabed", "Lone, level seabed"]);
	dataStructure.push(["Ye Olde Mappe", "Generic Medieval Inn", "Castle Black", "Wizard's Hollow", "The Wise Woman", "Weasel's End", "Forest of Night", "The Narrow Pass", "Wight Marsh", "Boggart Landing", "Submerged Wreck", "Lake of Unease", "Siren's Roost", "The Undertow", "Fallow Marshland", "The Domain of the Beast"]);

	// Add specific island and non-island locations based on island level
	if (islandLevel > 1.25) { // Islands
		dataStructure.push(["Lost", "The Black Rock", "Ash-circled Cabin", "Orchid Station", "The Swan", "Mysterious Hatch", "Flame Station", "Pearl Station", "Tempest Station", "Pala Ferry", "Wharf", "The Looking Glass", "Hydra Station", "Lighthouse", "Submerged rocks with hieroglyphs", "Remains of statue", "Wreck of Flight 815"]);
		dataStructure.push([synonym("Mysterious Island"),	"???", "??", "?", "????",	"???", "??", "?", "????",	"???", "??", "?", "????",	"???", "??", "?", "????"]);
		dataStructure.push([synonym("Top") + " Secret Map",	"Secret Vault", "Institution 1", "Hidden Bunker", "Observation Tower",	"Secret Laboratory", "Covert Surveillance Device", "Gulag", "Control Centre",	"Underwater Lab", "Observation Vessel II", "Helicopter Landing Pad", "Sea Plane Dock",	"Drill Site", "Sea Lab", "Stingray", "Submarine Station"	]);
		dataStructure.push(["MS. Found in a Bottle",	"Temple to the Unknown God", "Bottomless Pit of Despair", "Lightning-Struck Tree", "Unusual Arrangement of Sticks", "Vortex of Negativity", "Swamp of Despair", "Unmarked Grave", synonym("Mysterious")+ " Statue",	"Whirlpool", "Rune-scrawled Rock", "Abandoned Boat", "Message In an Unknown Language",	"Dead Seagull", "Abyss", "Abandoned Boat", "Pentagram-shaped Starfish"]);
		dataStructure.push(["Little Albion",	synonym("LATownStart") + synonym("LATownEnd"), synonym("LATownStart") + synonym("LATownEnd"), synonym("LATownStart") + synonym("LATownEnd"), synonym("LATownStart") + synonym("LATownEnd"),	synonym("LATownStart") + synonym("LATownEnd"), synonym("LATownStart") + synonym("LATownEnd"), synonym("LATownStart") + synonym("LATownEnd"), synonym("LATownStart") + synonym("LATownEnd"),	"Albion Sea", "Albion Channel", "Albion Ocean", "Albion Wash",	"Greater Albion Sea", "Greater Albion Channel", "Greater Albion Ocean", "Greater Albion Wash"]);
		dataStructure.push(["Treasure Island", "The Admiral Benbow", "Bristol", "Abandoned Stockade", "Forest Retreat", "Buried Treasure", "X", "Bristol Channel", "The Hispaniola",	"The Walrus", "Northern Bay", "Deep Ocean", "Shallow Waters",	"Bar", "Shifting Sands", "Cove", "Schooner"]);
	} else if (islandLevel < 0.75) { // Non-island - These are low on sea landmarks, but probability is sea won't be used much
		dataStructure.push(["Sunnydale", "Sunnydale High", "The Bronze", "Cemetary", "Sunnydale University", "Downtown Sunnydale", "1630 Revello Drive", "Sunnydale Zoo", "Crawford Street", "Seaport", "Harbour", "Dock", "Hydroelectric Dam", "Sunnydale Beach", "Kingman's Bluff", "Pacific Ocean", "Deep Water" ]);
		dataStructure.push(["Jungle of " +synonym("JUNGLE"),	"Deadly Parrot Nest", "Lair of the Mad Tiger", "Grotesque Statue", "Menacing Pyramid",	"Scorpion Nest", "Aggressive Ants", "Vicious Boars", "Razor-sharp Grass Blades",	"Acidic Lagoon", "Alkaline Spring", "Infested Stream", "Lava Flow",	"Acidic Lagoon", "Alkaline Spring", "Infested Stream", "Lava Flow"]);
		dataStructure.push(["Quiet Knoll",	"Quiet Knoll Amusement Arcade", "Unusually-dirty Hospital", "Spooky School", "Bowling Alley",	"Bar Infested with Strange Mannequins", "Triangle-headed Guy", "Red Square", "Something Disgusting to Fish Around In",	"Quiet Knoll Lake", "Abandoned Boat", "Wonky Lighthouse", "Buoy",	"Quiet Knoll Lake", "Rock", "Rock", "Buoy"]);
		dataStructure.push(["The Lands of the Craft",	"Eldritch Stone", "Secret Monolith", "Crude Idol", "Hidden City",	"Site of Degenerate Ritual", "Peculiar Tower", "Endless Plain of Madness", "Reflected City",	"Caliginous Abyss", "City of the Deep Ones", "R'lyeh", "Statue to Dagon",	"The Lost City", "The House of Cthulhu", "Stranded Submarine", "Grotesque Statue"]);
		dataStructure.push(["The Silent " + synonym("Lands"),	"Iceberg", "Ice Temple", "Mine Shaft", "Fuel Depot",	"Snow Drift", "Main Camp", "Base Camp", "Fuel Depot",	"Submersible", "Explorer II", "Dock", "Underwater Ice Cave",	"Ice Floe", "Rock Formation", "Abandoned Ship", "Wreck"	]);
		dataStructure.push(["Vaguely Familiar Landscape",	"That place", "Near that thing", "You know... thingy", "Somewhere",	"Whatever", "Um?", "Whatchamacallit", "Over there",	"Somewhere wet", "Near that thing", "Watery bit", "Somewhere",	"Whatever", "Some sea or other", "Whatchamacallit", "Over there"	]);
		dataStructure.push(["Silicon Valley",	"Z80 Processor", "Transistor", "Capacitor", "Relay",	"Diode", "LED", "7-segment Display", "Main Bus",	"Master Control Program", "Expansion Port", "Docking Station", "Power Ouput",	"Main Input 1", "Secondary Power Source", "On-chip Battery", "Infinite Loop"	]);
	}
	
	// Rare features
	if (fxrand()<0.5) { 	// Relatively-rare options; half of the mints won't have these available
		dataStructure.push([synonym("FANTASY"), "Elfindel", "Gorfall", "Fimbar", "Teracotia",	"Faranesia", "Gondoria", "Mirrorfall", "Berathion",	"Mirkwater", "Landmere", "The Misty Lake", "Bywater",	"Bree Falls", "Erui", "Sirith", "Dank Water"	]);
		dataStructure.push(["Campbell Country", "Mercy Hill", "Lower Brichester", "Upper Brichester", "Goatswood",	"Temphill", "Severnford", "Clotton", "The Devil's Steps",	"The Cam", "The Island", "Severn Estuary", "The Severn",	"The Old Horns", "Pine Dunes", "Sunset Beach", "Gla'aki's Domain"]);
		dataStructure.push(["Middle Earth", "Weathertop", "Mount Doom", "Isengard", "Helm's Deep",	"Mirkwood", "Erebor", "Mirrorfall", "Berathion",	"Mirkwater", "Landmere", "The Misty Lake", "Bywater",	"Bree Falls", "Erui", "Sirith", "Dank Water"	]);
		dataStructure.push(["The Legend", "Camelot", "Wormelow Tump", "Richmond Castle", "Glastonbury Abbey", "Quimper", "Celliwig", "Pen Rhionydd", "Cadbury Castle", "Isle of Avalon", "Tintagel", "Merlin's Cave", "Camlet Moat", "Glein", "Dubglas", "Avon", "Aln"]);
		dataStructure.push(["Deus Ex Cartographia", "Battery Park", "Hell's Kitchen", "Area 51", "MJ12 Missile Silo",	"Vandenberg Air Base", "Smuggler's Lair", "Warehouse District", "Gas Station", "Ocean Floor", "Ocean Floor", "Ocean Floor", "Pasadena Ocean Lab",	"North Dock", "Canals", "MJ12 Submarine Base", "Liberty Island"	]);
	}
	
	if (fxrand()<0.25) { // Ridiculously rare
		dataStructure.push(["Filth", "Fiddler's Nubbin", "Twiddling End", "Bell End", "Sticky Nook", "Furtling", "Spacious Passage", "Dogger's Gorge", "Natural Windbreak", "Damp Bottom", "Lower Swell", "Upper Mounds", "Sandy Ripples", "Muddy Parts", "Foamy Spume", "Salt Spray", "Groynes"]);
	}

}

function defineColors() {
	colorStructure.push(["A Land of Blue and Gold", "#C4D3FF","#E2FFFF","#66999b","#b3af8f","#ffc482"]);
	colorStructure.push(["Awash In a Chemical Sea", "#EFFFB7","#90FFD1","#348aa7","#525174","#513b56"]);
	colorStructure.push(["Another Green World", "#A0EEC0", "#8AE9C1", "#86CD82", "#72A276", "#666B6A"]);
	colorStructure.push(["Beneath a Steel Sky", "#BEF1F1","#ffffff","#ffd5c2","#f28f3b","#c8553d"]);
	colorStructure.push(["In the Pink", "#FFE2FF","#FFCAFF","#a480cf","#779be7","#49b6ff"]);
	colorStructure.push(["Spicy Citrus", "#C7D5FF","#e7e7e7","#f9c784","#fc7a1e","#f24c00"]);
	colorStructure.push(["The Desert Coast; Salt and Sand", "#53B3CB", "#F9C22E", "#F15946", "#E01A4F", "#E29578"]);
	colorStructure.push(["The Fertile Lands", "#8DF1FF", "#6BFFB8", "#2CEAA3", "#28965A", "#2A6041"]);
	colorStructure.push(["All Around Us, Plains of Ice", "#E7E7E7", "#E5E5E5", "#999999", "#BBBBBB", "#EEEEEE"]);
	colorStructure.push(["The Trappings of Autumn", "#A0EEC0","#FFFFCE","#ffc53a","#e06d06","#b26700"]);
	colorStructure.push(["Beneath the Water's Icy Depths", "#E6E5E6", "#FFE7FF", "#02A9EA", "#4E4C67", "#54428E"]);
	colorStructure.push(["The Drowned World", "#EEEEFF", "#D2E7FA", "#28587B", "#48233C", "#32021F"]);
	colorStructure.push(["Crisp Leaves Crumple Underfoot", "#40A4DF", "#514B23", "#656839", "#CBC9AD", "#BDDBD0"]);
	colorStructure.push(["Two Weeks in Mordor", "#86E6FE", "#FFFFC7", "#F15946", "#E01A4F", "#E29578"]);
}

function defineWaitMessages() {
	waitMessages.push("Adjusting bell curves");
	waitMessages.push("Calibrating compasses");
	waitMessages.push("Calibrating theodolites");
	waitMessages.push("Clearing vegetation");
	waitMessages.push("Coalescing cloud formations");
	waitMessages.push("Sharpening coloured pencils");
	waitMessages.push("Decrementing tectonic plates");
	waitMessages.push("Exploring further");
	waitMessages.push("Extracting resources");
	waitMessages.push("Indexing indices");
	waitMessages.push("Mapping contours");
	waitMessages.push("Marking parchment");
	waitMessages.push("Pouring lava");
	waitMessages.push("Recording landmarks");
	waitMessages.push("Reticulating splines");
	waitMessages.push("Separating landmasses");
	waitMessages.push("Stratifying ground layers");
	waitMessages.push("Synthesising wavelets");
}

// A replacement function for synonyms to increase variety
function synonym(theWord) {
	switch(String(theWord)) {
		case "Unusually":
			return([theWord, "Strangely", "Remarkably"][~~(fxrand(3))]);
		break;
		case "Mysterious":
			return([theWord, "Eldritch", "Unusual", "Bizarre"][~~(fxrand()*4)]);
		break;
		case "Mysterious Island":
			return(["Mysterious Island", "Island of Mystery", "Mysterious Island of Mystery", "Mysterious Island of Mysterious Mystery"][~~(fxrand()*4)]);
		break;
		case "Lands":
			return(["Lands", "Realm", "World", "Expanse"][~~(fxrand()*4)]);
		break;
		case "Cartography":
			return(["Cartography", "Mission", "Exploration", "Landing"][~~(fxrand()*4)]);
		break;
		case "Top":
			return(["Top", "Extremely", "Rather", "Relatively", "Quite"][~~(fxrand()*5)]);
		break;
		case "LATownStart":
			return(["Middling", "Potter", "Scar", "Putting", "Dripping", "Wimbling", "Melling", "Brid", "Horncaster", "Telling"][~~(fxrand()*10)]);
		break;
		case "LATownEnd":
			return(["ford", "ton", "ham", "fordham", "ingborough", "ingtonham", "boro", "chester"][~~(fxrand()*8)]);
		break;
		case "CAMPING":
			return(["Worst Ever", "Best Ever", "Last", "First"][~~(fxrand()*4)]);
		break;
		case "PLANET":
			return(["LV-426", "Acheron"][~~(fxrand()*2)]);
		break;
		case "EVENT":
			return(["After the Event", "After the Incident", "The Remnants of Humanity", "Starting Again"][~~(fxrand()*4)]);
		break;
		case "JUNGLE":
			return(["Mystery", "Terror", "Death"][~~(fxrand()*3)]);
		break;
		case "OZYMANDIAS":
			return(["Look Upon My Works", "My Name is Ozymandias", "The Realm of Ozymandias", "My Works"][~~(fxrand()*4)]);
		break;
		case "FANTASY":
			return(["Explorations in the Fantastic Realm", "Land of Mystery", "Fantasy Realm", "Land of Fantasy", "A Fantastic Journey"][~~(fxrand()*5)]);
		break;
		default:
			return(theWord);
		break;
	}
}