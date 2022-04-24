"use strict";

const app_url = location.protocol + '//' + location.host + location.pathname

var Knowledges, KnowledgesLoader;

var Knowledges = {

  processedKnowledges: new Set(),//{source: requestObj}

  getKnowledgesObjMap: function() {
    //Knowledges objes refenced on request to prevent not defined error
    const objects = {
      webpage: knowledgeURLsStorage,
      text: knowledgeTypedTextStorage,
      file: knowledgeFilesStorage
    }
    return objects;
  },

  getKnowledgesClientObjs: function(){
    return {webpage: knowledgeURLsClient, text: knowledgeTypedClient,
    file: knowledgeFilesClient}
  },

  getKnowledgesDisplayObjs: function(){
    return {webpage: knowledgeURLsDisplay, text: knowledgeTypedTextDisplay,
    file: knowledgeFilesPreview}
  },

  getKnowledgesObj: function() {
    var knowledgesObjs = Object.values(this.getKnowledgesObjMap());
    console.assert(knowledgesObjs !== undefined, "knowledges is undefined");
    return knowledgesObjs;
  },

  getAllSources: function(knowledgesData=false) {
    var self = this
    var sources = new Set();
    $.each(this.getKnowledgesObj(), function(index, value) {
      //Be aware that Files implemented getSources() differently
      sources = union(sources, value.getAllSources());
    });
    if (!knowledgesData) {
      return Array.from(sources);
    }
    else {
      return this.getKnowledgesData(Array.from(sources))
    }
  },

  getActiveExtractedSources: function(knowledgesData=false){
    var self = this
    var sources = new Set();
    $.each(this.getKnowledgesObj(), function(index, value) {
      //Be aware that Files implemented getSources() differently
      sources = union(sources, value.getActiveExtractedSources());
    });
    if (!knowledgesData) {
      return Array.from(sources);
    }
    else {
      return this.getKnowledgesData(Array.from(sources))
    }
  },

  getExtractedSources: function(knowledgesData=false){
    var self = this;
    var sources = new Set();
    $.each(this.getKnowledgesObj(), function(type, value) {
      //Be aware that Files implemented getSources() differently
      sources = union(sources, value.getExtractedSources());
    });
    if (!knowledgesData) {
      return Array.from(sources);
    }
    else {
      return this.getKnowledgesData(Array.from(sources))
    }
  },

  getSourceType: function(source){
    console.assert(source !== undefined, 'source is undefined');
    //console.assert(this.getAllSources().includes(source), `source'${source}' is not in knowledges sources`);
    var sourceType;
    $.each(this.getKnowledgesObjMap(), function(type, knowledgeObj) {
      if (knowledgeObj.getAllSources().includes(source)) {
        sourceType = type
      }
    });
    //console.assert(sourceType, `type of source'${source}' cannot be determined`);
    return sourceType;
  },

  getKnowledgesData: function(sources){
    console.assert(sources !== undefined, 'sources is undefined');
    var self = this;
    var data = {};
    $.each(sources, function(index, source) {
      const text = textKnowledgeStorage.getKnowledge(source);
      const type = self.getSourceType(source);
      const isProcessed = self.processedKnowledges.has(source);
      const charLength = text.length;
      const wordsLength = text.split(" ").length;
      const sourceData = {text: text, type: type, charLength: charLength,
        wordsLength:wordsLength, source: source, isProcessed: isProcessed}
      //babel to assighn value as key
      data = Object.assign(data, {[source]: sourceData});
    });
    return data;
  },

  isSending: function(){
    var sendStatus = false;
    $.each(this.getKnowledgesClientObjs(), function(type, clientObj) {
      if (!clientObj.isSafeToSend() && sendStatus === false) {
        sendStatus = true;
        return;
      }
    });
    return sendStatus;
  },

  clearRequestsCall: function(){
    const infoItemStack = $("#info-upload-nav-item").find(".fa-stack");
    console.assert(infoItemStack.length, "stack not found");
    //method will be called by Client objects(this refer to clients objs)
    if(Knowledges.isSending()){
      infoItemStack.children().not(".load-show").hide();
      infoItemStack.children(".load-show").show();
    }
    else{
      infoItemStack.children().not(".load-show").show();
      infoItemStack.children(".load-show").hide();
    }
  },

  deleteResource: function(source){
    const url = location.protocol + '//' + location.host + location.pathname + "/knowledge/delete";
    this.processedKnowledges.delete(source);
    textKnowledgeStorage.removeKnowledge(source);
    sendJSON(url, [source]);
  },


  serverSync: function(){
      const clientKnowledges = textKnowledgeStorage.getKnowledges();
      function fail(){
          sendJSON(app_url+"/knowledge/push", clientKnowledges, success, fail);
      }
      sendJSON(app_url+"/knowledge/push", clientKnowledges, undefined, fail);
  },


  serverClientSync: function(){
      var self = this;
      const clientKnowledges = textKnowledgeStorage.getKnowledges();
      function success(data, status, error){
        var parsedData = JSON.parse(data);
        self.processedKnowledges = new Set();
        $.each(parsedData, function(index, value) {
            textKnowledgeStorage.addKnowleges({[value.source]: value.text});
            if (value["processed"]) {
                Knowledges.processedKnowledges.add(value.source);
            }
        });
      }
      self.serverSync();
      function fail(){
        sendJSON(app_url+"/knowledge/reload", [], success, fail);
      }
      sendJSON(app_url+"/knowledge/reload", [], success, fail);
  }
}

var KnowledgesLoader = {
  Url: location.protocol + '//' + location.host + location.pathname + "/knowledge/reload",

  success: function(data, status, error){
    const knowledgesObjsMap = Knowledges.getKnowledgesObjMap();
    var parsedData = JSON.parse(data);
    $.each(parsedData, function(index, value) {
      console.assert(value.source_type in knowledgesObjsMap, `knowledge type\
      of ${value.source_type} not supported source(${value.source})`);
      var knowledgeObj = knowledgesObjsMap[value.source_type];
      textKnowledgeStorage.addKnowleges({[value.source]: value.text});
      if (value["processed"]) {
        Knowledges.processedKnowledges.add(value.source);
      }
      if (!knowledgeObj.getAllSources().includes(value.source)) {
        knowledgeObj.addToActive(value.source);
        knowledgeObj.addToSent(value.source, true);
        if (value.source_type === "file") {
          var emulatedFileObj = {size: 0, type: value.file_type,
           isFake: true, name: value.source};
          knowledgeObj.knowledgeFiles.push(emulatedFileObj);
        }
        else if (value.source_type === "text") {
          knowledgeObj.addKnowledge(value.source, value.text);
        }
        else if (value.source_type === "webpage") {
          knowledgeObj.addKnowledge(value.source);
        }
        else {
          console.assert(false, `type of source '${value.source}' which is
          '${value.source_type}' not supported.`);
        }
      }
    });
    const displayObjs = Knowledges.getKnowledgesDisplayObjs();
    $.each(displayObjs, function(type, object) {
      object.syncDisplay();
    })
  },

  error: function(data, status, error){
    const self = KnowledgesLoader;
    self.request();
  },

  request: function(){
    sendJSON(this.Url, [], this.success, this.fail)
  }
}

$(document).ready(function() {
  KnowledgesLoader.request();

  $(".section-bar > *").not(".collapse, .label").on('click', function() {
    const navBar = $(this).parent();
    if (!navBar.siblings(".sections:visible").length > 0) {
      $(this).siblings(".collapse").click();
    }
  });

  var buttons = $(".knowledge-tabs-container").find('button:contains("Submit")')
});
