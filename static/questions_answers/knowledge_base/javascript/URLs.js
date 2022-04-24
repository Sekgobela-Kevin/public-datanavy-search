"use strict";

var knowledgeURLsStorage = {
  knowledge: [],
  sent: [],
  active: new Set(),
  uploadLimit: 20,

  uploadLimitReached: function() {
    return this.knowledge.length >= this.uploadLimit;
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


  getSources: function(knowledges) {
    console.assert(knowledges !== undefined, "knowledges is undefined")
    return knowledges
  },

  getAllSources: function() {
    return this.getSources(this.knowledge)
  },

  getSent: function() {
    return this.sent;
  },

  isSent: function(knowledge) {
    return this.sent.includes(knowledge);
  },

  removeFromSent: function(knowledge) {
    var index = this.sent.indexOf(knowledge);
    if (index > -1) {
      this.sent.splice(index, 1);
    }
  },

  addToSent: function(knowledge) {
    this.sent.push(knowledge);
  },

  addUnsentToSent: function(knowledge) {
    this.sent = this.sent.concat(this.getUnsents());
  },

  getUnsents: function() {
    var self = this;
    var unSent = [];
    $.each(this.knowledge, function(index, value) {
      if (!self.isSent(value)) {
        unSent.push(value);
      }
    });
    return unSent;
  },

  unSentAvail: function() {
    return this.getUnsents().length > 0;
  },

  addAllToSent: function() {
    var self = this;
    $.each(this.knowledge, function(index, value) {
      self.addToSent(value);
    });
  },

  isReadyForSend: function() {
    return this.unSentAvail();
  },

  getURLKnowledge: function() {
    return this.knowledge;
  },

  isValidHttpUrl: function(string) {
    let url;

    try {
      //error thrown if url invalid
      url = new URL(string);
    } catch (_) {
      return false;
    }

    return url.protocol === "http:" || url.protocol === "https:";
  },

  isValid: function(knowledge) {
    return !this.isAvail(knowledge) && knowledge && this.isValidHttpUrl(knowledge) === true;
  },

  addKnowledge: function(knowledge) {
    if (this.isValid(knowledge) === true) {
      //simplify url from custom goolgle search engine
      //by extracting only q parameter
      //var knowledge = this.simplifyGoogleCSEUrl(knowledge);
      this.addToActive(knowledge);
      this.knowledge.push(knowledge);
    }
  },


  simplifyGoogleCSEUrl: function(url){
    console.assert(this.isValidHttpUrl(url), `'${url}' url is invalid`);
    const urlObj = new URL(url);
    if (urlObj.hostname === "www.google.com") {
      clientPar = urlObj.searchParams.get('client');
      if (clientPar) {
        qPar = urlObj.searchParams.get('q');
        return qPar;
      }
    }
    return url;
  },

  removeKnowledge: function(knowledge) {
    var index = this.knowledge.indexOf(knowledge);
    if (index !== -1) {
      this.knowledge.splice(index, 1);
      console.assert(this.knowledge.indexOf(knowledge) === -1, `'${knowledge}' source still exists after being removed`)
      this.active.delete(knowledge);
      knowledgeURLsClient.abortRequest(knowledge);
    }
  },

  isAvail: function(knowledge) {
    var state = false;
    $.each(this.knowledge, function(index, value) {
      if (value === knowledge) {
        state = true;
        return;
      }
    });
    return state;
  },

  isEmpty: function() {
    if (this.knowledge.length === 0) {
      return true;
    } else {
      return false;
    }
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


var knowledgeURLsClient = {
  Url: location.protocol + '//' + location.host + location.pathname + "/knowledge/apload/urls",
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
    var self = knowledgeURLsClient;
    knowledgeURLsDisplay.updateProgressBarText("Finished uploading webpages urls");
    knowledgeURLsDisplay.syncDisplay(false);
    self.clearRequests();
  },

  completeCall: function() {
    var self = knowledgeURLsClient;
    self.totalCompletedRequests += 1;
    self.removeRequest(this[0]);

    knowledgeURLsDisplay.updateProgressBar(self.totalCompletedRequests, self.totalSentRequests);
    if (knowledgeURLsClient.requestsCompleted()) {
      var text = "";
      if (self.totalFailRequests > self.totalSuccessRequests) {
        text += `${self.totalFailRequests}/${self.totalCompletedRequests} webpages urls
        failed to submit. May be caused by (${Array.from(self.errorStatuses).join(", ")}).`
        /*alert when there was error in sending webpages urls*/
        var alertOneObj = {
          text: text,
          type: "warning"
        };
        knowledgeURLsDisplay.showInlineDoubleAlert(alertOneObj, undefined, false);
      }

      else {
        text += `${self.totalSuccessRequests}/${self.totalCompletedRequests}
         webpages urls submited sucessfully. ${self.totalReadyRequests}
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
      knowledgeURLsDisplay.showInlineDoubleAlert(alertOneObj, undefined, false);
      self.completedCall();
    }
  },

  errorCall: function(data, status, error) {
    var self = knowledgeURLsClient;
    self.totalFailRequests += 1;
    self.errorStatuses.add(error);
    self.errorStatuses.add(status);
    var text = "Error occured while uploading webpage url: " + status;
    knowledgeURLsDisplay.updateProgressBarSentiment(false);
    knowledgeURLsDisplay.updateProgressBarText(text);
  },


  successCall: function(data, status, error) {
    var self = knowledgeURLsClient;
    console.assert(self.totalSuccessRequests !== undefined, "totalSuccessRequests undefined");
    self.totalSuccessRequests += 1;
    var sentItem = this[0];
    var parsedData = JSON.parse(data);
    if (parsedData) {
      textKnowledgeStorage.addKnowleges(JSON.parse(data));
      if (textKnowledgeStorage.knowledgeExists(sentItem)) {
        self.totalReadyRequests += 1;
      }
    }
    var self = this;
    knowledgeURLsStorage.addToSent(this[0]);

    knowledgeURLsDisplay.syncDisplay();

    var text = `sucessfully uploaded: '${this[0]}' webpage url`
    knowledgeURLsDisplay.updateProgressBarSentiment(true);
    knowledgeURLsDisplay.updateProgressBarText(text);
  },

  sendURLs: function() {
    var self = this;
    self.clearRequests();
    var urls = knowledgeURLsStorage.getSendReady();
    console.assert(urls, "urls is undefined");
    $.each(urls, function(index, url) {
      self.sendURL(url);
    });
    if(urls.length){
      Knowledges.clearRequestsCall();
      knowledgeURLsDisplay.updateProgressBar(0.5, self.totalSentRequests);
      $('#knowledge_URL_submit').attr('disabled', 'disabled');
    }
  },

  sendURL: function(url) {
    //server expects array data
    const request = sendJSON(this.Url, [url], this.successCall, this.errorCall, this.completeCall);
    this.requestsObjsMap[url] = request;
    this.totalSentRequests += 1;
    this.status = true;
  }
}


var knowledgeURLsDisplay = {
  knowledgeData: {
    "URLsKnowledgeData": [],
  },
  clear: function() {
    this.knowledgeData = {
      "URLsKnowledgeData": []
    }
  },

  showInlineAlert: function(title, text, type, alertClass, makeVisible=true) {
    //inline alert is shon with new text
    console.assert(alertClass !== undefined, "alertClass is undefined");
    if (alertClass === "alert-all") {
      $("#knowledge-urls-alert div.alert-one").show();
      $("#knowledge-urls-alert div.alert-two").show();
    } else {
      inlineAlert(`#knowledge-urls-alert`, title, text, type, alertClass);
    }
    if (makeVisible) {
      $("#info-upload-nav-item").click();
      $(".knowledges-bar").children()[2].click();
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

  showInlineMergeAlert: function(alertData, texts, alertClass="alert-one") {
    console.assert(alertOneObj !== undefined, "alertOneObj is undefined");
    console.assert(texts !== undefined, "texts is undefined");
    if (texts) {
      this.showInlineAlert(alertOneObj.title, texts.join(' '), alertOneObj.type, alertClass);
    }
  },


  hideInlineAlert: function(alertClass = "alert-one") {
    console.assert(alertClass !== undefined, "alertClass is undefined");
    if (alertClass === "alert-all") {
      $("#knowledge-urls-alert div.alert-one").hide();
      $("#knowledge-urls-alert div.alert-two").hide();
    } else {
      $(`#knowledge-urls-alert div.${alertClass}`).hide(500);
    }
  },


  setReadyStateIcon: function(source) {
    var isSent = knowledgeURLsStorage.isSent(source);
    var isConverted = textKnowledgeStorage.knowledgeExists(source);
    var isActive = knowledgeURLsStorage.getActiveState(source);
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

  syncData: function() {
    this.clear()
    var self = this;
    var URLsKnowledge = knowledgeURLsStorage.getURLKnowledge();
    var data = this.knowledgeData["URLsKnowledgeData"];
    $.each(URLsKnowledge, function(index, value) {
      var object = {};
      object["URL"] = value;
      object["readyStateIcon"] = self.setReadyStateIcon(value);
      object["index"] = index;
      object["statusCheckBoxIcon"] = self.setCheckBoxIcon(knowledgeURLsStorage.active.has(object["URL"]));
      data.push(object);
    });
  },

  displayData: function() {
    w3.displayObject("knowledge_URLs_preview", this.knowledgeData);
  },

  syncDisplay: function(executeOptional=true) {
    this.syncData();
    this.displayData();
    this.showHide(executeOptional);
  },

  addKnowledge: function(text) {
    knowledgeURLsStorage.addKnowledge(text);
    this.syncDisplay(false);
  },

  addByIndex: function(index) {
    text = knowledgeURLsStorage.knowledge[index]
    knowledgeURLsStorage.addKnowledge(text);
    this.syncDisplay();
  },

  removeByIndex: function(index) {
    const text = knowledgeURLsStorage.knowledge[index]
    knowledgeURLsStorage.removeKnowledge(text);
    Knowledges.deleteResource(text);
    knowledgeURLsStorage.removeFromSent(text);
    this.syncDisplay();
  },

  setCheckBoxIcon: function(state) {
    console.assert(state !== undefined, "state is undefined");
    if (state) {
      return "<i class='fa fa-eye' title='Disable resource'></i>";
    } else {
      return "<i class='fa fa-eye-slash' title='Enable resource'></i>";
    }
  },

  computeActiveState: function(source) {
    var oldState = knowledgeURLsStorage.active.has(source)
    if (oldState) {
      knowledgeURLsStorage.active.delete(source);
      knowledgeURLsClient.abortRequest(source);
    } else if (!oldState) {
      knowledgeURLsStorage.active.add(source);
    }
    var newState = knowledgeURLsStorage.active.has(source)
    console.assert(newState != oldState, "state never changed after click")
    this.syncDisplay();
  },

  showHide: function(executeOptional=true) {
    if (executeOptional) {
      this.hideInlineAlert();
    }
    var init = $("#" + "knowledge_URL_init")
    var preview = $("#" + "knowledge_URLs_preview_container")
    if (this.knowledgeData["URLsKnowledgeData"].length > 0) {
      init.addClass("w3-hide");
      preview.removeClass("w3-hide");
    } else {
      init.removeClass("w3-hide");
      preview.addClass("w3-hide");
    }


    if (knowledgeURLsStorage.activeSendReadyAvail()) {
      $('#knowledge_URL_submit').attr('disabled', false);
    } else {
      $('#knowledge_URL_submit').attr('disabled', 'disabled');
    }

    if (knowledgeURLsStorage.uploadLimitReached()) {
      $('#knowledge_URL_adding_button').attr('disabled', 'disabled');
    } else {
      $('#knowledge_URL_adding_button').attr('disabled', false);
    }

    if (knowledgeURLsStorage.isEmpty()) {
      var alertOneObj = {
        text: "Enter urls(links) to fetch webpage search resources.\
         Use buit-in Google search to search and get webpage urls.",
        type: "info"
      }
      this.showInlineDoubleAlert(alertOneObj, undefined, false, false);
    }
  },
  switchText: function(element) {
    childrens = $(element).children();
    childrens.toggleClass("w3-hide");
  },

  updateProgressBar: function(value, total) {
    updateProgressBar("#knowledge_URLs_progress_bar", value, total)
  },

  updateProgressBarText: function(text) {
    updateProgressBarText("#knowledge_URLs_progress_bar", text);
  },

  updateProgressBarSentiment: function(isPositive) {
    updateProgressBarSentiment("#knowledge_URLs_progress_bar", isPositive)
  }
}

$(document).ready(function() {
  knowledgeURLsDisplay.syncDisplay();

  /*$("#" + "knowledge_URLs_input   vvv").keydown(function(){
    if (!knowledgeURLsStorage.isValidHttpUrl($(this).val())) {
      $(this).css("background-color", "red");
    }
    else {
      $(this).css("background-color", "initial");
    }
  });*/



  $("#" + "knowledge_URL_adding_button").on('click', function() {
    var input = $("#" + "knowledge_URLs_input");
    var inputValue = input.val().trim();

    if (knowledgeURLsStorage.isValid(inputValue)) {
      knowledgeURLsDisplay.addKnowledge(inputValue);
      $("#" + "knowledge_URL_submit").click();
      input.val("")
    } else if (inputValue === "") {
      showBorderMessage(input);
      var alertOneObj = {
        text: "Webpage url cannot be empty or resemble space characters",
        type: "danger"
      }
      knowledgeURLsDisplay.showInlineDoubleAlert(alertOneObj, undefined, false);
    } else if (knowledgeURLsStorage.isAvail(inputValue)) {
      showBorderMessage(input);
      var alertOneObj = {
        text: "Webpage url is already added",
        type: "warning"
      }
      knowledgeURLsDisplay.showInlineDoubleAlert(alertOneObj, undefined, false);
    } else if (!knowledgeURLsStorage.isValidHttpUrl(inputValue)) {
      showBorderMessage(input);
      var alertOneObj = {
        text: "Webpage url invalid based on its structure. Ensure that you have entered the url correctly, to avoid problems copy and paste it from its source",
        type: "danger"
      }
      knowledgeURLsDisplay.showInlineDoubleAlert(alertOneObj, undefined, false);
    } else {
      var alertOneObj = {
        text: "Error occured while adding webpage url::: cause: __UNKNOWN__",
        type: "danger"
      }
      knowledgeURLsDisplay.showInlineDoubleAlert(alertOneObj, undefined, false);
    }

    if (knowledgeURLsStorage.uploadLimitReached()) {
      var text = "No more webpage urls can be added afterwards as you have reached reached a limit of webpage urls"
      var alertOneObj = {
        text: text,
        type: "warning"
      }
      knowledgeURLsDisplay.showInlineDoubleAlert(alertOneObj, undefined, false);
    }
  });

  $("#" + "knowledge_URL_submit").on('click', function() {
    if (knowledgeURLsClient.isSafeToSend()) {
      if (knowledgeURLsStorage.activeSendReadyAvail()) {
        knowledgeURLsClient.sendURLs();
      } else {
        var alertOneObj = {
          text: "All webpages urls are already submited. Why re-submit resource that is already submited?",
          type: "warning"
        }
        knowledgeURLsDisplay.showInlineDoubleAlert(alertOneObj, undefined, false);
      }
    }
  });

  $("#" + "knowledge_URLs_input").on('input', function() {
    //identify google cse url and extract neccessary part
    var value = $(this).val();
    if (knowledgeURLsStorage.isValidHttpUrl(value)) {
      $(this).val(knowledgeURLsStorage.simplifyGoogleCSEUrl(value));
    }
    if (knowledgeURLsStorage.isValid($(this).val())) {
      removeBorderMessage(this);
    }
  });

  $("#" + "knowledge_URLs_input ddfd").on('input', function() {
    if ($(this).val() !== "") {
      removeBorderMessage($(this));
    }
  });
});
