// CharSizeChangeFromFirst2LastInProportion.jsx
// http://forums.adobe.com/thread/1414597?tstart=0
// select a text frame or pathtext before running this script
// test this script at first with only a few characters!
// The more letters, the longer it takes
// If the screen seems to be frozen - please wait for a while
// regards pixxxelschubser  25/Febr./2014
var aDoc = app.activeDocument;
if (aDoc.selection.length > 0) {
  if (aDoc.selection.length < 2 && aDoc.selection[0].typename == "TextFrame") {
    var aTFrame = aDoc.selection[0];
    var theChars = aTFrame.characters;
    var charLength = theChars.length;
    var startSize = prompt("size of first character", 25, "start size");
    var endSize = prompt("size of last character", 5, "end size");
    var step = (startSize - endSize) / (charLength - 1);
    for (i = 0; i < charLength; i++) {
      theChars[i].size = (startSize - i * step).toFixed(2);
      redraw();
    }
  } else {
    alert("Please select only one text frame");
  }
} else {
  alert("No selection");
}
