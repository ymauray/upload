(function(angular) {

	'use strict';

	var config = {
		DemoController: DemoController,
		config: config
	};

	angular
		.module('demo', ['mnUpload'])
		.config(config.config)
		.controller('DemoController', config.DemoController)
	;

	config.$inject = ['mnUploadServiceProvider'];
	function config(mnUploadServiceProvider) {
		mnUploadServiceProvider
			.setChunkSize(1 * 1024 * 1024)
		;
	}

	DemoController.$inject = ['$scope', 'mnUploadService'];
	function DemoController($scope, mnUploadService) {

		var _controller = angular.extend(this, {
			upload: upload
		});

		function upload() {
			var fileObject = mnUploadService.createFileObject(_controller.myFile);
			fileObject
				.on('chunkingProgress', function(current, max) {
					console.log('on chunkingProgress', current, max);
				})
				.on('chunkingComplete', function() {
					console.log('on chunkingComplete');
				})
				.on('chunkingError', function(current, max) {
					console.log('Error uploading part', current, 'of', (max - 1));
				})
				.upload('/upload')
			;
		}
	}


})(window.angular);