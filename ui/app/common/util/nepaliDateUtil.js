window.Bahmni = window.Bahmni || {};
window.Bahmni.Common = window.Bahmni.Common || {};
window.Bahmni.Common.Util = window.Bahmni.Common.Util || {};

window.Bahmni.Common.Util.NepaliDateUtil = {
    toNepaliDigits: function (str) {
        return (str + "").replace(/[0-9]/g, function (c) {
            return { '0': '०', '1': '१', '2': '२', '3': '३', '4': '४', '5': '५', '6': '६', '7': '७', '8': '८', '9': '९' }[c];
        });
    },
    toEnglishDigits: function (str) {
        return (str + "").replace(/[०-९]/g, function (c) {
            return { '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9' }[c];
        });
    },
    formatAdToBs: function (adDate) {
        if (!adDate) return "";
        var d = new Date(adDate);
        if (isNaN(d.getTime())) return "";
        var bs = window.NepaliFunctions.AD2BS({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() });
        var str = bs.year + "-" + (bs.month < 10 ? "0" + bs.month : bs.month) + "-" + (bs.day < 10 ? "0" + bs.day : bs.day);
        return this.toNepaliDigits(str);
    }
};
$(document).on('focus', 'input.datepicker, .date-picker, input[type="date"]', function() {
    var isEnabled = true; // You can link this to a global config check
    if (isEnabled && $.fn.nepaliDatePicker) {
        $(this).nepaliDatePicker({ dateFormat: "%y-%m-%d" });
    }
});