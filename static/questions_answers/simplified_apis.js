"use strict";

var localFiles = {
  getFilesList: function(elementId) {
    return $("#" + elementId).prop('files');
  },
  getFileName: function(fileObj) {
    return fileObj.name
  },
  getFileType: function(fileObj) {
    return fileObj.type
  },
  getFileSize: function(fileObj) {
    return fileObj.size
  },
  getFileByName: function(name, filesListObj) {
    var index;
    for (var i = 0; i < filesListObj.length; i++) {
      if (this.getFileName(filesListObj[i]) == name) {
        return filesListObj[i];
      }
    }
    return -1;
  }
};
