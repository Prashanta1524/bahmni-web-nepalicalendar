"use strict";

angular.module("bahmni.common.uiHelper")
    .directive("nonBlank", function () {
        return function ($scope, element, attrs) {
            var addNonBlankAttrs = function () {
                element.attr({ required: "required" });
            };
            var removeNonBlankAttrs = function () {
                element.removeAttr("required");
            };
            if (!attrs.nonBlank) {
                return addNonBlankAttrs(element);
            }
            $scope.$watch(attrs.nonBlank, function (value) {
                return value ? addNonBlankAttrs() : removeNonBlankAttrs();
            });
        };
    })
    .directive("datepicker", ["$timeout", function ($timeout) {
        return {
            restrict: 'A',
            require: "ngModel",
            link: function ($scope, element, attrs, ngModel) {
                
                var isInitialized = false;

                function initPicker() {
                    if (isInitialized) return;
                    
                    if (typeof $.fn.nepaliDatePicker === "function") {
                        element.nepaliDatePicker({
                            dateFormat: "%y-%m-%d",
                            closeOnDateSelect: true,
                            disableFuture: true,
                            onChange: function () {
                                // PICKER SELECTION
                                $scope.$apply(function () {
                                    var bsDate = element.val();
                                    ngModel.$setViewValue(bsDate);
                                    ngModel.$render();
                                    if (attrs.ngChange) {
                                        $scope.$eval(attrs.ngChange);
                                    }
                                });
                                element.trigger('change');
                            }
                        });
                        isInitialized = true;
                    }
                }

                // MANUAL TYPING: Force update when user leaves the field (Blur)
                element.on('blur', function() {
                    $scope.$apply(function() {
                        var val = element.val();
                        if(ngModel.$viewValue !== val) {
                            ngModel.$setViewValue(val);
                        }
                        // Always run the calculation on blur to be safe
                        if (attrs.ngChange) {
                            $scope.$eval(attrs.ngChange);
                        }
                    });
                });

                // MODEL -> VIEW Sync
                ngModel.$render = function() {
                    var val = ngModel.$viewValue || '';
                    element.val(val);
                };

                // Initialize once
                $timeout(initPicker, 100);
            }
        };
    }])
    // ... (Keep myAutocomplete, bmForm, etc. as they were) ...
    .directive("myAutocomplete", ["$parse", function ($parse) {
        var link = function (scope, element, attrs, ngModelCtrl) {
            var ngModel = $parse(attrs.ngModel);
            var source = scope.source();
            var responseMap = scope.responseMap();
            var onSelect = scope.onSelect();

            element.autocomplete({
                autofocus: true,
                minLength: 2,
                source: function (request, response) {
                    source(attrs.id, request.term, attrs.itemType).then(function (data) {
                        var results = responseMap ? responseMap(data.data) : data.data;
                        response(results);
                    });
                },
                select: function (event, ui) {
                    scope.$apply(function (scope) {
                        ngModelCtrl.$setViewValue(ui.item.value);
                        scope.$eval(attrs.ngChange);
                        if (onSelect != null) {
                            onSelect(ui.item);
                        }
                    });
                    return true;
                },
                search: function (event) {
                    var searchTerm = $.trim(element.val());
                    if (searchTerm.length < 2) {
                        event.preventDefault();
                    }
                },
            });
        };
        return {
            link: link,
            require: "ngModel",
            scope: {
                source: "&",
                responseMap: "&",
                onSelect: "&",
            },
        };
    }])
    .directive("bmForm", ["$timeout", function ($timeout) {
        var link = function (scope, elem, attrs) {
            $timeout(function () {
                $(elem).unbind("submit").submit(function (e) {
                    var formScope = scope.$parent;
                    var formName = attrs.name;
                    e.preventDefault();
                    if (scope.autofillable) {
                        $(elem).find("input").trigger("change");
                    }
                    if (formScope[formName].$valid) {
                        formScope.$apply(attrs.ngSubmit);
                        $(elem).removeClass("submitted-with-error");
                    } else {
                        $(elem).addClass("submitted-with-error");
                    }
                });
            }, 0);
        };
        return {
            link: link,
            require: "form",
            scope: {
                autofillable: "=",
            },
        };
    }])
    .directive("patternValidate", ["$timeout", function ($timeout) {
        return function ($scope, element, attrs) {
            var addPatternToElement = function () {
                if ($scope.fieldValidation && $scope.fieldValidation[attrs.id]) {
                    element.attr({
                        pattern: $scope.fieldValidation[attrs.id].pattern,
                        title: $scope.fieldValidation[attrs.id].errorMessage,
                        type: "text",
                    });
                }
            };
            $timeout(addPatternToElement);
        };
    }])
    .directive("validateOn", function () {
        var link = function (scope, element, attrs, ngModelCtrl) {
            var validationMessage = attrs.validationMessage || "Please enter a valid detail";
            var setValidity = function (value) {
                var valid = value ? true : false;
                ngModelCtrl.$setValidity("blank", valid);
                element[0].setCustomValidity(!valid ? validationMessage : "");
            };
            scope.$watch(attrs.validateOn, setValidity, true);
        };
        return {
            link: link,
            require: "ngModel",
        };
    });