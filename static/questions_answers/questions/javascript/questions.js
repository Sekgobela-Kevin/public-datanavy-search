function includeQuestionsHTML() {
  $("#questions_type").load('static/questions_answers/questions/html/typed_text.html')
  //$("#questions_local_files").load('static/questions_answers/questions/html/local_files.html')
  //$("#questions_URLs").load('static/questions_answers/questions/html/URLs.html')
}

$(document).ready(function() {
  includeQuestionsHTML()
  //questions/queries section and its view navigation item hidden by default
  $('#questions-tabs-container, #questions-upload-nav-item').hide();
});
