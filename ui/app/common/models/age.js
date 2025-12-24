'use strict';

angular.module('bahmni.common.models')
.factory('age', [function () {
    var dateUtil = Bahmni.Common.Util.DateUtil;

    function create(years, months, days) {
        return {
            years: years || 0,
            months: months || 0,
            days: days || 0,
            isEmpty: function () {
                return !(this.years || this.months || this.days);
            }
        };
    }

    function fromBirthDate(birthDate) {
        if (!birthDate || !(birthDate instanceof Date)) return create();
        var today = dateUtil.now();
        var period = dateUtil.diffInYearsMonthsDays(birthDate, today);
        return create(period.years, period.months, period.days);
    }

    function calculateBirthDate(age) {
        if (!age || age.isEmpty()) return null;

        var birthDateAD = dateUtil.now();
        birthDateAD = dateUtil.subtractYears(birthDateAD, age.years || 0);
        birthDateAD = dateUtil.subtractMonths(birthDateAD, age.months || 0);
        birthDateAD = dateUtil.subtractDays(birthDateAD, age.days || 0);
        
        // Strip Time
        birthDateAD.setHours(0, 0, 0, 0);
        
        return birthDateAD; 
    }

    return {
        create: create,
        fromBirthDate: fromBirthDate,
        calculateBirthDate: calculateBirthDate
    };
}]);