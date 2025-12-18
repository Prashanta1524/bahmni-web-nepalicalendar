"use strict";

angular
  .module("bahmni.common.uiHelper")
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
        require: "ngModel",
        link: function ($scope, element, attrs, ngModel) {
            
            var initPicker = function() {
                // Check for the specific function from the unpkg library
                if (typeof element.nepaliDatePicker === "function") {
                    element.nepaliDatePicker({
                        dateFormat: "%y-%m-%d",
                        closeOnDateSelect: true,
                        // Update Angular Model when a date is picked
                        onChange: function() {
                            $scope.$apply(function () {
                                ngModel.$setViewValue(element.val());
                                if ($scope.patient && typeof $scope.patient.calculateAge === "function") {
                                    $scope.patient.calculateAge();
                                }
                            });
                        }
                    });
                } else {
                    console.error("Nepali Date Picker library not found. Check index.html scripts.");
                }
            };

            // Run initialization after a short delay to ensure DOM is ready
            $timeout(initPicker, 500);

            // If user clicks the box and it's not initialized, try again
            element.on('click', function() {
                initPicker();
            });
        }
    };
}])
  .directive("myAutocomplete", [
    "$parse",
    function ($parse) {
      var link = function (scope, element, attrs, ngModelCtrl) {
        var ngModel = $parse(attrs.ngModel);
        var source = scope.source();
        var responseMap = scope.responseMap();
        var onSelect = scope.onSelect();

        element.autocomplete({
          autofocus: true,
          minLength: 2,
          source: function (request, response) {
            source(attrs.id, request.term, attrs.itemType).then(function (
              data
            ) {
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
    },
  ])
  .directive("bmForm", [
    "$timeout",
    function ($timeout) {
      var link = function (scope, elem, attrs) {
        $timeout(function () {
          $(elem)
            .unbind("submit")
            .submit(function (e) {
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
    },
  ])
  .directive("patternValidate", [
    "$timeout",
    function ($timeout) {
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
    },
  ])
  .directive("validateOn", function () {
    var link = function (scope, element, attrs, ngModelCtrl) {
      var validationMessage =
        attrs.validationMessage || "Please enter a valid detail";

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
