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

    function toEnglishDigits(str) {
        if (!str) return "";
        var dict = { '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9' };
        return str.toString().replace(/[०-९]/g, function (char) {
            return dict[char];
        });
    }

    function toNepaliDigits(str) {
        if (!str) return "";
        var dict = { '0': '०', '1': '१', '2': '२', '3': '३', '4': '४', '5': '५', '6': '६', '7': '७', '8': '८', '9': '९' };
        return str.toString().replace(/[0-9]/g, function (char) {
            return dict[char];
        });
    }

    /* DOB (Nepali BS) → AGE */
    function fromBirthDate(birthDate) {
        if (!birthDate) return create();

        var today = dateUtil.now();
        var calculationDate = null; 

        // 1. Convert to English digits (Handle "२०६९-९-१९" -> "2069-9-19")
        var englishDateStr = toEnglishDigits(birthDate);
        var parts = englishDateStr.split('-');
        
        if(parts.length !== 3) {
            // console.log("Invalid format:", englishDateStr);
            return create();
        }

        var bsYear = parseInt(parts[0]);
        var bsMonth = parseInt(parts[1]);
        var bsDay = parseInt(parts[2]);

        // 2. Convert BS -> AD
        try {
            if (window.calendarFunctions) {
                calculationDate = window.calendarFunctions.getAdDateByBsDate(bsYear, bsMonth, bsDay);
            } 
            else if (window.NepaliFunctions) {
                var ad = window.NepaliFunctions.BS2AD({ year: bsYear, month: bsMonth, day: bsDay });
                calculationDate = new Date(ad.year, ad.month - 1, ad.day);
            } else {
                console.warn("No Nepali Date library found!");
            }
        } catch (e) {
            console.error("Error converting BS to AD:", e);
        }

        if (!calculationDate) return create();

        var period = dateUtil.diffInYearsMonthsDays(calculationDate, today);
        return create(period.years, period.months, period.days);
    }

    /* AGE → DOB (Nepali BS) */
    function calculateBirthDate(age) {
        if (!age || age.isEmpty()) return null;

        var birthDateAD = dateUtil.now();
        birthDateAD = dateUtil.subtractYears(birthDateAD, age.years || 0);
        birthDateAD = dateUtil.subtractMonths(birthDateAD, age.months || 0);
        birthDateAD = dateUtil.subtractDays(birthDateAD, age.days || 0);

        var bsYear, bsMonth, bsDay;

        try {
            if (window.calendarFunctions) {
                var bsObj = window.calendarFunctions.getBsDateByAdDate(
                    birthDateAD.getFullYear(), 
                    birthDateAD.getMonth() + 1, 
                    birthDateAD.getDate()
                );
                bsYear = bsObj.bsYear;
                bsMonth = bsObj.bsMonth;
                bsDay = bsObj.bsDate;
            } 
            else if (window.NepaliFunctions) {
                var bs = window.NepaliFunctions.AD2BS({
                    year: birthDateAD.getFullYear(),
                    month: birthDateAD.getMonth() + 1,
                    day: birthDateAD.getDate()
                });
                bsYear = bs.year;
                bsMonth = bs.month;
                bsDay = bs.day;
            } else {
                return null;
            }
        } catch (e) {
            return null;
        }

        var englishDateStr = bsYear + "-" +
            (bsMonth < 10 ? "0" + bsMonth : bsMonth) + "-" +
            (bsDay < 10 ? "0" + bsDay : bsDay);

        return toNepaliDigits(englishDateStr);
    }

    return {
        create: create,
        fromBirthDate: fromBirthDate,
        calculateBirthDate: calculateBirthDate
    };
}]);