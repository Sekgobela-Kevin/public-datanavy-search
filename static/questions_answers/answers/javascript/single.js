"use strict";


$(document).ready(function(){

  $(document).on('click', "#answers-single-search-button", function() {
    //show answers when ready
    if (answersClient.interactiveScope.status === false) {
      answersClient.send(true);
    }
  });

  $(document).on("input", "#answers-single-question-input", function() {
    //sync with display
    answersDisplay.showHide(undefined, undefined, true);
  });


  //delegating technique
   $(document).on('click', "#answers_enclosing_container .w3-modal", function(){
    console.assert($("#answers_enclosing_container").find('.w3-modal').length, 'not found')
    if (Object.isMobileDevice()) {
      $(this).hide();
    }
  });

});
