questionsTypedTextStorage = {
  questions: [],
  sent: [],
  uploadLimit: 5,

  uploadLimitReached: function(){
    return this.knowledgeFiles.length >= this.uploadLimit;
  },

  active: new Set(),

  addToActive: function(source){
    this.active.add(source);
  },

  getActiveSources: function(){
    return Array.from(this.active);
  },

  getActiveState: function(source) {
    return this.active.has(source)
  },


  isSent: function(questions) {
    if (this.sent.includes(questions)) {
      return true;
    } else {
      return false;
    }
  },

  removeFromSent: function(questions) {
    var index = this.sent.indexOf(questions);
    if (index > -1) {
      this.sent.splice(index, 1);
    }
  },

  addToSent: function(questions){
    this.sent.push(questions);
  },

  addUnsentToSent: function(questions){
    this.sent = this.sent + this.getUnsents()
  },

  getUnsents: function(){
    var self = this;
    var unSent = [];
    $.each(this.questions, function(index, value) {
      if (!self.isSent(value)) {
        unSent.push(value);
      }
    });
    return unSent;
  },

  unSentAvail: function(){
    return this.getUnsents().length > 0
  },

  addAllToSent: function(){
    var self = this;
    $.each(this.questions, function(index, value) {
      self.addToSent(value);
    });
  },

  isReadyForSend: function(){
    return this.unSentAvail();
  },

  getTypedQuestions: function() {
    return this.questions;
  },

  isValid: function(questions) {
    return questions && !this.isAvail(questions)
  },

  addQuestions: function(questions) {
    if (this.isValid(questions) === true) {
      this.questions.push(questions);
      this.addToActive(questions);
    }
  },

  removeQuestions: function(questions) {
    var index = this.questions.indexOf(questions);
    if (index > -1) {
      this.questions.splice(index, 1);
      this.active.delete(questions);
    }
  },
  isAvail: function(questions) {
    var state = false;
    $.each(this.questions, function(index, value) {
      if (value === questions) {
        state = true;
        return;
      }
    });
    return state;
  },
  isEmpty: function() {
    if (this.questions.length === 0) {
      return true;
    } else {
      return false;
    }
  }
}

questionsTypedClient = {
  Url: location.protocol + '//' + location.host + location.pathname + "questions",
  failMessage: "Message ",
  errorTypedCall: function(xhr, status, error) {
    showAlert(`Error: ${status}`, "Some typedTexts not sent \n");
  },

  successTypedCall: function(xhr, status, error) {
    questionsTypedTextStorage.addUnsentToSent();
    showAlert("Sucess", "Textd sent completely \n" + status);
  },

  sendTyped: function() {
    if (questionsTypedTextStorage.unSentAvail()) {
      sendJSON(this.Url, questionsTypedTextStorage.questions, this.successTypedCall, this.errorTypedCall);
    } else {
      //code to run if typedText not ready(already sent)
    }

  }
}



questionsTypedTextDisplay = {
  questionsData: {
    "typedQuestionsData": [],
  },

  showInlineAlert: function(title, text, type, alertClass) {
    //inline alert is shon with new text
    console.assert(alertClass !== undefined, "alertClass is undefined");
    if (alertClass === "alert-all") {
      $("#questions-typed-alert div.alert-one").show();
      $("#questions-typed-alert div.alert-two").show();
    } else {
      inlineAlert(`#questions-typed-alert`, title, text, type, alertClass);
    }
  },

  showInlineDoubleAlert: function(alertOneObj, alertTwoObj, isDouble = true) {
    console.assert(alertOneObj !== undefined, "alertOneObj is undefined");
    this.showInlineAlert(alertOneObj.title, alertOneObj.text, alertOneObj.type, "alert-one");
    if (isDouble) {
      console.assert(alertTwoObj !== undefined, "alertTwoObj is undefined");
      this.showInlineAlert(alertTwoObj.title, alertTwoObj.text, alertTwoObj.type, "alert-two");
    } else {
      this.hideInlineAlert("alert-two");
    }
  },


  hideInlineAlert: function(alertClass = "alert-one") {
    console.assert(alertClass !== undefined, "alertClass is undefined");
    if (alertClass === "alert-all") {
      $("#questions-typed-alert div.alert-one").hide();
      $("#questions-typed-alert div.alert-two").hide();
    } else {
      $(`#questions-typed-alert div.${alertClass}`).hide();
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
    this.questionsData = {
      "typedQuestionsData": []
    }
  },
  determinePluralForWord: function(text) {
    length = text.split(" ").length
    if (length == 1) {
      return "word"
    } else {
      return "words"
    }
  },
  syncData: function() {
    this.clear()
    var self = this;
    var typedQuestions = questionsTypedTextStorage.getTypedQuestions();
    var data = this.questionsData["typedQuestionsData"];
    $.each(typedQuestions, function(index, value) {
      value = removeSomeChar(value)
      object = {};
      object["fullText"] = value;
      object["shortText"] = self.shorten(value, 200);
      object["length"] = value.split(" ").length + " " + self.determinePluralForWord(value);
      object["index"] = index;
      object["statusCheckBoxIcon"] = self.setCheckBoxIcon(questionsTypedTextStorage.active.has(value));
      data.push(object);
    });
  },
  displayData: function() {
    w3.displayObject("questions_text_preview", this.questionsData);
  },
  syncDisplay: function() {
    this.syncData();
    this.displayData();
    this.showHide()
  },
  addQuestions: function(text) {
    questionsTypedTextStorage.addQuestions(text);
    this.syncDisplay();
  },
  addByIndex: function(index) {
    text = questionsTypedTextStorage.questions[index]
    questionsTypedTextStorage.addQuestions(text);
    this.syncDisplay();
  },
  removeByIndex: function(index) {
    text = questionsTypedTextStorage.questions[index]
    questionsTypedTextStorage.removeQuestions(text);
    this.syncDisplay();
  },

  setCheckBoxIcon: function(state) {
    console.assert(state!==undefined, "state is undefined");
    if (state) {
      return "<i class='fa fa-eye' title='Disable resource'></i>";
    } else {
      return "<i class='fa fa-eye-slash' title='Enable resource'></i>";
    }
  },

  computeActiveState: function(source){
    var oldState = questionsTypedTextStorage.active.has(source)
    if (oldState) {
      questionsTypedTextStorage.active.delete(source);
    }
    else if (!oldState) {
      questionsTypedTextStorage.active.add(source);
    }
    var newState = questionsTypedTextStorage.active.has(source)
    console.assert(newState != oldState, "state never changed after click")
    this.syncDisplay();
    console.log(questionsTypedTextStorage.active)
  },

  showHide: function() {
    init = $("#" + "questions_type_init")
    preview = $("#" + "questions_text_preview_container")
    if (this.questionsData["typedQuestionsData"].length > 0) {
      init.addClass("w3-hide");
      preview.removeClass("w3-hide");
      $("#" + "questions_typed_submit").removeClass("w3-hide");
    } else {
      init.removeClass("w3-hide");
      preview.addClass("w3-hide");
      $("#" + "questions_typed_submit").addClass("w3-hide");
    }
  },
  switchText: function(element) {
    childrens = $(element).children();
    childrens.toggleClass("w3-hide")
  }
}

$(document).ready(function() {
  questionsTypedTextDisplay.syncDisplay();

  $("#" + "questions_adding_button").on('click', function() {
    var input = $("#" + "questions_type_text_input")
    var inputValue = input.val();
    if (questionsTypedTextStorage.isValid(inputValue)) {
      questionsTypedTextDisplay.addQuestions(inputValue)
      input.val("")
      questionsTypedTextDisplay.hideInlineAlert();
    }
    else if (questionsTypedTextStorage.isAvail(inputValue)) {
      var alertOneObj = {
        text: "Duplicates queries not allowed. Enter a unique query to add more queries.",
        type: "danger"
      }
      questionsTypedTextDisplay.showInlineDoubleAlert(alertOneObj, undefined, false);
    }
  });

  $("#questions_typed_submit").on('click', function() {
    questionsTypedClient.sendTyped()
  });
});
