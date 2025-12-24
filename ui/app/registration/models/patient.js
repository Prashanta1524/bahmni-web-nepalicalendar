'use strict';

angular.module('bahmni.registration')
.factory('patient', ['age', 'identifiers', function (age, identifiers) {
    function create() {
        var patient = {
            address: {},
            age: age.create(),
            birthdate: null,
            birthdateEstimated: false,
            image: '../images/blank-user.gif',
            relationships: [],
            newlyAddedRelationships: [{}],
            deletedRelationships: []
        };

        // 1. Method to Calculate Birthdate from Age (Fixed for Save Button)
        patient.calculateBirthDate = function () {
            if (!patient.age || patient.age.isEmpty()) return;
            var dobAD = age.calculateBirthDate(patient.age);
            patient.birthdate = dobAD; 
        };

        // 2. Method to Calculate Age from Birthdate
        patient.calculateAge = function () {
            if (!patient.birthdate) {
                patient.age = age.create();
                return;
            }
            patient.age = age.fromBirthDate(patient.birthdate);
        };

        // 3. THIS WAS MISSING: Method to get Image Data for Saving
        patient.getImageData = function () {
            return patient.image && patient.image.indexOf('data') === 0 ? patient.image : null;
        };

        return _.assign(patient, identifiers.create());
    }
    return { create: create };
}]);