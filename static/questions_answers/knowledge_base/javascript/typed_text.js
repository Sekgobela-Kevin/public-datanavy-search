"use strict";

var knowledgeTypedTextStorage = {
  knowledge: new Map(),
  sent: new Map(),
  active: new Set(),
  uploadLimit: 20,

  uploadLimitReached: function() {
    return this.knowledge.size >= this.uploadLimit;
  },


  addToActive: function(source) {
    this.active.add(source);
  },

  getActiveSources: function() {
    return Array.from(this.active);
  },

  getActiveState: function(source) {
    return this.active.has(source)
  },

  getSources: function(map) {
    console.assert(map !== undefined, "map is undefined");
    return Array.from(map.keys());
  },

  getAllSources: function() {
    return this.getSources(this.knowledge)
  },

  isSent: function(source) {
    return this.sent.has(source);
  },

  removeFromSent: function(source) {
    this.sent.delete(source)
  },

  addToSent: function(source, knowledge) {
    this.sent.set(source, knowledge);
  },

  addUnsentToSent: function() {
    this.sent = new Map([...this.sent].concat([...this.getUnsents()]));
  },

  getUnsents: function() {
    var self = this;
    var unSent = new Map();
    //Taken from https://developer.mozilla.org/
    this.knowledge.forEach(function callbackFn(value, key, map) {
      if (!self.isSent(key)) {
        unSent.set(key, value);
      }
    })
    return unSent;
  },

  unSentAvail: function() {
    return this.getUnsents().size > 0
  },

  addAllToSent: function() {
    var self = this;
    this.knowledge.forEach(function callbackFn(value, key, map) {
      self.addToSent(key, value);
    }, this)
  },

  isReadyForSend: function() {
    return this.unSentAvail();
  },

  getTypedKnowledge: function() {
    return this.knowledge;
  },

  isSourceValid: function(source) {
    return Boolean(source) && !this.isAvail(source)
  },

  isTextValid: function(knowledge) {
    return Boolean(knowledge)
  },

  addKnowledge: function(source, knowledge) {
    console.assert(source, "source is undefined or map to false");
    console.assert(knowledge, "knowledge text is undefined or map to false");
    this.addToActive(source);
    this.knowledge.set(source, knowledge)
  },

  removeKnowledge: function(source) {
    this.active.delete(source);
    this.knowledge.delete(source)
    console.assert(!this.isAvail(source), `'${source}' still exist after removal`)
    knowledgeTypedClient.abortRequest(source);
  },

  isAvail: function(source) {
    console.assert(source, "source is undefined or map to false");
    return this.knowledge.has(source)
  },
  isEmpty: function() {
    return this.knowledge.size === 0
  },

  isReadyForSend: function(source) {
    console.assert(source !== undefined, "source is undefined");
    var isReady = !textKnowledgeStorage.knowledgeExists(source) && this.getActiveState(source);
    console.assert(isReady !== undefined, "is_redy is undefined");
    return isReady;
  },

  getSendReady: function() {
    var active = this.getActiveSources();
    var self = this;
    var ready = []
    $.each(active, function(index, source) {
      console.assert(source !== undefined, "source is undefined");
      if (self.isReadyForSend(source)) {
        ready.push(source);
      }
    })
    return ready
  },

  activeSendReadyAvail: function() {
    return this.getSendReady().length > 0;
  },

  getExtractedSources: function() {
    //Active means enabled
    var curentSources = new Set(this.getAllSources());
    var extracted = new Set(textKnowledgeStorage.getSources());
    var items = intersection(extracted, curentSources);
    console.assert(items !== undefined, "items is undefined");
    return items
  },

  getActiveExtractedSources: function() {
    //Active means enabled
    var active = new Set(this.getActiveSources());
    var extracted = new Set(this.getExtractedSources());
    var items = intersection(extracted, active);
    console.assert(items !== undefined, "items is undefined");
    return items
  },

  getInactiveSources: function() {
    var active = new Set(this.getActiveSources());
    var allSources = new Set(this.getAllSources());
    var items = difference(allSources, active);
    console.assert(items !== undefined, "items is undefined");
    return items;
  },


  getInactiveExtractedSources: function() {
    var active = new Set(this.getInactiveSources());
    var extracted = new Set(this.getExtractedSources());
    var items = intersection(extracted, active);
    console.assert(items !== undefined, "items is undefined");
    return items
  }
}

var knowledgeTypedClient = {
  Url: location.protocol + '//' + location.host + location.pathname + "knowledge/apload/text",
  failMessage: "Message ",
  requestsObjsMap: {},
  status: false,

  isSafeToSend: function() {
    return !this.status
  },

  clearRequests: function() {
    this.totalSentRequests = 0;
    this.totalCompletedRequests = 0;
    this.totalSuccessRequests = 0;
    this.totalReadyRequests = 0;
    this.totalFailRequests = 0;
    this.errorStatuses = new Set();
    this.status = false;
    Knowledges.clearRequestsCall();
  },

  abortRequest: function(source){
    if (source in this.requestsObjsMap) {
      this.requestsObjsMap[source].abort();
      this.removeRequest(source);
    }
  },

  removeRequest: function(source){
    delete this.requestsObjsMap[source];
  },


  requestsCompleted: function() {
    return this.totalSentRequests === this.totalCompletedRequests;
  },

  completedCall: function() {
    var self = knowledgeTypedClient;
    knowledgeTypedTextDisplay.updateProgressBarText("Finished uploading raw texts");
    knowledgeTypedTextDisplay.syncDisplay(false);
    self.clearRequests();
  },

  completeCall: function() {
    var self = knowledgeTypedClient;
    var sentItem = Object.keys(this)[0];
    self.totalCompletedRequests += 1;
    self.removeRequest(sentItem);

    knowledgeTypedTextDisplay.updateProgressBar(self.totalCompletedRequests, self.totalSentRequests);
    if (knowledgeTypedClient.requestsCompleted()) {
      var text = "";
      if (self.totalFailRequests > self.totalSuccessRequests) {
        text += `${self.totalFailRequests}/${self.totalCompletedRequests} raw texts
        failed to submit. May be caused by (${Array.from(self.errorStatuses).join(", ")}).`
        /*alert when there was error in sending raw texts*/
        var alertOneObj = {
          text: text,
          type: "warning"
        };
        knowledgeTypedTextDisplay.showInlineDoubleAlert(alertOneObj, undefined, false);
      }

      else {
        text += `${self.totalSuccessRequests}/${self.totalCompletedRequests}
         raw texts submited sucessfully. ${self.totalReadyRequests}
         of those are ready for a search.`;
      }

      if (self.totalReadyRequests >= self.totalCompletedRequests*0.5) {
        var alertOneObj = {
          text: text,
          type: "success"
        };
      }
      else {
        var alertOneObj = {
          text: text,
          type: "danger"
        };
      }
      knowledgeTypedTextDisplay.showInlineDoubleAlert(alertOneObj, undefined, false);
      self.completedCall();
    }
  },

  errorCall: function(data, status, error) {
    var self = knowledgeTypedClient;
    var sentItem = Object.keys(this)[0];
    self.totalFailRequests += 1;
    self.errorStatuses.add(error);
    self.errorStatuses.add(status);
    var text = "Error occured while uploading raw text: " + status;
    knowledgeTypedTextDisplay.updateProgressBarSentiment(false);
    knowledgeTypedTextDisplay.updateProgressBarText(text);
  },


  successCall: function(data, status, error) {
    var self = knowledgeTypedClient;
    var sentItem = Object.keys(this)[0];
    console.assert(self.totalSuccessRequests !== undefined, "totalSuccessRequests undefined");
    self.totalSuccessRequests += 1;
    var parsedData = JSON.parse(data);
    if (parsedData) {
      textKnowledgeStorage.addKnowleges(parsedData);
      if (textKnowledgeStorage.knowledgeExists(sentItem)) {
        self.totalReadyRequests += 1;
      }
    }
    var self = this;
    knowledgeTypedTextStorage.addToSent(sentItem);

    knowledgeTypedTextDisplay.syncDisplay();

    var text = `sucessfully uploaded: '${sentItem}' raw text`
    knowledgeTypedTextDisplay.updateProgressBarSentiment(true);
    knowledgeTypedTextDisplay.updateProgressBarText(text);
  },

  sendTypedTexts: function() {
    var self = this;
    self.clearRequests();
    var sources = knowledgeTypedTextStorage.getSendReady();
    console.assert(sources !== undefined, "Typed is undefined");
    $.each(sources, function(index, source) {
      if (!textKnowledgeStorage.knowledgeExists(source)) {
        var text = knowledgeTypedTextStorage.knowledge.get(source);
        console.assert(text !== undefined, "text is undefined");
        self.sendTypedText(source, text);
      }
    });
    if(sources.length){
      Knowledges.clearRequestsCall();
      knowledgeTypedTextDisplay.updateProgressBar(0.5, self.totalSentRequests);
      $('#knowledge_typed_submit').attr('disabled', 'disabled');
    }
  },

  sendTypedText: function(source, text) {
    //server expects json data
    const request = sendJSON(this.Url, {[source]: text}, this.successCall, this.errorCall, this.completeCall);
    this.requestsObjsMap[source] = request;
    this.totalSentRequests += 1;
    this.status = true;
  }
}



var knowledgeTypedTextDisplay = {
  knowledgeData: {
    "typedKnowledgeData": [],
  },

  showInlineAlert: function(title, text, type, alertClass, makeVisible=true) {
    //inline alert is shon with new text
    console.assert(alertClass !== undefined, "alertClass is undefined");
    if (alertClass === "alert-all") {
      $("#knowledge-typed-alert div.alert-one").show();
      $("#knowledge-typed-alert div.alert-two").show();
    } else {
      inlineAlert(`#knowledge-typed-alert`, title, text, type, alertClass);
    }
    if (makeVisible) {
      $("#info-upload-nav-item").click();
      $(".knowledges-bar").children()[1].click();
    }
  },

  showInlineDoubleAlert: function(alertOneObj, alertTwoObj, isDouble = true, makeVisible=true) {
    console.assert(alertOneObj !== undefined, "alertOneObj is undefined");
    this.showInlineAlert(alertOneObj.title, alertOneObj.text, alertOneObj.type, "alert-one", makeVisible);
    if (isDouble) {
      console.assert(alertTwoObj !== undefined, "alertTwoObj is undefined");
      this.showInlineAlert(alertTwoObj.title, alertTwoObj.text, alertTwoObj.type, "alert-two", makeVisible);
    } else {
      this.hideInlineAlert("alert-two");
    }
  },


  hideInlineAlert: function(alertClass = "alert-one") {
    console.assert(alertClass !== undefined, "alertClass is undefined");
    if (alertClass === "alert-all") {
      $("#knowledge-typed-alert div.alert-one").hide();
      $("#knowledge-typed-alert div.alert-two").hide();
    } else {
      $(`#knowledge-typed-alert div.${alertClass}`).hide(500);
    }
  },

  shorten: function(text, charLength) {
    if (text.length > charLength) {
      return text.slice(0, charLength);
    } else {
      return text;
    }
  },

  clear: function() {
    this.knowledgeData = {
      "typedKnowledgeData": []
    }
  },

  determinePluralForWord: function(text) {
    length = text.split(" ").length;
    if (length == 1) {
      return "word"
    } else {
      return "words"
    }
  },

  setStateIcon: function(source) {
    var isSent = knowledgeTypedTextStorage.isSent(source);
    var isConverted = textKnowledgeStorage.knowledgeExists(source);
    var isActive = knowledgeTypedTextStorage.getActiveState(source);
    console.assert(isSent != undefined, "isSent is undefined should be boolean")
    console.assert(isConverted != undefined, "isConverted is undefined should be boolean")
    console.assert(isActive != undefined, "isActive is undefined should be boolean")

    var iconHtml;
    if (isSent && !isConverted) {
      iconHtml = '<i class="fa fa-exclamation-triangle w3-text-yellow nav-text w3-center" title="Submited but not ready"></i>'
    } else if (isSent && isConverted) {
      iconHtml = "<i class='fa fa-check-circle w3-text-green nav-text w3-center' title='Ready to be searched'></i>";
    } else if (!isSent) {
      iconHtml = '<i class="fa fa-exclamation-triangle w3-text-red nav-text w3-center", title="Never submited"></i>';
    }
    console.assert(iconHtml, "iconHtml is undefined while it shoul be html icon code");
    return iconHtml
  },

  setCheckBoxIcon: function(state) {
    console.assert(state !== undefined, "state is undefined");
    if (state) {
      return "<i class='fa fa-eye' title='Disable resource'></i>";
    } else {
      return "<i class='fa fa-eye-slash' title='Enable resource'></i>";
    }
  },

  syncData: function() {
    this.clear()
    var self = this;
    var typedKnowledge = knowledgeTypedTextStorage.getTypedKnowledge();
    var data = this.knowledgeData["typedKnowledgeData"];
    typedKnowledge.forEach(function callbackFn(value, key, map) {
      value = removeSomeChar(value)
      var object = {};
      object["source"] = key;
      object["fullText"] = value;
      object["shortText"] = self.shorten(value, 200);
      object["length"] = value.split(" ").length + " " + self.determinePluralForWord(value);
      object["readyStateIcon"] = self.setStateIcon(key);
      object["statusCheckBoxIcon"] = self.setCheckBoxIcon(knowledgeTypedTextStorage.active.has(key));
      object["source"] = key;
      data.push(object);
    }, this)
  },

  displayData: function() {
    w3.displayObject("knowledge_text_preview", this.knowledgeData);
  },

  syncDisplay: function(executeOptional=true) {
    this.syncData();
    this.displayData();
    this.showHide(executeOptional)
  },

  addKnowledge: function(source, knowledge) {
    console.assert(source, "knowledgeTypedTextDisplay source is undefined or map to false");
    console.assert(knowledge, "knowledgeTypedTextDisplay knowledge text is undefined or map to false");
    knowledgeTypedTextStorage.addKnowledge(source, knowledge);
    this.syncDisplay(false);
  },

  removeKnowledge: function(source) {
    console.assert(source, `'${source}' maps to undefined`);
    knowledgeTypedTextStorage.removeKnowledge(source);
    Knowledges.deleteResource(source);
    knowledgeTypedTextStorage.removeFromSent(source);
    this.syncDisplay();
  },

  computeActiveState: function(source) {
    var oldState = knowledgeTypedTextStorage.active.has(source)
    if (oldState) {
      knowledgeTypedTextStorage.active.delete(source);
      knowledgeTypedClient.abortRequest(source);
    } else if (!oldState) {
      knowledgeTypedTextStorage.active.add(source);
    }
    var newState = knowledgeTypedTextStorage.active.has(source)
    console.assert(newState != oldState, "state never changed after click")
    this.syncDisplay();
  },

  showHide: function(executeOptional=true) {
    if (executeOptional) {
      this.hideInlineAlert();
    }
    var init = $("#" + "knowledge_type_init")
    var preview = $("#" + "knowledge_text_preview_container")
    if (this.knowledgeData["typedKnowledgeData"].length > 0) {
      init.addClass("w3-hide");
      preview.removeClass("w3-hide");
    } else {
      init.removeClass("w3-hide");
      preview.addClass("w3-hide");
    }

    var active = new Set(knowledgeTypedTextStorage.getActiveSources());
    var extracted = new Set(textKnowledgeStorage.getSources());
    if (isSuperset(extracted, active)) {
      $('#knowledge_typed_submit').attr('disabled', 'disabled');
    } else {
      $('#knowledge_typed_submit').attr('disabled', false);
    }

    if (knowledgeTypedTextStorage.uploadLimitReached()) {
      $('#knowledge_typed_adding_button').attr('disabled', 'disabled');
    } else {
      $('#knowledge_typed_adding_button').attr('disabled', false);
    }

    if (knowledgeTypedTextStorage.isEmpty()) {
      var alertOneObj = {
        text: "Enter text to be used as search resource",
        type: "info"
      }
      this.showInlineDoubleAlert(alertOneObj, undefined, false, false);
    }
  },

  switchText: function(element) {
    childrens = $(element).children();
    childrens.toggleClass("w3-hide")
  },

  updateProgressBar: function(value, total) {
    updateProgressBar("#knowledge_typed_progress_bar", value, total)
  },

  updateProgressBarText: function(text) {
    updateProgressBarText("#knowledge_typed_progress_bar", text);
  },

  updateProgressBarSentiment: function(isPositive) {
    updateProgressBarSentiment("#knowledge_typed_progress_bar", isPositive)
  }
}

$(document).ready(function() {
  knowledgeTypedTextDisplay.syncDisplay();


  $("#" + "knowledge_typed_adding_button").on('click', function() {
    var inputTextElement = $("#" + "knowledge_type_text_input");
    var inputSourceElement = $("#" + "knowledge_type_text_input_source");
    var text = inputTextElement.val().trim();
    var source = inputSourceElement.val().trim();

    if (text !== "") {
      removeBorderMessage(inputTextElement);
    }

    if (knowledgeTypedTextStorage.isSourceValid(source)) {
      removeBorderMessage(inputSourceElement);
      if (knowledgeTypedTextStorage.isTextValid(text)) {
        knowledgeTypedTextDisplay.addKnowledge(source, text);
        $("#knowledge_typed_submit").click();
        console.assert(knowledgeTypedTextStorage.getTypedKnowledge().has(source), "knowledge was just added but not found in the knowledge map");
        knowledgeTypedTextDisplay.hideInlineAlert();
        removeBorderMessage(inputTextElement);
        inputTextElement.val("");
        inputSourceElement.val("")
      } else if (text === "") {
        showBorderMessage(inputTextElement);
        var alertOneObj = {
          text: "Raw text is neccesary and cannot be empty",
          type: "danger"
        }
        knowledgeTypedTextDisplay.showInlineDoubleAlert(alertOneObj, undefined, false);
      } else {
        //alert user if text cant be addKnowledge
        var alertOneObj = {
          text: "Raw text not added due to unknown error.\n ITS NOT YOUR FAULT",
          type: "danger"
        }
        knowledgeTypedTextDisplay.showInlineDoubleAlert(alertOneObj, undefined, false);
      }
    } else if (source === "") {
      showBorderMessage(inputSourceElement);
      var alertOneObj = {
        text: "Title of text is neccesary and cannot be empty",
        type: "danger"
      }
      knowledgeTypedTextDisplay.showInlineDoubleAlert(alertOneObj, undefined, false);
    } else if (knowledgeTypedTextStorage.isAvail(source)) {
      var alertOneObj = {
        text: "Title of text already added! \nEnsure that there no other added text with same source.\nTry changing the source if text not already added.",
        type: "danger"
      }
      knowledgeTypedTextDisplay.showInlineDoubleAlert(alertOneObj, undefined, false);
    } else {
      //alert user if text cant be addKnowledge
      var alertOneObj = {
        text: "Title of text not added due to unknown error caused by text source.\n ITS NOT YOUR FAULT",
        type: "danger"
      }
      knowledgeTypedTextDisplay.showInlineDoubleAlert(alertOneObj, undefined, false);
      console.assert(source, "source was just extracted from element but is undefined or maps to false");
    }

    if (knowledgeTypedTextStorage.uploadLimitReached()) {
      var text = "You have just reached limit of raw text that can be added.\n Remove some manual text to add more.";
      var alertOneObj = {
        text: text,
        type: "warning"
      }
      knowledgeTypedTextDisplay.showInlineDoubleAlert(alertOneObj, undefined, false);
    }
  });

  $("#knowledge_typed_submit").on('click', function() {
    if (knowledgeTypedClient.isSafeToSend()) {
      if (knowledgeTypedTextStorage.activeSendReadyAvail()) {
        knowledgeTypedClient.sendTypedTexts()
      } else {
        //code to run if typedText not ready(already sent)
        var alertOneObj = {
          text: "All loaded raw text are ready for search. No need to re-submit them if they are ready.",
          type: "info"
        }
        knowledgeTypedTextDisplay.showInlineDoubleAlert(alertOneObj, undefined, false);
      }
    }
  });


  $("#" + "knowledge_type_text_input_source").on('input', function() {
    if ($(this).val() !== "") {
      removeBorderMessage($(this));
    }
  });

  $("#" + "knowledge_type_text_input").on('input', function() {
    var text = $(this).val()
    if (knowledgeTypedTextStorage.isTextValid(text) !== "") {
      removeBorderMessage($(this));
    }
  });
});
