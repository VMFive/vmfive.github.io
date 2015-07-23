var myApp = angular.module('myapp',['ngRoute','ngResource']);

myApp.controller('VMFiveProductsCtrl', ['$scope', '$timeout', '$resource', function($scope,$timeout,$resource){

	$scope.videoWidth = $(window).width();
	$scope.videoHeight = 0.375 * $scope.videoWidth;

	$scope.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}]);

myApp.controller('VMFiveHomeCtrl', ['$scope', '$timeout', '$resource', function($scope,$timeout,$resource){

	// $scope.picTest = function(pic) {

	// 	$scope.wider =1;

	// 	if(pic.clientWidth/pic.clientHeight > pic.closest(".mainSlider").clientWidth/pic.closest(".mainSlider").clientHeight) {
	// 		$scope.wider=1;
	// 		console.log("wider!");
	// 	}
	// 	else {
	// 		console.log("thinner!");
	// 		$scope.wider=0;

	// 	}

	// }

	// $.each($(".kv"), function(index, value){

	// 	$scope.picTest(value);

	// });


}]);
