"use strict";

var knowledgeFilesStorage = {
  fileFormats: {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    text: "text/plain",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    //ppt: "application/vnd.ms-powerpoint"
  },
  knowledgeFiles: [],
  sentFileNames: [],
  questionsFiles: [],
  active: new Set(),
  fileSizeLimit: 15, //megabytes
  uploadLimit: 10,

  getFileSizeMB: function(fileObj) {
    return fileObj.size * 1e-6;
  },

  isFileSizeValid: function(file_obj) {
    console.assert(file_obj !== undefined, "file_obj is undefined");
    return this.getFileSizeMB(file_obj) <= this.fileSizeLimit;
  },

  uploadLimitReached: function() {
    return this.knowledgeFiles.length >= this.uploadLimit;
  },

  getActiveSources: function() {
    return Array.from(this.active);
  },

  getActiveState: function(source) {
    return this.active.has(source)
  },

  addToActive: function(source) {
    this.active.add(source);
  },

  isTextFile: function(file) {
    return file.type.includes('text/');
  },

  getSources: function(knowledges) {
    console.assert(knowledges !== undefined, "knowledges is undefined")
    var sources = []
    $.each(knowledges, function(index, value) {
      sources.push(value.name);
    });
    return sources
  },

  getAllSources: function() {
    return this.getSources(this.knowledgeFiles)
  },

  addToSent: function(arg, isSource=false) {
    console.assert(arg!==undefined, "arg is udefined");
    if (isSource) {
      this.sentFileNames.push(arg);
    }
    else {
      this.sentFileNames.push(arg.name);
    }
  },

  removeFromSent: function(file) {
    var self = this;
    $.each(this.sentFileNames, function(index, value) {
      if (value === file.name) {
        self.sentFileNames.splice(index, 1);
        return;
      }
    });
  },
  isFileSent: function(file) {
    if (this.sentFileNames.includes(file.name)) {
      return true;
    } else {
      return false;
    }
  },

  areAllFilesSent: function() {
    var self = this;
    var state = true;
    fileNames = this.getFilesNames();
    $.each(fileNames, function(key, value) {
      if (!self.sentFileNames.includes(value)) {
        state = false;
        return;
      }
    });
    if (this.sentFileNames.length === 0) {
      return false;
    } else {
      return state;
    }

  },

  getKnowledgeFiles: function() {
    return this.knowledgeFiles;
  },
  getQuestionsFiles: function() {
    return this.QuestionFiles;
  },
  getSupportedFormats: function() {
    return this.fileFormats;
  },

  isFormatValid: function(file) {
    if (this.isTextFile(file)) {
      return true;
    } else {
      var fileType = localFiles.getFileType(file)
      var isValid = Object.values(this.fileFormats).includes(fileType);
      console.assert(isValid != undefined, "isValid can only be boolean not undefined");
      return isValid;
    }
  },

  isAlreadyAvail: function(file) {
    var fileName = localFiles.getFileName(file);
    var filesNames = this.getFilesNames();
    return filesNames.includes(fileName);
  },

  addFilesToKnowledge: function(fileListObj) {
    var self = this;
    var unsupportedFilesCount = 0;
    var unsupportedFormats = new Set();
    var largeFileSizeCount = 0;
    var exceedUploadLimitCount = 0;
    var addedFiles = 0;
    $.each(fileListObj, function(key, value) {
      var isValidFormat = self.isFormatValid(value);
      var uploadLimitReached = self.uploadLimitReached();
      var isLarge = !self.isFileSizeValid(value);

      console.assert(isValidFormat !== undefined, "isValidFormat is undefined");
      console.assert(uploadLimitReached !== undefined, "uploadLimitReached is undefined");
      console.assert(isLarge !== undefined, "is_large is undefined");


      if (isValidFormat && !self.isAlreadyAvail(value) && !uploadLimitReached && !isLarge) {
        self.knowledgeFiles.push(value);
        knowledgeFilesStorage.addToActive(value.name);
        addedFiles += 1;
      } else if (!isValidFormat) {
        unsupportedFilesCount += 1;
        unsupportedFormats.add(value.name.split('.').pop());
      } else if (uploadLimitReached) {
        exceedUploadLimitCount += 1;
      } else if (isLarge) {
        largeFileSizeCount += 1;
      }
    });

    //update display after files adding
    knowledgeFilesPreview.syncDisplay(false);

    var unsupportedText = "";
    var largeFileText = "";
    var uploadLimitText = "";
    if (unsupportedFilesCount > 0) {
      var unsupportedText = unsupportedFilesCount + ` unsupported file(s) removed of type (${Array.from(unsupportedFormats).join(', ')}). Please convert the files to supported formats(pdf, docx, pptx, text).`;
    }
    if (exceedUploadLimitCount > 0) {
      var uploadLimitText = `${exceedUploadLimitCount} file(s) removed as they exceed load limit. Maximum of ${self.uploadLimit} files can be loaded in a session.`;
    }
    if (largeFileSizeCount > 0) {
      var largeFileText = `${largeFileSizeCount} file(s) removed they exceed file size of (${self.fileSizeLimit}) MB.`;
    }
    var text = `${largeFileText} ${uploadLimitText} ${unsupportedText}`;
    //trick and prediction
    if (unsupportedFilesCount > 0 || exceedUploadLimitCount > 0 || largeFileSizeCount > 0) {
      var alertOneObj = {
        text: text,
        type: "danger"
      }
      var alertTwoObj = {
        text: "To add the aboved removed files, you have to fix the issue(s) presented above. \n NOTE: You can disable a file by clicking the eye icon in the file preview. Disabled files/resources are not included within a search.",
        type: "info"
      }
      knowledgeFilesPreview.showInlineDoubleAlert(alertOneObj, alertTwoObj);
    }
    else{
      if(addedFiles){
          var alertOneObj = {
            text: `${addedFiles} files added, please submit them to start searching`,
            type: "success"
          }
          knowledgeFilesPreview.showInlineDoubleAlert(alertOneObj, {});
      }
      else{
          var alertOneObj = {
            text: `Files already added`,
            type: "danger"
          }
          knowledgeFilesPreview.showInlineDoubleAlert(alertOneObj, {});
      }
    }
  },

  removeFileFrom: function(file, files) {
    $.each(files, function(index, value) {
      if (localFiles.getFileName(file) === localFiles.getFileName(value)) {
        files.splice(index, 1);
        return;
      }
    });
    return -1;
  },

  removeFileByIndex: function(index) {
    this.knowledgeFiles.splice(index, 1);
    this.active.delete(this.knowledgeFiles[index])
    knowledgeFilesClient.abortRequest(this.knowledgeFiles[index]);
  },

  removeFileFromQuestions: function(file) {
    this.removeFileFrom(file, this.questionsFiles);
  },

  removeFileFromKnowledge: function(file) {
    this.removeFileFrom(file, this.knowledgeFiles);
    this.active.delete(file.name);
  },

  clearKnowledgeFiles: function() {
    this.knowledgeFiles = [];
    this.active.clear();
  },
  clearQuestionsFiles: function() {
    this.questionsFiles = [];
  },
  isEmpty: function() {
    if (this.knowledgeFiles.length === 0) {
      return true;
    } else {
      return false;
    }
  },
  getFilesNames: function() {
    var self = this;
    var filesNames = [];
    $.each(this.knowledgeFiles, function(index, value) {
      filesNames.push(value.name);
    });
    return filesNames
  },

  isFileReady: function(file) {
    console.assert(file !== undefined, "file is undefined");
    //non extracted files are ones that are ready for sending
    var isReady = !textKnowledgeStorage.knowledgeExists(file.name) && this.getActiveState(file.name);
    console.assert(isReady !== undefined, "isReady is undefined");
    return isReady;
  },


  getReadyFiles: function() {
    //used for sending(server) purposes
    var self = this;
    var readyFiles = []
    $.each(this.knowledgeFiles, function(index, file) {
      if (self.isFileReady(file)) {
        readyFiles.push(file);
      }
    })
    return readyFiles
  },

  activeReadyAvail: function() {
    //used for sending(server) purposes
    return this.getReadyFiles().length > 0;
  },

  getExtractedSources: function() {
    //Active means enabled
    var curentSources = new Set(this.getSources(this.knowledgeFiles));
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
    var allSources = new Set(this.getSources(this.knowledgeFiles));
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



var knowledgeFilesPreview = {
  /*filesData: [{
    name: "life sciences.pdf",
    size: "2 MB",
    format: "pdf"
  }],*/
  fileFormatIcons: {
    pdf: '<i class="fa fa-file-pdf-o"></i>',
    docx: '<i class="fa fa-file-word-o"></i>',
    text: '<i class="fa fa-file-text-o"></i>',
    pptx: '<i class="fa fa-file-powerpoint-o"></i>',
    ppt: '<i class="fa fa-file-powerpoint-o"></i>',
    unknown: '<i class="fa fa-question"></i>',
  },

  showInlineAlert: function(title, text, type, alertClass, makeVisible=true) {
    //inline alert is shon with new text
    console.assert(alertClass !== undefined, "alertClass is undefined");
    if (alertClass === "alert-all") {
      $("#knowledge-files-alert div.alert-one").show();
      $("#knowledge-files-alert div.alert-two").show();
    } else {
      inlineAlert(`#knowledge-files-alert`, title, text, type, alertClass);
    }
    if (makeVisible) {
      $("#info-upload-nav-item").click();
      $(".knowledges-bar").children()[0].click();
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
      $("#knowledge-files-alert div.alert-one").hide();
      $("#knowledge-files-alert div.alert-two").hide();
    } else {
      $(`#knowledge-files-alert div.${alertClass}`).hide(500);
    }
  },

  data: {
    "filesData": []
  },


  clear: function() {
    this.data = {
      "filesData": []
    };
  },

  computeActiveState: function(source) {
    var oldState = knowledgeFilesStorage.active.has(source)
    if (oldState) {
      knowledgeFilesStorage.active.delete(source);
      knowledgeFilesClient.abortRequest(source);
    } else if (!oldState) {
      knowledgeFilesStorage.active.add(source);
    }
    var newState = knowledgeFilesStorage.active.has(source)
    console.assert(newState != oldState, "state never changed after click")
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

  setFileIcon: function(file, sizeClass) {
    var self = this;
    var iconHTML;;
    if (knowledgeFilesStorage.isTextFile(file)) {
      iconHTML = this.fileFormatIcons["text"];
    } else {
      var file_type_key;
      if (file.isFake) {
        file_type_key = file.type;
      }
      else {
        file_type_key = getKeyByValue(knowledgeFilesStorage.fileFormats, file.type);
      }
      console.assert(file_type_key !== undefined, "file_type_key is undefined, may be caused by file format being unsupported");
      iconHTML = this.fileFormatIcons[file_type_key];
    }

    if (iconHTML === undefined) {
      return this.fileFormatIcons["unknown"].replace("{{class}}", sizeClass);
    } else {
      return iconHTML
    }
  },

  setStateIcon: function(file, source) {
    var isSent = knowledgeFilesStorage.isFileSent(file);
    var isConverted = textKnowledgeStorage.knowledgeExists(source);
    var isActive = knowledgeFilesStorage.getActiveState(source);
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

  setFileSize: function(file) {

    var mb = file.size * 1e-6;
    if (mb >= 1) {
      return mb.toFixed(2) + " MB";
    } else {
      var kb = mb * 1000
      return kb.toFixed(1) + " KB";
    }

  },


  syncFilesData: function() {
    var self = this;
    var files = knowledgeFilesStorage.knowledgeFiles;
    this.clear();
    $.each(files, function(index, value) {
      var fileData = {};
      fileData["fileName"] = localFiles.getFileName(value);
      fileData["fileSize"] = self.setFileSize(value);
      fileData["fileType"] = localFiles.getFileType(value);
      fileData["fileIcon"] = self.setFileIcon(value);
      fileData["readyStateIcon"] = self.setStateIcon(value, fileData["fileName"]);
      fileData["statusCheckBoxIcon"] = self.setCheckBoxIcon(knowledgeFilesStorage.active.has(fileData["fileName"]));
      fileData["index"] = index;
      self.data["filesData"].push(fileData);
    });
  },

  displayFiles: function(containerElementId) {
    w3.displayObject(containerElementId, this.data);
  },

  syncDisplay: function(executeOptional=true) {
    this.syncFilesData();
    this.displayFiles("knowledge_files_preview");
    this.showHide("knowledge_files_upload_init", "knowledge_files_preview", executeOptional);
  },

  removeByIndex: function(index) {
    var fileName = knowledgeFilesStorage.knowledgeFiles[index].name
    knowledgeFilesStorage.removeFileByIndex(index);
    knowledgeFilesStorage.active.delete(fileName);
    Knowledges.deleteResource(fileName)
    if(knowledgeFilesStorage.sentFileNames.includes(fileName)){
        const index = knowledgeFilesStorage.sentFileNames.indexOf(fileName);
        console.assert(index!==-1, `${fileName} filename not in sent`);
        knowledgeFilesStorage.sentFileNames.splice(index, 1);
    }
    this.syncDisplay();
  },

  showHide: function(initialID, afterID, executeOptional=true) {
    if (executeOptional) {
        this.hideInlineAlert();
    }

    if (knowledgeFilesStorage.knowledgeFiles.length > 0) {
      $("#" + afterID).removeClass("w3-hide");
      $("#" + initialID).addClass("w3-hide");
      $("." + "knowledge_files_after").removeClass("w3-hide");

    } else {
      $("#" + afterID).addClass("w3-hide");
      $("#" + initialID).removeClass("w3-hide");
      $("." + "knowledge_files_after").addClass("w3-hide");
    }

    var active = new Set(knowledgeFilesStorage.getActiveSources());
    var extracted = new Set(textKnowledgeStorage.getSources());
    if (isSuperset(extracted, active)) {
      $('#knowledge_files_submit').attr('disabled', 'disabled');
    } else {
      $('#knowledge_files_submit').attr('disabled', false);
    }

    if (knowledgeFilesStorage.uploadLimitReached()) {
      $(".knowledge-files-adding-buttons").attr('disabled', 'disabled');
    } else {
      $(".knowledge-files-adding-buttons").attr('disabled', false);
    }

    if (knowledgeFilesStorage.isEmpty()) {
      var alertOneObj = {
        text: "Select files(pdf, docx, pptx, text) to be used as search resource",
        type: "info"
      }
      this.showInlineDoubleAlert(alertOneObj, undefined, false, false);
    }
  },

  updateProgressBar: function(value, total) {
    updateProgressBar("#knowledge_files_progress_bar", value, total)
  },

  updateProgressBarText: function(text) {
    updateProgressBarText("#knowledge_files_progress_bar", text);
  },

  updateProgressBarSentiment: function(isPositive) {
    updateProgressBarSentiment("#knowledge_files_progress_bar", isPositive)
  }
}

var knowledgeFilesClient = {
  Url: location.protocol + '//' + location.host + location.pathname + "/knowledge/apload/files",
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
    var self = knowledgeFilesClient;
    knowledgeFilesPreview.updateProgressBarText("Finished uploading files");
    knowledgeFilesPreview.syncDisplay(false);
    self.clearRequests();
  },

  completeCall: function() {
    var self = knowledgeFilesClient;
    var sentItem;
    for (var pair of this.entries()) {
      var sentItem = pair[1].name;
    }
    self.totalCompletedRequests += 1;
    self.removeRequest(sentItem);

    knowledgeFilesPreview.updateProgressBar(self.totalCompletedRequests, self.totalSentRequests);
    if (knowledgeFilesClient.requestsCompleted()) {
      var text = "";
      if (self.totalFailRequests > self.totalSuccessRequests) {
        text += `${self.totalFailRequests}/${self.totalCompletedRequests} files
        failed to submit. May be caused by (${Array.from(self.errorStatuses).join(", ")}).`
        /*alert when there was error in sending files*/
        var alertOneObj = {
          text: text,
          type: "warning"
        };
        knowledgeFilesPreview.showInlineDoubleAlert(alertOneObj, undefined, false);
      }

      else {
        text += `${self.totalSuccessRequests}/${self.totalCompletedRequests}
         files submited sucessfully. ${self.totalReadyRequests}
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
      knowledgeFilesPreview.showInlineDoubleAlert(alertOneObj, undefined, false);
      self.completedCall();
    }
  },

  errorCall: function(data, status, error) {
    var self = knowledgeFilesClient;
    var sentItem;
    for (var pair of this.entries()) {
      var sentItem = pair[1].name;
    }
    self.totalFailRequests += 1;
    self.errorStatuses.add(error);
    self.errorStatuses.add(status);
    var text = "Error occured while uploading file: " + status;
    knowledgeFilesPreview.updateProgressBarSentiment(false);
    knowledgeFilesPreview.updateProgressBarText(text);
  },


  successCall: function(data, status, error) {
    var self = knowledgeFilesClient;
    var sentItem;
    for (var pair of this.entries()) {
      var sentItem = pair[1].name;
    }
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
    for (var pair of this.entries()) {
      knowledgeFilesStorage.addToSent(pair[1]);
    }

    knowledgeFilesPreview.syncDisplay();

    var text = `sucessfully uploaded: '${sentItem}' file`
    knowledgeFilesPreview.updateProgressBarSentiment(true);
    knowledgeFilesPreview.updateProgressBarText(text);
  },

  sendFiles: function() {
    var self = this;
    this.clearRequests();
    const files = knowledgeFilesStorage.getReadyFiles();
    $.each(files, function(index, file) {
      self.sendFile(file);
    });
    if (files.length) {
      Knowledges.clearRequestsCall();
      knowledgeFilesPreview.updateProgressBar(0.5, self.totalSentRequests);
      $('#knowledge_files_submit').attr('disabled', 'disabled');
    }
  },

  sendFile: function(file) {
    const request = sendLocalFile(this.Url, file, this.successCall, this.errorCall, this.completeCall);
    this.requestsObjsMap[file.name] = request;
    this.totalSentRequests = this.totalSentRequests + 1;
    knowledgeFilesPreview.updateProgressBarText(`Sending '${file.name}' file to the server`);
    this.status = true;
  }
}



$(document).ready(function() {
  knowledgeFilesPreview.syncDisplay();

  $(".knowledge-files-adding-buttons").on('click', function() {
  })

  $("#knowledge_local_input_element, #second_knowledge_local_input_element").on('input', function() {
    //note that it adds knowledges
    knowledgeFilesStorage.addFilesToKnowledge(this.files);
    $("#knowledge_files_submit").click();
    this.value = null;
  });

  $(document).on('click', "#knowledge_files_submit", function() {
    if (knowledgeFilesClient.isSafeToSend()) {
      knowledgeFilesPreview.hideInlineAlert("alert-all");
      if (knowledgeFilesStorage.activeReadyAvail()) {
        if (confirm("Are you sure you want to submit")) {
          knowledgeFilesClient.sendFiles();
        }
      } else {
        var alertOneObj = {
          text: "All active files are ready to be searched. Theres no need to submit ready files but focus loading more resources or searching.",
          type: "warning"
        }
        knowledgeFilesPreview.showInlineDoubleAlert(alertOneObj, undefined, false);
      }

      var active = new Set(knowledgeFilesStorage.getActiveSources());
      var extracted = new Set(textKnowledgeStorage.getSources());
      if (isSuperset(extracted, active)) {
        var text = "You just reached limit for files to be submited\n Disable or remove unneccesary files to submit more. We curenctly dont have enough storage to load all your files.";
        var alertOneObj = {
          text: text,
          type: "warning"
        };
        var alertTwoObj = {
          text: "Please remove some files or use alternative methods for loading resources. If the loaded files are enough, then they are ready for submission. After that proceed to real searching in results section(bottom)",
          type: "info"
        };
        knowledgeFilesPreview.showInlineDoubleAlert(alertOneObj, alertTwoObj);
      }
    }
  });
});
