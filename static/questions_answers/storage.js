"use strict";

var answersStorage = {
  //Wanted to convert the objects to map
  newAnswers: {},
  oldAnswers: {},
  interactiveAnswers: {},
  nonInteractiveAnswers: {},

  appendNonInteractiveAnswer: function(answer){
    this.nonInteractiveAnswers = {...this.nonInteractiveAnswers, ...answer};
  },

  getNonInteractiveAnswers: function(){
    return this.nonInteractiveAnswers;
  },

  getInteractiveAnswers: function(){
    return this.interactiveAnswers;
  },

  setInteractiveAnswers: function(answers){
    console.assert(answers !== undefined, "answers is undefined")
    this.interactiveAnswers = answers;
    this.setNewAnswers(answers);
  },

  setNonInteractiveAnswers: function(answers){
    console.assert(answers !== undefined, "answers is undefined")
    this.nonInteractiveAnswers = answers;
    this.setNewAnswers(answers);
  },

  setNewAnswers: function(answers){
    this.newToOld();
    this.clearnewAnswers();
    this.newAnswers = answers;
  },

  getQuestion: function(answer){
    //wait before using the method
    console.assert(answer!==undefined, "answer is undefined");
    return answer.keys()[0];
  },

  getQuestions: function(answers) {
    var questions = [];
    $.each(answers, function(key, value) {
      if (key) {
        questions.push(key);
      }
    });
    return questions;
  },

  getAnswers: function(questions){
    console.assert(questions !== undefined, "seems like questions is undefined")
    var answers = {}
    var allAnswers = {...this.newAnswers, ...this.oldAnswers};
    $.each(questions, function(index, question) {
      if (allAnswers.hasOwnProperty(question)) {
        answers[question] = allAnswers[question]
        console.assert(answers.hasOwnProperty(question), "question not in answers after being added")
      }
    });
    return answers
  },

  getPreciseAnswers: function(questions, currentKnowledgeSources){
    //Gets answers that contain certain knowledge sources(searched)
    console.assert(questions != undefined, "questions is undefined")
    console.assert(currentKnowledgeSources != undefined, "currentKnowledgeSources is undefined")
    var nonPreciseAnswers = this.getAnswers(questions);
    var currentKnowledgeSources = new Set(currentKnowledgeSources);
    var answers = {};
    $.each(nonPreciseAnswers, function(question, answer) {
      var answerKnowledgeSources = new Set(answer["knowledges_sources"]);
      if (answerKnowledgeSources.issuperset(currentKnowledgeSources)) {
        answers[question] = answer
        console.assert(answers.hasOwnProperty(question), "question not in answers after being added")
      }
    });
    return answers;
  },

  getQuestionAnswer: function(question){
    if (this.questionAnswered()) {
      if (this.newAnswers.hasOwnProperty(question)) {
        return this.newAnswers[question]
      }
      else if (this.oldAnswers.hasOwnProperty(question)) {
        return this.oldAnswers[question]
      }
    }
  },

  getAnswerSources: function(question){
    console.assert(this.questionAnswered(question), "Cannot get knowledge sources for question that isnt answered")
    return this.getQuestionAnswer(question)["knowledges_sources"]
  },

  newToOld: function() {
    //stop wasting client memory
    /*this.oldAnswers = {
      ...this.oldAnswers,
      ...this.newAnswers
    }*/
  },
  addNewAnswer: function(question, quotesArray) {
    console.assert(question, "aquestion maps to false")
    console.assert(quotesArray, "quotesArray maps to false")
    this.newAnswers[question] = quotesArray;
  },
  addnewAnswers: function(answers) {
    console.assert(answers, "answers map to false")
    this.newAnswers = {
      ...this.newAnswers,
      ...answers
    };
  },
  clearnewAnswers: function() {
    this.newAnswers = {}
  },

  questionAnswered: function(question) {
    console.assert(question, "Question maps to False")
    return this.newAnswers.hasOwnProperty(question) || this.OldAnswers.hasOwnProperty(question);
  },
  getNewAnswers: function() {
    return this.newAnswers;
  },
  getOldAnswers: function() {
    return this.OldAnswers;
  },
  isNewAnswersEmpty: function() {
    return this.newAnswers.length === 0;
  }
}


var textKnowledgeStorage= {
  /*sources: {
    source(filename,doc name):[[sentence], [sentence], [sentence], [sentence],...],
    source(filename,doc name):[[sentence], [sentence], [sentence], [sentence],...]
    ###outdated###
  }*/
  knowledge: {},

  getSources: function(){
    return Object.keys(this.knowledge);
  },

  getKnowledges: function(sources){
      if(sources!==undefined){
          var temp_obj = {};
          $.each(this.knowledge, function(key, value) {
            if(sources.includes(key)){
                temp_obj[key] = value;
                console.log(temp_obj[key], temp_obj)
            }
          });
          return temp_obj;
      }
      else{
          return this.knowledge;
      }
  },

  appendKnowledge: function(knowledge){
    console.assert(knowledge != undefined, "knowledge is undefined");
    this.knowledge = this.knowledge = {...this.knowledge, ...knowledge};
    return this.knowledge
  },

  addKnowledge: function(source, dataMap) {
    console.assert(source, "source map to false")
    console.assert(dataMap, "dataMap map to false")
    this.knowledge[source] = dataMap;
  },
  addKnowleges: function(knowledge) {
    console.assert(knowledge, "knowledge map to false")
    this.knowledge = {
      ...this.knowledge,
      ...knowledge
    };
    return this.knowledge;
  },
  removeKnowledge: function(source) {
    console.assert(source, "knowledge map to false")
    delete this.knowledge[source];
  },
  clear: function() {
    this.knowledge = {};
  },
  getKnowledge: function(source){
    console.assert(source, "source map to false")
    return this.knowledge[source];
  },
  getText: function(source) {
    console.assert(source, "source map to false")
    return this.getKnowledge[source]["text"]
  },
  knowledgeExists: function(source){
    console.assert(source, "source maps to false")
    return this.knowledge.hasOwnProperty(source);
  }
}
