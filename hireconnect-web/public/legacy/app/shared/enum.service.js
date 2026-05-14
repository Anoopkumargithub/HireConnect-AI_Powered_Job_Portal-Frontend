(function () {
  "use strict";

  angular.module("shared").factory("enumService", [
    function () {
      function normalize(value) {
        if (value === null || value === undefined) {
          return null;
        }
        if (typeof value === "number") {
          return value;
        }
        return value.toString().toUpperCase();
      }

      function optionFor(options, value) {
        if (!options) {
          return null;
        }
        var normalized = normalize(value);
        if (normalized === null) {
          return null;
        }
        if (typeof normalized === "number") {
          return (
            options.find(function (option) {
              return option.value === normalized;
            }) || null
          );
        }
        return (
          options.find(function (option) {
            return option.name === normalized;
          }) || null
        );
      }

      function labelFor(options, value) {
        var option = optionFor(options, value);
        return option ? option.label : value;
      }

      function valueFor(options, value) {
        var option = optionFor(options, value);
        return option ? option.value : null;
      }

      return {
        optionFor: optionFor,
        labelFor: labelFor,
        valueFor: valueFor,
      };
    },
  ]);
})();
