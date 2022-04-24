app.controller('typedTextCtrl', function($scope) {
  $scope.savedText = [];
  $scope.shortSavedText = [];
  $scope.addFromClipBoard = function() {
    setTimeout(async () => {
      $scope.typedText = await navigator.clipboard.readText();

    }, 1000);
  }
  $scope.addText = function() {
    if ($scope.typedText.length > 100) {
      $scope.savedText.push($scope.typedText)
      $scope.shortSavedText.push($scope.typedText.slice(0, 99)+"...")
      $scope.typedText = ''
    }

  }
});
