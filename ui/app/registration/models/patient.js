'use strict';

angular.module('bahmni.registration')
.factory('patient', ['age', 'identifiers', function (age, identifiers) {

    function create() {

        var patient = {
            address: {},
            age: age.create(),
            birthdate: null, // This will store the Nepali Date String (e.g. "2080-05-12")
            birthdateEstimated: false,
            image: '../images/blank-user.gif',
            relationships: [],
            newlyAddedRelationships: [{}],
            deletedRelationships: []
        };

        /* AGE → DOB (Triggered when User types Age) */
        patient.calculateBirthDate = function () {
            if (!patient.age || patient.age.isEmpty()) return;

            // Calculate the BS date string from the Age object
            var dob = age.calculateBirthDate(patient.age);
            
            // Only update if we got a valid string back
            if (typeof dob === "string") {
                patient.birthdate = dob;
            }
        };

        /* DOB → AGE (Triggered when User picks Nepali Date) */
        patient.calculateAge = function () {
            if (!patient.birthdate) {
                patient.age = age.create();
                return;
            }
            // Calculate Age object from the BS date string
            patient.age = age.fromBirthDate(patient.birthdate);
        };

        return _.assign(patient, identifiers.create());
    }

    return { create: create };
}]);