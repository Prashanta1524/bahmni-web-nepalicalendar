'use strict';

angular.module('bahmni.common.uiHelper')
    .filter('days', function () {
        return function (startDate, endDate) {
            return Bahmni.Common.Util.DateUtil.diffInDays(startDate, endDate);
        };
    }).filter('bahmniDateTime', function () {
        return function (date) {
            return Bahmni.Common.Util.DateUtil.formatDateWithTime(date);
        };
    }).filter('bahmniDate', ['appService', function (appService) {
        var cache = {}; // Simple cache to prevent infinite loops

        return function (date) {
            if (!date) return "";
            
            // If we already calculated this date, return the cached string
            var dateKey = date instanceof Date ? date.getTime() : date;
            if (cache[dateKey]) return cache[dateKey];

            var enableNepaliCalendar = appService.getAppDescriptor().getConfigValue("enableNepaliCalendar");
            var result = "";

            if (enableNepaliCalendar && window.NepaliFunctions) {
                result = Bahmni.Common.Util.NepaliDateUtil.formatAdToBs(date);
            } else {
                result = moment(date).format("DD MMM YY");
            }

            cache[dateKey] = result;
            return result;
        };
    }]).filter('bahmniTime', function () {
        return function (date) {
            return Bahmni.Common.Util.DateUtil.formatTime(date);
        };
    }).filter('bahmniDateInStrictMode', function () {
        return function (date) {
            return Bahmni.Common.Util.DateUtil.formatDateInStrictMode(date);
        };
    }).filter('bahmniDateTimeWithFormat', function () {
        return function (date, format) {
            return Bahmni.Common.Util.DateUtil.getDateTimeInSpecifiedFormat(date, format);
        };
    }).filter('addDays', function () {
        return function (date, numberOfDays) {
            return Bahmni.Common.Util.DateUtil.addDays(date, numberOfDays);
        };
    });
