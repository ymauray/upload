(function(angular) {

	'use strict';

	var config = {
		mnFile: mnFile,
		mnUploadServiceProvider: mnUploadServiceProvider
	};

	angular
		.module('mnUpload', [])
		.directive('mnFile', config.mnFile)
		.provider('mnUploadService', config.mnUploadServiceProvider)
	;

	mnFile.$inject = ['$timeout'];
	function mnFile($timeout) {
		return {
			restrict: 'A',
			scope: {
				mnFile: '='
			},
			link: function(scope, element, attributes, controller) {
				element.on('change', function() {
					$timeout(function() {
						scope.mnFile = element[0].files[0];
					});
				});
			}
		};
	}

	mnUploadServiceProvider.$inject = [];
	function mnUploadServiceProvider() {

		var chunkSize = 1 * 1024 * 1024;

		var _provider = angular.extend(this, {
			setChunkSize: function(value) { chunkSize = value; return _provider; },
			$get: factory
		});

		factory.$inject = ['$timeout', '$http'];
		function factory($timeout, $http) {
			return {
				createFileObject: createFileObject
			};

			function createFileObject(file) {
				return new FileObject(file);
			}

			function FileObject(file) {
				//console.log(file);

				// Private static attributes

				var registeredCallbacks = [];

				// Public API

				var _this = angular.extend(this, {
					chunks: [],
					upload: function(url) {
						// chunkSize is defined in the provider.
						_this.url = url;
						var maxOffset = Math.ceil(file.size / chunkSize);
						chunkingProgress(0, maxOffset);
					},
					on: function(event, callback) {
						event = event.toLowerCase();
						var callbacks = registeredCallbacks[event];
						if (angular.isUndefined(callbacks)) {
							callbacks = [];
							registeredCallbacks[event] = callbacks;
						}
						callbacks.push(callback);
						return _this;
					},
					fire: function() {
						var args = [];
						for (var i = 0; i < arguments.length; i++) {
							args.push(arguments[i]);
						}
						var event = args[0].toLowerCase();
						var callbacks = registeredCallbacks[event];
						if (angular.isUndefined(callbacks)) return;
						angular.forEach(callbacks, function(callback) {
							callback.apply(_this, args.slice(1));
						});
					}
				});

				// Private methods

				function chunkingProgress(offset, maxOffset, path) {
					if (offset == maxOffset) {
						_this.fire('chunkingComplete');
						return
					} else {
						var func = (file.slice ? 'slice' : (file.mozSlice ? 'mozSlice' : (file.webkitSlice ? 'webkitSlice' : 'slice')));
						var startByte = offset * chunkSize;
						var endByte = Math.min(file.size, (offset + 1) * chunkSize);
						var bytes = file[func](startByte, endByte);
						var fd = new FormData();
						fd.append('file', bytes);
						fd.append('fileName', file.name);
						fd.append('fileType', file.type);
						fd.append('fileSize', file.size);
						fd.append('offset', offset);
						fd.append('chunkSize', endByte - startByte);
                        fd.append('filePath', path);
						$http.post(_this.url, fd, {
							transformRequest: angular.identity,
							headers: { 'Content-Type': undefined }
						})
						.success(function(data) {
                            var ok = data.ok || false;
                                if (ok) {
                                    console.log('chunk uploaded successfully, monving on');
                                    $timeout(function() {
                                        _this.fire('chunkingProgress', offset + 1, maxOffset, data.path);
                                    });
                                } else {
                                    _this.fire('chunkingError', offset, maxOffset);
                                }
						})
						.error(function() {
							_this.fire('chunkingError', offset, maxOffset);
						});
					}
				}

				function chunkingComplete() {
					console.log('chunkingCompleted !!');
				}

				_this.on('chunkingProgress', chunkingProgress);
				_this.on('chunkingComplete', chunkingComplete);

				return _this;
			}
		}

	}

})(window.angular);
