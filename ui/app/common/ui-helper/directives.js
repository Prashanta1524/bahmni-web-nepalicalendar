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
                
                // --- HELPERS ---
                function toNepaliDigits(str) {
                    return (str + "").replace(/[0-9]/g, function (c) { return { '0':'०','1':'१','2':'२','3':'३','4':'४','5':'५','6':'६','7':'७','8':'८','9':'९' }[c]; });
                }
                function toEnglishDigits(str) {
                    return (str + "").replace(/[०-९]/g, function (c) { return { '०':'0','१':'1','२':'2','३':'3','४':'4','५':'5','६':'6','७':'7','८':'8','९':'9' }[c]; });
                }

                // --- 1. FORMATTER (Model [AD] -> View [Nepali]) ---
                ngModel.$formatters.push(function(modelValue) {
                    if (!modelValue || !(modelValue instanceof Date)) return "";
                    try {
                        var bsYear, bsMonth, bsDay;
                        if (window.calendarFunctions) {
                            var bsObj = window.calendarFunctions.getBsDateByAdDate(modelValue.getFullYear(), modelValue.getMonth() + 1, modelValue.getDate());
                            bsYear = bsObj.bsYear; bsMonth = bsObj.bsMonth; bsDay = bsObj.bsDate;
                        } else if (window.NepaliFunctions) {
                            var bs = window.NepaliFunctions.AD2BS({ year: modelValue.getFullYear(), month: modelValue.getMonth() + 1, day: modelValue.getDate() });
                            bsYear = bs.year; bsMonth = bs.month; bsDay = bs.day;
                        }
                        var engStr = bsYear + "-" + (bsMonth < 10 ? "0"+bsMonth : bsMonth) + "-" + (bsDay < 10 ? "0"+bsDay : bsDay);
                        return toNepaliDigits(engStr);
                    } catch(e) { return ""; }
                });

                // --- 2. PARSER (View [Nepali] -> Model [AD]) ---
                ngModel.$parsers.push(function(viewValue) {
                    // Force validity even if empty
                    if (!viewValue) {
                        ngModel.$setValidity('date', true);
                        return null;
                    }

                    var engVal = toEnglishDigits(viewValue);
                    var parts = engVal.split(/[-/.]/);
                    
                    if (parts.length === 3) {
                        try {
                            var y = parseInt(parts[0]), m = parseInt(parts[1]), d = parseInt(parts[2]);
                            var adDate;

                            if (window.calendarFunctions) {
                                adDate = window.calendarFunctions.getAdDateByBsDate(y, m - 1, d);
                            } else if (window.NepaliFunctions) {
                                var ad = window.NepaliFunctions.BS2AD({ year: y, month: m, day: d });
                                adDate = new Date(ad.year, ad.month - 1, ad.day);
                            }

                            if (adDate && !isNaN(adDate.getTime())) {
                                adDate.setHours(0, 0, 0, 0); // Strip Time
                                
                                // *** FORCE SAVE BUTTON ENABLED ***
                                ngModel.$setValidity('date', true);
                                ngModel.$setValidity('max', true);
                                ngModel.$setValidity('pattern', true);
                                ngModel.$setValidity('parse', true);
                                
                                return adDate;
                            }
                        } catch(e) { }
                    }
                    return undefined;
                });

                // --- 3. INIT ---
                var isInitialized = false;
                function initPicker() {
                    if (isInitialized) return;
                    if (typeof $.fn.nepaliDatePicker === "function") {
                        element.nepaliDatePicker({
                            dateFormat: "%y-%m-%d",
                            closeOnDateSelect: true,
                            disableFuture: true,
                            onChange: function () {
                                var bsDate = element.val();
                                $scope.$apply(function () {
                                    ngModel.$setViewValue(bsDate); 
                                    if (attrs.ngChange) $scope.$eval(attrs.ngChange);
                                });
                                element.trigger('change');
                            }
                        });
                        isInitialized = true;
                    }
                }
                
                element.on('blur', function() {
                    var val = element.val();
                    if (ngModel.$viewValue !== val) {
                        $scope.$apply(function() {
                            ngModel.$setViewValue(val);
                            if (attrs.ngChange) $scope.$eval(attrs.ngChange);
                        });
                    }
                });

                $timeout(initPicker, 100);
            }
        };
    }])
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