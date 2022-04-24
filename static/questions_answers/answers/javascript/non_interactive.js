"use strict";

/*$(document).ready(function(){
   includeAnswersHTML();
});
*/

var answersDisplay = {

  getScope:  function(){
      return angular.element($("#answers_enclosing_container")).scope();
  },

  showInlineAlert: function(title, text, type, alertClass, isInteractive, makeVisible=true) {
    //inline alert is shon with new text
    console.assert(alertClass !== undefined, "alertClass is undefined");
    console.assert(alertClass !== undefined, "alertClass is undefined");
    if (isInteractive === true) {
      var query = "#answers-single-alert";
    } else {
      var query = "#answers-multiple-alert";
    }
    if (alertClass === "alert-all") {
      $(query + " div.alert-one").show();
      $(query + " div.alert-two").show();
    } else {
      inlineAlert(query, title, text, type, alertClass);
    }
    if (makeVisible) {
      $("#answers-upload-nav-item").click();
    }

  },

  showInlineDoubleAlert: function(alertOneObj, alertTwoObj, isInteractive, isDouble = true, makeVisible=true) {
    console.assert(alertOneObj !== undefined, "alertOneObj is undefined");
    console.assert(isInteractive !== undefined, "isInteractive is undefined");
    this.showInlineAlert(alertOneObj.title, alertOneObj.text, alertOneObj.type, "alert-one", isInteractive, makeVisible);
    if (isDouble) {
      console.assert(alertTwoObj !== undefined, "alertTwoObj is undefined");
      this.showInlineAlert(alertTwoObj.title, alertTwoObj.text, alertTwoObj.type, "alert-two", isInteractive, makeVisible);
    } else {
      //this.hideInlineAlert("alert-two", isInteractive);
    }
  },


  hideInlineAlert: function(isInteractive, alertClass = "alert-one") {
    console.assert(alertClass !== undefined, "alertClass is undefined");
    console.assert(isInteractive !== undefined, "isInteractive is undefined");
    if (isInteractive === true) {
      var query = "#answers-single-alert";
    } else {
      var query = "#answers-multiple-alert";
    }
    if (alertClass === "alert-all") {
      $(query + " div.alert-one").hide();
      $(query + " div.alert-two").hide();
    } else {
      $(`${query} div.${alertClass}`).hide(500);
    }
  },


  syncAngularAnswersData: function(isInteractive, withinId) {
    console.assert(isInteractive !== undefined, "isInteractive is undefined");
    if (isInteractive) {
      this.getScope().updateAnswersSingleData();
    } else {
      this.getScope().updateAnswersData();
    }
  },


  showHide: function(initialID, afterID, executeOptional=true) {
    if (executeOptional) {
      this.hideInlineAlert(true);
    }
    const value = $("#answers-single-question-input").val().trim()
    if (value === "") {
      var alertOneObj = {
        text: "Please enter search query. Only keywords from the query will be\
        used when searching.",
        type: "info"
      }
      this.showInlineDoubleAlert(alertOneObj, undefined, true, false, false);
    }
  },


  updateProgressBar: function(elementId, value, total) {
    updateProgressBar("#"+elementId, value, total)
  },

  updateProgressBarText: function(elementId, text) {
    updateProgressBarText("#"+elementId, text);
  },

  updateProgressBarSentiment: function(elementId, isPositive) {
    updateProgressBarSentiment("#"+elementId, isPositive)
  },



}

var answersClient = {
  /*{questions:[], knowledges:[]}*/
  Url: location.protocol + '//' + location.host + location.pathname + "answers/non-interactive/results",
  processingKnowledgesRequestsMap: {},//{source: requestObj}

  interactiveScope: {
    progressBarId: "answers_single_progress_bar",
    searchButtonId: "answers-single-search-button",
    status: false
  },

  nonInteractiveScope: {
    progressBarId: "answers_non_interactive_progress_bar",
    searchButtonId: "answers_non_interactive_load_buttons",
    status: false
  },


  getActiveQuestions: function() {
    //method not belonging to this object
    var questions = questionsTypedTextStorage.getActiveSources();
    console.assert(questions !== undefined, "questions is undefined")
    return questions;
  },

  requestKnowledgeProcessing: function(sources, completeCall, completedCall){
    var self = this;
    var url =  location.protocol + '//' + location.host + location.pathname + "/knowledge/process";
    const readySources  = Array.from(difference(new Set(sources), Knowledges.processedKnowledges));
    console.assert(readySources!==undefined, "readySources is undefined");
    var sentSources = new Set();
    var completedSources = new Set();
    var statuses = new Set();
    var responceData = new Set();
    var completedCalled = false;

    function complete(data, status, error) {
      //alert(this[0] + " just completed")
      completedSources.add(this[0]);
      responceData.add("empty");
      statuses.add(status);
      completeCall(this[0], sentSources, completedSources);
      console.assert(sentSources.size >= completedSources.size, `size mis-match sent ${sentSources.size}, completed ${completedSources.size}`)
      if (sentSources.size === completedSources.size) {
        if (!completedCalled) {
          completedCall(sentSources, completedSources, statuses);
          completedCalled = true;
        }
      }
    }

    function success(data, status) {
      //probanility
      var sources = JSON.parse(data);
      $.each(sources, function(index, source) {
        Knowledges.processedKnowledges.add(source);
      })
    }

    if (readySources.length > 0) {
      $.each(readySources, function(index, source) {
        var request = sendJSON(url, [source], success, undefined, complete);
        sentSources.add(source)
      });
    }
  },

  requestKnowledgeProcessingAlt: function(sources, finishedCall){
    var self = this;
    const scope = this.interactiveScope;
    console.assert($("#" + scope.searchButtonId).length, "element not found");
    const readySources  = Array.from(difference(new Set(sources),
    Knowledges.processedKnowledges));


    $("#answers-upload-nav-item > .fa-stack").children().toggle();
    $("#" + scope.searchButtonId).attr('disabled', 'disabled');

    if (readySources.length === 0) {
      finishedCall();
      return;
    }
    else {
      firstCall();
    }

    function firstCall() {
      const progressText = `Preparing for resources processing and saving:
      '${readySources[0]}'`;
      answersDisplay.updateProgressBarText(scope.progressBarId, progressText);
      answersDisplay.updateProgressBar(scope.progressBarId, 0.7, readySources.length);

      const alertOneText = `Please wait while processing ${readySources.length} search resources for performance optimization`;
      const alertOneObj = {text: alertOneText, type:"warning"};
      answersDisplay.showInlineDoubleAlert(alertOneObj, undefined, true, false);
    }

    function completeCall(source, sentSources, completedSources, statuses) {
      const text = `Just processed and saved '${source}'`;
      answersDisplay.updateProgressBarText(scope.progressBarId, text);
      answersDisplay.updateProgressBar(scope.progressBarId, completedSources.size, sentSources.size);
    }
    function completedCall(sentSources, completedSources, statuses) {
      if (scope.status === false) {
        answersDisplay.showHide();
        if (sentSources.size) {
          finishedCall();
          const alertOneText = `Just finished processing resources`;
          const alertOneObj = {text: alertOneText, type: "info"};
          answersDisplay.showInlineDoubleAlert(alertOneObj, undefined, true, false);
        }
        else{
          const alertOneText = `Failed to process resources, May be caused by (Array.from(statuses).join(', '))`;
          const alertOneObj = {text: alertOneText};
          answersDisplay.showInlineDoubleAlert(alertOneObj, undefined, true, false);
        }

      }
    }
    this.requestKnowledgeProcessing(sources, completeCall, completedCall);
  },

  sendSingle: function(question, knowledgeSources, success, error, complete) {
    console.assert(question !== undefined, "question is undefined")
    console.assert(knowledgeSources !== undefined, "knowledgeSources is undefined")
    var queryObj = {
      //server expect questions as array
      questions: [question],
      knowledges_sources: knowledgeSources
    };
    if (!success) {
      var success = this.successURLsCall
    }
    if (!error) {
      var error = this.errorURLsCall
    }
    sendJSON(this.Url, queryObj, success, error, complete);
  },

  sendMultiple: function(questions, knowledgeSources, sucess, fail, complete, afterSend) {
    var self = this;
    $.each(questions, function(index, question) {
      self.sendSingle(question, knowledgeSources, sucess, fail, complete);
      afterSend();
      //You can check certain conditions here
    });
  },

  sendMultipleAdvanced: function(questions, knowledgeSources, isInteractive, completed) {
    console.assert(questions !== undefined, "questions is undefined");
    console.assert(knowledgeSources !== undefined, "knowledgeSources is undefined");
    console.assert(isInteractive !== undefined, "interactive is undefined");

    if (completed === undefined) {
      var completed = function() {}
    }

    if (isInteractive) {
      var scope = this.interactiveScope
    } else {
      var scope = this.nonInteractiveScope;
    }

    if (questions.length > 0) {
      console.assert(scope !== undefined, "scope is undefined");
      if (!isInteractive) {
        $("." + scope.searchButtonId).attr('disabled', 'disabled');
      } else {
        $("#" + scope.searchButtonId).attr('disabled', 'disabled');
      }
    }

    console.assert(scope != undefined, "scope is undefined")

    scope.totalSentRequests = 0;
    scope.totalCompletedRequests = 0;
    scope.totalSucessRequests = 0;
    scope.sucessServerData = {};

    function clear() {
      scope.totalSentRequests = 0;
      scope.totalCompletedRequests = 0;
      scope.totalSucessRequests = 0;
      scope.sucessServerData = {};
      scope.status = false;
    }

    function sucess(data, status, error) {
      console.assert(data, "server responsed with data that resembles undefined");
      scope.totalSucessRequests += 1;
      scope.sucessServerData = {
        ...scope.sucessServerData,
        ...JSON.parse(data)
      };
      var question = answersStorage.getQuestions(JSON.parse(data))
      var text = `sucessfully searched: '${question}'`
      answersDisplay.updateProgressBarSentiment(scope.progressBarId, true);
      answersDisplay.updateProgressBarText(scope.progressBarId, text);
    }

    function error(data, status, error) {
      var text = "error occured while searching for answer: " + status;
      answersDisplay.updateProgressBarSentiment(scope.progressBarId, false);
      answersDisplay.updateProgressBarText(scope.progressBarId, text);
    }

    function complete(data, status, error) {
      //complete is called even if all requests are completed(bug)
      scope.totalCompletedRequests = scope.totalCompletedRequests + 1;
      console.assert(scope.totalCompletedRequests <= scope.totalSentRequests, "completed request are greater than sent requests, may be caused by sending requests while other requests not completed. Please disable searcg button while sending to server.");
      console.assert(scope.totalSentRequests <= questions.length)
      answersDisplay.updateProgressBar(scope.progressBarId, scope.totalCompletedRequests, scope.totalSentRequests);
      //var text = "just completed searching of answer(fail/sucess)";
      //answersDisplay.updateProgressBarText(text);
      if (scope.totalCompletedRequests === scope.totalSentRequests) {
        if (scope.totalSucessRequests > 0) {
          if (isInteractive) {
            answersStorage.setInteractiveAnswers(scope.sucessServerData);
            answersDisplay.syncAngularAnswersData(true, "answers_enclosing_container");

          } else {
            answersStorage.setNonInteractiveAnswers(scope.sucessServerData);
            answersDisplay.syncAngularAnswersData(false, "answers_enclosing_container");
          }
        }
        else{
          const alertOneText = `Search failed, Please check if you have sufficient internet connection.`;
          const alertOneObj = {text: alertOneText};
          answersDisplay.showInlineDoubleAlert(alertOneObj, undefined, true, false);
        }

        clear();
        completed(data, scope.totalSentRequests, scope.totalCompletedRequests, scope.totalSucessRequests);


        answersDisplay.updateProgressBarText(scope.progressBarId, "Finished searching for answers");

        if (!isInteractive) {
          $("." + scope.searchButtonId).attr('disabled', false);
        } else {
          $("#" + scope.searchButtonId).attr('disabled', false);
        }

        const searchButton = $("#answers-single-search-button");
        searchButton.children().not(".search-text").toggle();
        $("#answers-upload-nav-item > .fa-stack").children().toggle();
        return;
      }
    }


    function afterSend(question) {
      scope.totalSentRequests += 1;
      var text = `sending '${question}' search query to the server`;
      //answersDisplay.updateProgressBar(scope.totalSentRequests*30, questions.length)
      if (scope.totalCompletedRequests === 0) {
        answersDisplay.updateProgressBar(scope.progressBarId, 0.5, scope.totalSentRequests)
        answersDisplay.updateProgressBarText(scope.progressBarId, text);

        const searchButton = $("#answers-single-search-button");
        searchButton.children().not(".search-text").toggle();
        //check if all questions sent(queries)
        if (scope.totalSentRequests === questions.length) {
          answersDisplay.updateProgressBarText(scope.progressBarId, "just finished sending questions");
          //emulate loading
          answersDisplay.updateProgressBarText(scope.progressBarId, "Preparing for searching");
          scope.status = true;
        }
      }

    }
    this.sendMultiple(questions, knowledgeSources, sucess, error, complete, afterSend);

  },

  send: function(isInteractive, complete) {
    console.assert(isInteractive !== undefined, "isInteractive is undefined");
    var self = this;
    if (isInteractive) {
      //server expect array data
      var value = $("#answers-single-question-input").val().trim()
      if (value.length === 0) {
        var alertOneObj = {
          text: "You were supposed to enter search query before searching",
          type: "danger"
        }
        answersDisplay.showInlineDoubleAlert(alertOneObj, undefined,
           isInteractive, false);
        return;
      }
      var activeQuestions = [$("#answers-single-question-input").val()]
    } else {
      var activeQuestions = this.getActiveQuestions();
      if (activeQuestions.length === 0) {
        var questionsLength = questionsTypedTextStorage.getTypedQuestions().length;
        if (questionsLength === 0) {
          var alertOneText = "Not even a single query was found for performing a search."
          var alertTwoText = "Please visit queries section of the application and add queries for multiple searches or use single search on left(recommended)";
        } else {
          var alertOneText = `${questionsLength} queries detected, but all of them are disabled. Disabled queries are not included within multiple search.`
          var alertTwoText = "Please visit queries section of the application and enable queries you want be part of search or use single search on left(recommended)";

        }
        var alertOneObj = {
          text: alertOneText,
          type: "danger"
        }
        var alertTwoObj = {
          text: alertTwoText,
          type: "info"
        }
        answersDisplay.showInlineDoubleAlert(alertOneObj, alertTwoObj, false);
        return;
      }
    }
    console.assert(activeQuestions !== undefined, "activeQuestions is undefined")

    var activeKnowledgesSources = Knowledges.getActiveExtractedSources();
    var allSources = Knowledges.getAllSources()
    var extractedSources = Knowledges.getExtractedSources()
    console.assert(activeKnowledgesSources != undefined, "activeKnowledgesSources is undefined");
    console.assert(allSources != undefined, "allSources is undefined");

    const searchAll = answersDisplay.getScope().dataMap["singleFutureSettings"].searchAll;
    console.assert(searchAll!==undefined, "searchAll is undefined");
    var sendSources;
    if (searchAll) {
      sendSources = extractedSources;
    }
    else {
      sendSources = activeKnowledgesSources;
    }
    if (sendSources.length > 0) {
      this.requestKnowledgeProcessingAlt(sendSources, function(){
          self.sendMultipleAdvanced(activeQuestions, sendSources, isInteractive, complete);
      })
    } else {

      if (allSources.length === 0) {
        var alertOneText = "Not even a single resource was detected for performing a search."
        var alertTwoText = "Please visit resources section of the application and add resources which could webpages, files or text.";
      } else if (extractedSources.length == 0) {
        var alertOneText = `${allSources.length} resources detected, but  not even single resource is submited and ready for a search. Resources not ready for search are not included when searching.`;
        var alertTwoText = "Please visit resources section of the application and submit resources. Also ensure that they are ready for a search right after submission.";
      } else if (extractedSources.length > 0) {
        var alertOneText = `${extractedSources.length} ready and submited resources detected, but they are disabled. Disabled resources are not included within a search.`;
        var alertTwoText = "Please visit resources section of the application and enable resources that should be part of search especially submited and ready ones.";
      } else {
        //will not be executed most of the time
        var alertOneText = `${allSources.length} resources detected, but all of them are disabled. Disabled resources are not included within a search.`
        var alertTwoText = "Please visit resources section of the application and enable resources that should be part of search";
      }
      var alertOneObj = {
        text: alertOneText,
        type: "danger"
      }
      var alertTwoObj = {
        text: alertTwoText,
        type: "info"
      }
      answersDisplay.showInlineDoubleAlert(alertOneObj, alertTwoObj, isInteractive, false);
      return;
    }
  }
}


$(document).ready(function() {



  //beaware of two clicks as the class is used by two elements
  $(document).on('click', ".answers_non_interactive_load_buttons", function() {
    //show answers when ready
    answersDisplay.showHide();
    if (answersClient.nonInteractiveScope.status === false) {
      answersClient.send(false);
    }
  });

  $(document).on('click', ".answer-display :first-child", function() {
    $(this).next().toggleClass("w3-hide");
  });



});
