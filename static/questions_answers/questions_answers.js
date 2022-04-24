"use strict";

//angularjs
var app = angular.module("navyApp", ['ngSanitize']);

app.controller("navyCtrl", function ($scope) {
  //$scope.nonInteractiveAnswersData = answersDisplay.getData();
  $scope.name = "I am navyCtrl";
});

app.controller("answersCtrl", function ($scope, $http) {
  //js objects
  $scope.Object = Object;
  $scope.Array = Array;
  $scope.knowledgesObj = Knowledges;

  //stores settings used for search
  //these settings are client oriented
  $scope.dafaultSettings = {
    minRelevance: 50,
    searchAll: false,
    maxResults: 100000,
    firstOnly: false,
    viewResults: 4
  }

  // ------ search data -------
  $scope.answersData = [];
  $scope.answersSingleData = [];

  $scope.dataMap = {
    singleFutureResourcesSources: {},
    singlePresentResourcesSources: {},
    singleFutureQueriesAnalysis: {},
    singlePresentQueriesAnalysis: {},
    singlePresentQueriesAnalysis: {},
    singlePresentSettings: $scope.dafaultSettings,
    singleFutureSettings: $scope.dafaultSettings
  };


  $scope.getKnowledgesObj = function () {
    return Knowledges;
  };

  $scope.syncSettings = function (type) {
    console.assert(type !== undefined, "type is undefined");
    console.assert(type in $scope.dataMap, `${type} type not in dataMap`);
    if (type === "singleFutureSettings") {
      var settingsModal = $(".single-future-settings-modal");
    } else if (type === "singlePresentSettings") {
      var settingsModal = $(".single-present-settings-modal");
    } else {
      console.assert(false, `function not capable for processing type '${type}'`);
    }
    settingsModal.find('.min-relevance').val($scope.dataMap[type].minRelevance);
    settingsModal.find('.first-results').prop('checked', $scope.dataMap[type].firstOnly);
    settingsModal.find('.all-resources').prop('checked', $scope.dataMap[type].searchAll);
    settingsModal.find('.max-results').val($scope.dataMap[type].maxResults);
    settingsModal.find('.view-results').val($scope.dataMap[type].viewResults);

  }

  $scope.updateSettings = function (type, formValid) {
    console.assert(type !== undefined, "type is undefined");
    console.assert(formValid !== undefined, "formValid is undefined");
    console.assert(type in $scope.dataMap, `${type} type not in dataMap`);

    if (type === "singleFutureSettings") {
      var settingsModal = $(".single-future-settings-modal");
    } else if (type === "singlePresentSettings") {
      var settingsModal = $(".single-present-settings-modal");
    } else {
      console.assert(false, `function not capable for processing type '${type}'`);
    }


    if (formValid) {
      var minRelevancevalue = parseInt(settingsModal.find('.min-relevance').val());
      var firstOnlyValue = settingsModal.find('.first-results:checked').length > 0;
      var searchAllValue = settingsModal.find('.all-resources:checked').length > 0;
      var maxResultsValue = parseInt(settingsModal.find('.max-results').val());
      var viewResultsValue = parseInt(settingsModal.find('.view-results').val());
      var firstOnly = settingsModal.find('.first-only:checked').length > 0;
      $scope.dataMap[type] = {
        minRelevance: minRelevancevalue,
        firstOnly: firstOnlyValue,
        maxResults: maxResultsValue,
        viewResults: viewResultsValue,
        searchAll: searchAllValue
      };
      settingsModal.hide(1000);
    }
    if (type === "singleFutureSettings") {
      //assign future settings to present as users would be expecting
      $scope.dataMap.singlePresentSettings = $scope.dataMap["singleFutureSettings"]
    }
    //update results incase they were changed/altered
    if ($scope.answersSingleData.length) {
      $scope.updateAnswersSingleData(false);
    }
  }

  $scope.updateQueriesAnalysis = function (type, queries) {
    console.assert(type !== undefined, `type is undefined`);
    console.assert(type in $scope.dataMap, `${type} type not in dataMap`);

    if (type === "singleFutureQueriesAnalysis") {
      var modal = $(".single-future-query-analysis-modal");
      var value = $("#answers-single-question-input").val()
    } else if (type === "singlePresentQueriesAnalysis") {
      console.assert(queries !== undefined, `queries is undefined`);
      var value = queries;
      var modal = $(".single-present-query-analysis-modal");
    } else {
      console.assert(false, `function not capable for processing type '${type}'`);
    }

    var loader = modal.find(".loader");
    console.assert(loader.length, "loader element not found");
    var lastkeys = new Set(Object.keys($scope.dataMap[type]))

    modal.find(".contents").hide();
    modal.find(".no-query").hide();
    modal.find(".error").hide();
    loader.hide();

    function modifyResponceData(response) {
      var outputs = {}
      $.each(response.data, function (query, wordsData) {
        var output = {
          keywords: [],
          wordsData: wordsData
        }
        $.each(wordsData, function (index, wordData) {
          if (wordData.is_keyword) {
            output.keywords.push(wordData.word);
          }
        });
        const queryTextHihlihted = $scope.replaceWords(query, output.keywords,
          function (word) {
            return $scope.addTag(word, "strong", "class='w3-text-black' title='Search keyword'");
          })
        output["queryTextHihlihted"] = queryTextHihlihted;
        outputs[query] = output;
      });
      response.data = outputs
      return response;
    }

    var changeDetected = difference(new Set([value]), lastkeys).size > 0;

    if (value.trim().length != 0 && changeDetected) {
      loader.show();
      $http({
        method: "POST",
        url: "/en/analysis",
        data: [value]
      }).then(function mySuccess(response) {
        $scope.dataMap[type] = modifyResponceData(response).data;
        modal.find(".contents").show();
        loader.hide();
      }, function myError(response) {
        loader.hide();
        modal.find(".error").show();
      });
    } else if (!changeDetected) {
      modal.find(".contents").show();
    } else if (value.trim().length == 0) {
      modal.find(".no-query").show();
    } else {
      console.assert(false, "function cannot decide");
    }
  };


  $scope.updateResourcesSources = function (type, sources) {
    console.assert(type !== undefined, `type is undefined`);
    console.assert(sources !== undefined || type === "singleFutureResourcesSources", `sources is undefined`);
    console.assert(type in $scope.dataMap, `${type} type not in dataMap`);

    if (type === "singleFutureResourcesSources") {
      $scope.dataMap[type] = [];
      // for all ready knowledges
      //depending on search settings
      const searchAll = $scope.dataMap["singleFutureSettings"].searchAll
      console.assert(searchAll !== undefined, "searchAll is undefined");
      var sourcesData;
      if (searchAll) {
        sourcesData = Knowledges.getExtractedSources(true)
      } else {
        sourcesData = Knowledges.getActiveExtractedSources(true)
      }
      $.each(sourcesData, function (source, data) {
        $scope.dataMap[type].push(data);
      });
    } else if (type === "singlePresentResourcesSources") {
      //optimize here
      $scope.dataMap[type] = [];
      $.each(Knowledges.getKnowledgesData(sources), function (source, data) {
        $scope.dataMap[type].push(data);
      });
    } else {
      console.assert(false, "function cannot decide");
    }

  };

  $scope.forceUpdate = function () {
    $scope.$apply();
  };


  $scope.updateAnswersSingleData = function (isNewSearch = true) {
    answersDisplay.showHide(); //sync with display(callback)
    /*$scope.answersSingleData represent filtered answers while
     local varible originalSingleAnswers represent non filtered(raw from server)*/
    //answersStorage.getInteractiveAnswers() gives access to responce data from server
    const originalAnswers = answersStorage.getInteractiveAnswers();
    //originalSingleAnswers may not have some attributes of object of  $scope.answersSingleData as it was not modified
    const originalSingleAnswers = Object.values(originalAnswers)[0]
    const originalSingleTotalRecommends = $scope.getTotalRecommends(originalSingleAnswers["recommends"]);
    const originalSingleRelevance = parseInt(originalSingleAnswers.relevance * 100).toFixed(0);
    const searchedresources = originalSingleAnswers["searched_knowledges"];
    

    if (isNewSearch) {
      $scope.dataMap.singlePresentQueriesAnalysis = $scope.dataMap.singleFutureQueriesAnalysis
      $scope.dataMap.singlePresentSettings = $scope.dataMap.singleFutureSettings
      $scope.updateResourcesSources("singlePresentResourcesSources", searchedresources);
    }

    $scope.answersSingleData.length = 0;
    var settings = $scope.dataMap.singlePresentSettings;
    console.assert(settings !== undefined, "settings is undefined");


    $.each(originalAnswers, function (question, answer) {
      var maxResultsFiltered = answer["recommends"].slice(0, settings.maxResults);
      var relevanceFiltered = $scope.filterRecommendsByRelevance(maxResultsFiltered, settings.minRelevance);
      var groupedRecommends = sliceIntoChunks(relevanceFiltered, settings.viewResults);
      if (settings.firstOnly) {
        groupedRecommends = [groupedRecommends[0]];
      }
      console.assert(groupedRecommends !== undefined, "chunkRecommends is undefined");
      //"activeRecommends" key hold recommends chuck that will be displayed
      var newAnswer = Object.assign(answer, {
        "question": question,
        "groupedRecommends": groupedRecommends,
        "activeRecommends": 0
      });
      $scope.answersSingleData.push(newAnswer);
    });

    /*if ($scope.getSingleAnswerObj()["groupedRecommends"].length === 0) {
      alertContainer.find(".nothing").show(1);
    } else {
      alertContainer.find(".nothing").hide(1);
    }*/

    if (isNewSearch) {
      $scope.$apply();
    }

    var text;
    //true if no results meaning search failed to find results
    if (originalSingleTotalRecommends === 0) {
      if(searchedresources.length > 0){
          text = "Your query did not match anything from resources. Please optimize your search query or include more search resources.";
      }
      else{
          //resources probably deleted at server
          Knowledges.serverClientSync();
          text = "Something went wrong at our side but just got fixed. Try searching again to see if problem is really fixed.";
      }
    } else if (originalSingleRelevance < settings.minRelevance) {
      var text2 = `min relevance currently is ${settings.minRelevance}% while\
       search results has max relevance of ${originalSingleRelevance}%.\
       Please change min relevance within search/results settings to be  ${originalSingleRelevance}% or less.`;
      text = `${originalSingleTotalRecommends} results detected but filtered by currrent search settings. ${text2}`;
    } else {
      const alertOneObj = {
        text: `Search completed sucessfully with\
       ${originalSingleTotalRecommends} results.`,
        type: "info"
      }
      answersDisplay.showInlineDoubleAlert(alertOneObj, undefined, true, false);
    }

    if (text !== undefined) {
      answersDisplay.showInlineDoubleAlert({
        text: text
      }, undefined, true, false);
    }
  };

  $scope.getPaginationClass = function (classNumber) {
    if ($scope.getSingleAnswerObj().activeRecommends === classNumber) {
      return "w3-green";
    }
    return ""
  };


  $scope.copyRecomentToClipBoard = function (recommend) {
    console.assert(recommend !== undefined, "recommend is undefined");
    const data = $scope.extractRecommendData(recommend);
    var text = data.fullText;
    copyToClipBoard(text.replaceAll('\n', " "));
  };


  $scope.getAnsweredAnswers = function (answerData) {
    console.assert(answerData !== undefined, "answerData maps to undefined");
    var filterd = answerData.filter(function (answer) {
      return answer["recommends"].length !== 0;
    });
    return filterd;
  };

  $scope.filterRecommendsByRelevance = function (recommends, min, max = 100) {
    console.assert(recommends !== undefined, "recommends maps to undefined");
    console.assert(min !== undefined, "min maps to undefined");
    var filtered = recommends.filter(function (recommend) {
      return recommend.relevance * 100 >= min && recommend.relevance * 100 <= max;
    });
    return filtered;
  };

  $scope.getTotalAnswered = function (answerData) {
    console.assert(answerData !== undefined, "answerData maps to undefined");
    return $scope.getAnsweredAnswers(answerData).length;
  };

  $scope.getTotalRecommends = function (recommends) {
    return recommends.length;
  };

  $scope.getRecommendsAverageRelevance = function (recommends) {
    var relevancesSum = 0;
    $.each(recommends, function (index, recommend) {
      relevancesSum += recommend["relevance"];
    });
    return relevancesSum / recommends.length
  };

  $scope.getAnswersAverageRelevance = function () {
    var answers = $scope.answersData;
    var relevancesSum = 0;
    $.each(answers, function (index, answer) {
      relevancesSum += answer["relevance"];
    });
    return relevancesSum / answers.length;
  };


  $scope.getSingleAnswerObj = function () {
    var answer = {};
    if ($scope.answersSingleData.length > 0) {
      var answer = $scope.answersSingleData[0];
    }
    console.assert(answer !== undefined, "answer is undefined");
    return answer;
  };

  $scope.getActiveRecommends = function (answerObj) {
    console.assert(answerObj !== undefined, "answerObj is undefined");
    if (Object.keys(answerObj).length === 0) {
      //empty recommends empty answer object
      return [];
    }
    var activeIndex = answerObj["activeRecommends"];
    console.assert(activeIndex !== undefined, "activeIndex is undefined");
    var recommends = answerObj['groupedRecommends'][activeIndex];
    console.assert(recommends, "recommends is undefined");
    return recommends;
  }

  $scope.getRecommendsPaginationIndexes = function (answerObj, size = 5) {
    var groupedRecommends = answerObj.groupedRecommends.length
    return getSurrounding(answerObj.activeRecommends, 0, answerObj.groupedRecommends.length, size);
  };

  $scope.setActiveRecommends = function (answerObj, value) {
    console.assert(answerObj !== undefined, "answerObj is undefined");
    console.assert(value >= 0, `{value} is less than zero(0)`);

    var active = answerObj.activeRecommends;
    answerObj.activeRecommends = value;
    return answerObj.activeRecommends
  };

  $scope.setActiveRecommendsRelative = function (answerObj, offset = 1) {
    console.assert(answerObj !== undefined, "answerObj is undefined");
    var active = answerObj.activeRecommends;
    var active = active + offset;
    console.assert(active !== undefined, "active is undefined");
    console.assert(active >= 0 && active <= answerObj.groupedRecommends.length, `${active} array index is not part of groupedRecommends)`);
    $scope.setActiveRecommends(answerObj, active);
  };

  $scope.goToNextGroupedRecommends = function () {
    $(this).siblings().children().removeClass('w3-green');
    $(this).siblings().children('.' + (angular.element(this).scope().answer.activeRecommends + 2)).parent().children().addClass('w3-green');
  }

  $scope.goToPrevGroupedRecommends = function () {
    $(this).siblings().children().removeClass('w3-green');
    $(this).siblings().children('.' + (angular.element(this).scope().answer.activeRecommends - 2)).parent().children().addClass('w3-green');
  }

  $scope.goToGroupedRecommends = function () {
    $(this).siblings().children().removeClass('w3-green');
    $(this).siblings().children('.' + ($(this).scope().answer.activeRecommends)).parent().children().addClass('w3-green');
  }

  $scope.toggleGroupedRecommends = function () {
    var currentRecommends = $(this).parents('.answer-display').find('.recommends');
    var allRecommends = $('#non_interactive_answers_display_repeat_container').find('.recommends');
    allRecommends.not(currentRecommends).hide();
    currentRecommends.toggle();
  }

  $scope.getSource = function (recommend) {
    return recommend["knowledge_source"];
  };

  $scope.getKnowledgeText = function (source) {
    console.assert(source !== undefined, "source maps to undefined");
    return textKnowledgeStorage.getKnowledge(source);
  };



  $scope.getIndexText = function (text, index) {
    console.assert(text !== undefined, "text is undefined");
    console.assert(index !== undefined, "index is undefined");
    return text.slice(index[0], index[1] + 1)
  };

  $scope.getIndexesTexts = function (text, indexes) {
    console.assert(text !== undefined, "text is undefined");
    console.assert(indexes !== undefined, "indexes  is undefined");
    var texts = new Set();
    $.each(indexes, function (index, textIndex) {
      texts.add($scope.getIndexText(text, textIndex))
    });
    return Array.from(texts);
  };



  $scope.replaceWords = function (text, words, replaceCall) {
    var self = this;
    const prohibitedChar = "<>\"\'\\/";
    const prohibitedTokens = "<br> strong span div w3 class=\'w3-text-black\'\
    class=\"navy-answer-quote w3-yellow class=\"navy-answer-full-text w3-brown" +
      prohibitedChar;
    console.assert(text !== undefined, "text is undefined");
    console.assert(words !== undefined, "words  is undefined");
    if (!replaceCall) {
      var replaceCall = function (substring) {
        return substring;
      };
    }
    self.replaceText = text;
    $.each(words, function (index, word) {
      //you may check if word is not valid html but trust users
      //No need to search HTML(users)
      if (!prohibitedTokens.includes(word.trim())) {
        self.replaceText = self.replaceText.replaceAll(word, replaceCall(word));
      } else {
        self.replaceText
      }
    });
    return self.replaceText;
  };

  //possible alternave to replaceWords(best solution)
  /*function replaceChar(origString, replaceChar, index) {
    let newStringArray = origString.split("");

    newStringArray[index] = replaceChar;

    let newString = newStringArray.join("");

    return newString;
  }*/

  $scope.keywordsHeghLight = function (keyword) {
    //callback fuction
    return $scope.addTag(keyword, "strong", "class='w3-text-black' title='Search keyword'")
  };

  $scope.quoteTextHeghLight = function (quote) {
    //callback fuction
    var attrData = 'class="navy-answer-quote w3-yellow"'
    return $scope.addTag(quote, "span", attrData);
  };

  $scope.fullTextHeghLight = function (quote) {
    //callback fuction
    var attrData = 'class="navy-answer-full-text w3-brown"'
    return $scope.addTag(quote, "span", attrData);
  };


  $scope.extractRecommendData = function (recommend) {
    var knowledgeText = $scope.getKnowledgeText(recommend.knowledge_source);
    var fullText = $scope.getIndexText(knowledgeText, recommend.output_full);
    var quoteText = $scope.getIndexText(knowledgeText, recommend.output);
    var keywords = $scope.getIndexesTexts(knowledgeText, recommend.keywords);

    console.assert(knowledgeText !== undefined, "knowledgeText is undefined");
    console.assert(fullText !== undefined, "fullText is undefined");
    console.assert(quoteText !== undefined, "quoteText is undefined");
    console.assert(keywords !== undefined, "keywords are undefined");

    var data = {
      "knowledgeText": knowledgeText,
      "fullText": fullText,
      "quoteText": quoteText,
      "keywords": keywords
    };
    return data;

  }

  $scope.getFullTextWithHeighLight = function (recommend) {

    var recommendData = $scope.extractRecommendData(recommend);
    console.assert(recommendData, "recommendData maps to undefined");

    //used for heilighting full_text within knowledge text
    var fullTextHighLighted = $scope.replaceWords(recommendData.knowledgeText, [recommendData.fullText], $scope.fullTextHeghLight);
    console.assert(fullTextHighLighted != undefined, "fullTextHighLighted is undefined");

    //note that fullTextHighLighted is not connected to quoteTextighLighted
    var quoteTextighLighted = $scope.replaceWords(recommendData.fullText, [recommendData.quoteText], $scope.quoteTextHeghLight);
    console.assert(quoteTextighLighted != undefined, "quoteTextighLighted is undefined");

    var keywordsHighLighted = $scope.replaceWords(quoteTextighLighted, recommendData.keywords, $scope.keywordsHeghLight);
    console.assert(keywordsHighLighted != undefined, "keywordsHighLighted is undefined");

    //emergency code(but is doing well)
    var attrData = 'class="navy-answer-full-text w3-brown" style="display:inline"'
    var spanTagAdded = $scope.addTag(keywordsHighLighted, "div", attrData);
    return spanTagAdded.replaceAll("\n", "<br>");
  };


  $scope.getKnowledgeTextWithHeighLight = function (recommend) {
    console.assert(recommend !== undefined, "recommend is undefined");
    var recommendData = $scope.extractRecommendData(recommend);
    console.assert(recommendData, "recommendData maps to undefined");

    var fulltextIndex = recommend.output_full;

    const surround_text_limit = 5000
    var partBefore = recommendData.knowledgeText.slice(fulltextIndex[0]-10000, fulltextIndex[0]);
    var partAfter = recommendData.knowledgeText.slice(fulltextIndex[1] + 1, fulltextIndex[1]+10000);

    var fullTextHighLighted = $scope.getFullTextWithHeighLight(recommend);
    console.assert(fullTextHighLighted !== undefined, "fullTextHighLighted is undefined");

    //used for heilighting full_text within knowledge text
    var knowledgeTextHighLighted = '\n' + partBefore + fullTextHighLighted + partAfter + '\n';
    console.assert(knowledgeTextHighLighted !== undefined, "fullTextHighLighted is undefined");
    return knowledgeTextHighLighted.replaceAll("\n", "<br>");
  };


  $scope.addTag = function (text, tag, inTag = "") {
    return `<${tag} ${inTag}>${text}</${tag}>`;
  };


});

//________________________JQUERY UI_____________________________________//



app.controller("interactiveAnswersCtrl", function ($scope) {
  //$scope.nonInteractiveAnswersData = answersDisplay.getData();
  $scope.name = "I am interactiveAnswersCtrl";
});




function removeSomeChar(str) {
  var charObj = {
    ">": "&gt;",
    "<": "&lt",
    "&": "&amp;",
  };
  $.each(charObj, function (key, value) {
    str = str.replaceAll(key, value);
    return;
  });
  return str
}


function showTab(tab, bodyId, bodyClass) {
  var tabs = $("." + bodyClass);
  console.assert(tabs.length > 0, `${bodyClass} class didnt match any HTML element`);
  tabs.each(function () {
    if ($(this).attr("id") == bodyId) {
      $(this).removeClass("w3-hide");
    } else {
      $(this).addClass("w3-hide");
    }
  });
}

//hold setInterval handle for webpage loading
var loading_timer;


function finishedWebpageLoading() {
  //clear timer as loading succeeded
  clearInterval(loading_timer);
  const tutorialSection = $("#application-tutorial");
  const mainSection = $("#application-main");
  const mobileUnsupp = $("#global-modals > #mobile-unsupported");
  const introModal = $("#global-modals > #intro");

  $("#webpage-loader").parent(".w3-modal").hide();

  setTimeout(function () {
    if (Object.isMobileDevice()) {
      $(".navy-hide-small").hide();
      $(".navy-show-small").show();
    }

    if (Object.isMobileDevice()) {
      mobileUnsupp.show();
    } else if (true) {
      introModal.show();
    }
  }, 500)
}


$(document).ready(function () {

  const loadShow = $(".load-show");
  const webpageLoader = $("#webpage-loader").parent(".w3-modal");
  const tutorialSection = $("#application-tutorial");
  const mainSection = $("#application-main");
  const mobileUnsupp = $("#global-modals > #mobile-unsupported");
  const introModal = $("#global-modals > #intro");

  //remove w3.css classes(move to JQuery)
  loadShow.removeClass("w3-hide");
  webpageLoader.removeClass("w3-show");

  //use JQuery
  webpageLoader.show();
  tutorialSection.hide();
  loadShow.hide();

  //loading_timer is global variable
  loading_timer = setTimeout(function(){
    //show modal if webpage loading failed
    const loadFailModal = $("#global-modals > #page-load-fail");
    loadFailModal.show();
  }, 15000);

  $("#tutorial-nav-item").on("click", function () {
    tutorialSection.toggle();
    mainSection.toggle();
  })

  $("nav").children().not("#tutorial-nav-item").on("click", function () {
    tutorialSection.hide();
    mainSection.show();
  })

  $("form").submit(function (forms) {
    forms.preventDefault();
  });
  $("body").attr("width", window.width);

  var nav_element = $("nav")
  window.addEventListener('online', function () {
    nav_element.addClass("w3-deep-orange w3-text-black");
    nav_element.removeClass("w3-black w3-text-white");
  });

  window.addEventListener('offline', function () {
    nav_element.addClass("w3-black w3-text-white");
    nav_element.removeClass("w3-deep-orange w3-text-black");
  });

  $(window).on('beforeunload', function () {
    if (confirm()) {
      return true;
    } else {
      return false;
    }
  });

  $("#global-modals").find(".exit").click(function () {
    $(this).parents(".w3-modal").hide();
  })

  window.onclick = function (event) {
    const modalVisible = $(".w3-modal-content:visible");
    if (event.target == modalVisible.parent().get(0)) {
      modalVisible.parent().hide();
      const introModal = $("#global-modals > #intro");
      if (modalVisible.find(".unsupported-visibility").length) {
        setTimeout(function(){
          introModal.show(100);
        }, 500)
      }
    }
  }

  mobileUnsupp.find(".exit").on("click", function () {
    $(this).parents(".w3-modal").hide();
    setTimeout(function(){
      introModal.show(100);
    }, 500)
  });

});