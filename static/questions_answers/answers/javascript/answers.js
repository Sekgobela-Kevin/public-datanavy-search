"use strict";

/*function includeAnswersHTML(){
  $("#answers_non_interactive").load('static/questions_answers/answers/html/non_interactive.html')
  $("#answers_single").load('static/questions_answers/answers/html/non_interactive.html')
}
*/

$(document).ready(function() {
  //includeAnswersHTML();
  $(".section-bar > *").not(".collapse, .label").on('click', function() {
    const navBar = $(this).parent();
    if (!navBar.siblings(".sections:visible").length > 0) {
      $(this).siblings(".collapse").click();
    }
  });
});
