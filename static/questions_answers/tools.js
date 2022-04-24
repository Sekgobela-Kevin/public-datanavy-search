"use strict";

function isSuperset(set, subset) {
  for (let elem of subset) {
    if (!set.has(elem)) {
      return false
    }
  }
  return true
}

function union(setA, setB) {
  let _union = new Set(setA)
  for (let elem of setB) {
    _union.add(elem)
  }
  return _union
}

function intersection(setA, setB) {
  let _intersection = new Set()
  for (let elem of setB) {
    if (setA.has(elem)) {
      _intersection.add(elem)
    }
  }
  return _intersection
}

function symmetricDifference(setA, setB) {
  let _difference = new Set(setA)
  for (let elem of setB) {
    if (_difference.has(elem)) {
      _difference.delete(elem)
    } else {
      _difference.add(elem)
    }
  }
  return _difference
}

function difference(setA, setB) {
  let _difference = new Set(setA)
  for (let elem of setB) {
    _difference.delete(elem)
  }
  return _difference
}


function showAlert(title, body) {
  var elem = $('<div class="top-stick"></div>');
  elem.dialog({
    position: "top",
    title: title,
    open: function() {
      $(this).html(body);
    },
  });
}

function showConfirm(title, body) {
  var elem = $('<div class="top-stick"></div>');
  elem.dialog.dialog({
    title: title,
    open: function() {
      $(this).html(body);
    },

    buttons: {
      Ok: function() {
        $(this).dialog("close");
        return true;
      },
      Cancel: function() {
        $(this).dialog("close");
        return false
      }
    }
  });
  elem.parent().css({
    position: "fixed"
  });
}


function makeVisible(query, xOfset = 0, yofset = 0, parent = 'html, body') {
  //from stackoverflow(but modified)
  var elem = $(query);
  console.assert(elem.length > 0, `${query} never matched any element`);
  var offset = elem.offset();
  $(parent).animate({
    scrollTop: offset.top + yofset,
    scrollLeft: offset.left + xOfset
  }, 300);
}

function scrollToView(element, parent) {
  //from stackoverflow
  //mobile devices do not scroll fully on first schroll to view
  const elem = $(element);
  elem.get(0).scrollIntoView({
    behavior: 'auto',
    block: 'center',
    inline: 'center'
  });

}


function removeClasses(query, classes, isJquery = false) {
  console.assert(query !== undefined, "query is undefined");
  console.assert(classes !== undefined, "classes is undefined");
  if (isJquery) {
    var element = query;
  } else {
    var element = $(query);
  }
  console.assert(element.length, "query never matched any element");
  element.removeClass(classes.join(" "));
}

var inlineAlertsTimeOutObjs = {};
function inlineAlert(query, title, text, type = "danger", alertClass, hideTime) {
  //shows inline alert
  console.assert(alertClass !== undefined, "alertClassis undefined");
  var alertUnique = query+alertClass;
  if (alertUnique in inlineAlertsTimeOutObjs) {
    clearTimeout(inlineAlertsTimeOutObjs[alertUnique]);
  }
  var colors = {
    danger: "w3-red",
    warning: "w3-yellow",
    success: "w3-green",
    info: "w3-light-blue"
  };
  console.assert(colors.hasOwnProperty(type), `${type}  type doesnt map to any color`);
  var alertContainer = $(query);
  var panels = alertContainer.children(`div.${alertClass}`);
  console.assert(alertContainer.length, `no elements with query ${query} found`);
  console.assert(panels.length, "no elemets with div.alert-one found");
  $(panels).hide(500);
  $(panels).show(500);
  removeClasses(panels, Object.values(colors), true);
  panels.addClass(colors[type]);
  panels.children("h4").text(title);
  panels.children("p").text(text);

  if (hideTime !== undefined) {
    var timeOutObj = setTimeout(function() {
      panels.hide(500);
      delete inlineAlertsTimeOutObjs[alertUnique];
    }, hideTime);
  }
  inlineAlertsTimeOutObjs[alertUnique] = timeOutObj;
}

function hideInlineAlert() {

}

function showBorderMessage(query, type = "danger") {
  var colors = {
    danger: "w3-border-red",
    warning: "w3-border-yellow",
    success: "w3-border-green",
    info: "w3-border-blue"
  };
  var elem = $(query);
  console.assert(elem.length, `no elements with query ${query} found`);
  removeClasses(elem, Object.values(colors), true);
  elem.addClass(colors[type] + " navy-border-2");
}

function removeBorderMessage(query, type, removeBorder = true) {
  var colors = {
    danger: "w3-border-red",
    warning: "w3-border-yellow",
    success: "w3-border-green",
    info: "w3-border-blue"
  };
  var elem = $(query);
  console.assert(elem.length, `no elements with query ${query} found`);
  if (type !== undefined) {
    elem.removeClass(colors[type])
  } else {
    removeClasses(elem, Object.values(colors), true);
  }
  if (removeBorder) {
    elem.removeClass("navy-border-2")
  }
}

function hasSubArray(master, sub) {
    return sub.every((i => v => i = master.indexOf(v, i) + 1)(0));
}


function sliceIntoChunks(arr, chunkSize, advanced=false) {
  var modArr = []
  if (advanced) {
    for (let i = 0; i < arr.length; i++) {
      modArr.push(arr[i]);
      if ((i < arr.length - 1) && i > 0) {
        modArr.push(arr[i]);
      }
    }
  }
  else {
    modArr = arr;
  }

  const res = [];
  for (let i = 0; i < modArr.length; i += chunkSize) {
    const chunk = modArr.slice(i, i + chunkSize);
    res.push(chunk);
  }
  return res;
}


Array.isIncluded = function(array, array2){
  for (let i = 0; i < array.length; i++) {
    if (Array.isEqual(array[i], array2)) {
      return true;
    }
  }
  return false;
}



Array.isEqual = function (array, array2) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time
    if (array2.length != array.length)
        return false;

    for (var i = 0, l=array2.length; i < l; i++) {
        // Check if we have nested arrays
        if (array2[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!array2[i].equals(array[i]))
                return false;
        }
        else if (array2[i] != array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
}
// Hide method from for-in loops

//Object.defineProperty(Array.prototype, "__equals", {enumerable: false});


Object.isEqual = function(object1, object2) {
    //For the first loop, we only check for types
    for (propName in object1) {
        //Check for inherited methods and properties - like .equals itself
        //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwnProperty
        //Return false if the return value is different
        if (object1.hasOwnProperty(propName) != object2.hasOwnProperty(propName)) {
            return false;
        }
        //Check instance type
        else if (typeof object1[propName] != typeof object2[propName]) {
            //Different types => not equal
            return false;
        }
    }
    //Now a deeper check using other objects property names
    for(propName in object2) {
        //We must check instances anyway, there may be a property that only exists in object2
            //I wonder, if remembering the checked values from the first loop would be faster or not
        if (object1.hasOwnProperty(propName) != object2.hasOwnProperty(propName)) {
            return false;
        }
        else if (typeof object1[propName] != typeof object2[propName]) {
            return false;
        }
        //If the property is inherited, do not check any more (it must be equa if both objects inherit it)
        if(!object1.hasOwnProperty(propName))
          continue;

        //Now the detail check and recursion

        //object1 returns the script back to the array comparing
        /**REQUIRES Array.equals**/
        if (object1[propName] instanceof Array && object2[propName] instanceof Array) {
                   // recurse into the nested arrays
           if (!object1[propName].equals(object2[propName]))
                        return false;
        }
        else if (object1[propName] instanceof Object && object2[propName] instanceof Object) {
                   // recurse into another objects
                   //console.log("Recursing to compare ", object1[propName],"with",object2[propName], " both named \""+propName+"\"");
           if (!object1[propName].equals(object2[propName]))
                        return false;
        }
        //Normal value comparison for strings and numbers
        else if(object1[propName] != object2[propName]) {
           return false;
        }
    }
    //If everything passed, let's say YES
    return true;
}


Object.isMobileDevice = function(){
  var isMobile = false; //initiate as false
  // device detection
  if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
      || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) {
      isMobile = true;
  }
  return isMobile;
}


function getRange(lowEnd, highEnd) {
  var list = [];
  for (var i = lowEnd; i < highEnd; i++) {
    list.push(i);
  }
  return list;
}


function isBetween(value, min, max) {
  var output = value >= min && value <= max;
  console.assert(output !== undefined, `output is undefined`);
  return output
}

function getNext(val, min, max, size) {
  var maximum = max
  if (val + size >= max) {

  }
}

function getSurrounding(value, minValue, maxValue, size) {
  console.assert(value >= minValue && value <= maxValue, `${value} is not within min ${minValue} and max ${maxValue}`);
  var values = getRange(minValue, maxValue);
  var halfSize = Math.floor((size + 1) * 0.5)
  var possibleMin = value - halfSize;
  var possibleMax = value + halfSize;
  if (isBetween(possibleMin, minValue, maxValue)) {
    var minValue = possibleMin;
  }
  if (isBetween(possibleMax, minValue, maxValue)) {
    var maxValue = possibleMax;
  }

  var list = getRange(minValue, maxValue);
  if (size < list.length) {
    list.shift()
  }

  return list;
}

function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}



function updateProgressBar(progressQuery, value, total, animateTime) {
  console.assert(progressQuery !== undefined, "progressQuery is undefined");
  console.assert(value !== undefined, "value is undefined");
  console.assert(total !== undefined, "total is undefined");
  showProgressBar(progressQuery)
  const progress = $(progressQuery);
  console.assert(progress.length, `query '${progressQuery}' did not match any element`)
  const fill = progress.find(".fill");
  const percent = (value / total) * 100;

  console.assert(percent <= 100, `progress bar percent is larget that 100 currently ${percent}`);
  if (percent < 100) {
    //animation tricks
    if (fill.text().replace("%", '') > percent) {
      //refresh animation(prediction(not accurate))
      updateProgressBarSentiment(progressQuery, true);
      fill.stop(true, true);
      fill.css("width", 0);
    }
    //restart animation
    //slow at start but faster and stoping at end(emulation)
    if (animateTime === undefined) {
      var animateTime = 15000 * (total-value);
    }
    fill.stop(true, true);
    fill.animate({
      width: percent + "%",
    }, animateTime);

  } else {
    //progressbar terminated if % is 100 or greater(task complete)
    fill.stop(true, true);
    fill.css("width", percent + "%");
    hideProgressBar(progressQuery);
  }

  fill.children("span").text(percent);

}

function updateProgressBarText(progressQuery, text) {
  console.assert(progressQuery !== undefined, "progressQuery is undefined");
  console.assert(text !== undefined, "text is undefined");
  const progress = $(progressQuery);
  console.assert(progress.length, `query '${progressQuery}' did not match any element`)
  progress.find(".text").text(text);
}

function updateProgressBarSentiment(progressQuery, isPositive) {
  console.assert(progressQuery !== undefined, "progressQuery is undefined");
  console.assert(isPositive !== undefined, "isPositive arg is undefined");
  const progress = $(progressQuery);
  const fill = progress.find(".fill");
  if (isPositive) {
    fill.addClass("w3-green");
    fill.removeClass("w3-red");
  } else {
    fill.addClass("w3-red");
    fill.removeClass("w3-green")
  }
}

function hideProgressBar(progressQuery) {
  setTimeout(function() {
    console.assert(progressQuery !== undefined, "progressQuery is undefined");
    const progress = $(progressQuery);
    progress.addClass("w3-hide");
  }, 1500)
}

function showProgressBar(progressQuery) {
  console.assert(progressQuery !== undefined, "progressQuery is undefined");
  const progress = $(progressQuery);
  progress.removeClass("w3-hide");
}

function copyToClipBoard(text) {
  if (Object.isMobileDevice()) {
    navigator.clipboard.writeText(text.slice(0, 99999));
  }
  else {
    console.log(text)
    navigator.clipboard.writeText(text);
  }
}

//possible alternave to replaceWords
function replaceChar(origString, replaceChar, index) {
  let newStringArray = origString.split("");

  newStringArray[index] = replaceChar;

  let newString = newStringArray.join("");

  return newString;
}


if(!String.prototype.replaceAll){

  String.prototype.replaceAll = function(subText, repText){
    var re = new RegExp(subText, 'g');
    return this.replace(re, repText);
  }
}
