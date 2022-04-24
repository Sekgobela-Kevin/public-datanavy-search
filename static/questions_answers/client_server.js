"use strict";

function sendForm(url, formID, sucessCall, failCall) {
  $("#" + formID).submit(function(e) {
    e.preventDefault();
    data = new FormData(e);
    return $.ajax({
      url: url,
      data: data,
      cache: false,
      processData: false,
      contentType: false,
      type: 'POST',
      success: sucessCall,
      error: failCall
    });
  });
}


function sendLocalFile(URL, file, successCall, failCall, completeCall) {
  var data = new FormData();
  data.append(file.name, file);
  return $.ajax({
    url: URL,
    data: data,
    cache: false,
    processData: false,
    contentType: false, // NEEDED, DON'T OMIT THIS (requires jQuery 1.6+)
    timeout: 500000, //timeout of a 5 minute
    type: 'POST',
    context: data,
    success: successCall,
    error: failCall,
    complete: completeCall
  });
}

function sendJSON(URL, object, successCall, failCall, completeCall) {
  return $.ajax({
    url: URL,
    data: JSON.stringify(object),
    contentType: "application/json",
    cache: true,
    processData: false,
    type: 'POST',
    success: successCall,
    error: failCall,
    context: object,
    complete: completeCall
  });
}
