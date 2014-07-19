/*
 * ModelCollection behavior for Angular.js
 * Version 0.0.1
 */
angular.module("ModelCollection", []).factory("ExtendMethod", function () {
  return function (props) {
    var that = this,
        child = function () { return that.apply(this, arguments); };

    angular.extend(child, this);
    angular.extend(child.prototype, this.prototype, props);

    return child;
  };
});

angular.module("ModelCollection").factory("CollectionBase", [
  "$http", "ExtendMethod", "ModelBase",
  function ($http, ExtendMethod, ModelBase) {
    var Collection = function(models, options) {
      this.models = (models || []);
      this.options = (options || {});
      this.initialize(models, options);
    };

    angular.extend(Collection.prototype, {
      model: ModelBase,

      initialize: function () {},

      fetch: function (options) {
        var request = $http(angular.extend({
          method: "GET",
          url: this.computedUrl()
        }, options));

        request.success(angular.bind(this, this.populateCollection));

        return request;
      },

      sync: function (options) {
        var request = $http(angular.extend({
          url: this.computedUrl(),
          method: "POST",
          data: this.toJSON()
        }, options));

        request.success(angular.bind(this, this.populateCollection));

        return request;
      },

      computedUrl: function () {
        return (typeof(this.url) == "function") ? this.url() : this.url;
      },

      toJSON: function () {
        var modelsArray = [];

        for (var i = 0, l = this.models.length; i < l; i ++) {
          modelsArray.push(this.models[i].attributes);
        }

        return modelsArray;
      },

      populateCollection: function (collectionData) {
        for (var i = 0, l = collectionData.length; i < l; i ++) {
          var modelData = collectionData[i],
              foundModel = this.find(modelData.id);

          if (foundModel) {
            foundModel.updateAttributes(modelData);
          } else {
            this.add(modelData, { skipSort: true, parse: true });
          }
        }

        this.sort();
      },

      add: function (modelOrData, options) {
        options =
          angular.extend({
            skipSort: false,
            parse: false
          }, options);

        var model = (options.parse) ? new this.model(modelOrData) : modelOrData;

        model.collection = this;

        this.models.push(model);

        if (!options.skipSort) { this.sort(); }
      },

      find: function (modelId) {
        var foundModel;

        if (modelId) {
          for (var i = 0, l = this.models.length; i < l; i++) {
            var comparedModelId = this.models[i].attributes.id;

            if (comparedModelId && comparedModelId == modelId) {
              foundModel = this.models[i];
              break;
            }
          }
        }

        return foundModel;
      },

      remove: function (model) {
        this.models.splice(this.models.indexOf(model), 1);
      },

      sort: function () {
        if (!this.comparator) { return; }
        this.models.sort(this.comparator);
      },

      modelAlreadyAdded: function (model) {
        return this.find(model.attributes.id);
      }
    });

    Collection.extend = ExtendMethod;

    return Collection;
  }
]);

angular.module("ModelCollection").factory("ModelBase", [
  "$http", "ExtendMethod",
  function ($http, ExtendMethod) {
    var Model = function(attributes, options) {
      this.attributes = (attributes || {});
      this.initialize(attributes, options);
    };

    angular.extend(Model.prototype, {
      initialize: function () {},

      urlRoot: "",

      fetch: function (options) {
        var request = $http(angular.extend({
          method: "GET",
          url: this.computedUrl()
        }, options));

        request.success(angular.bind(this, this.updateAttributes));

        return request;
      },

      save: function (attributes, options) {
        var request = $http(angular.extend({
          method: (this.isNew() ? "POST" : "PUT"),
          url: this.computedUrl(),
          data: (attributes || this.attributes)
        }, options));

        request.success(angular.bind(this, this.updateAttributes));

        return request;
      },

      destroy: function (options) {
        var request = $http(angular.extend({
          method: "DELETE",
          url: this.computedUrl()
        }, options));

        if (this.collection) {
          request.success(angular.bind(this, this.removeFromCollection));
        }

        return request;
      },

      isNew: function () {
        return !this.attributes.id;
      },

      computedUrl: function () {
        return (typeof(this.url) == "function") ? this.url() : this.url;
      },

      url: function () {
        var url = (typeof(this.urlRoot) == "function") ? this.urlRoot() : this.urlRoot;

        if (!this.isNew()) { url += "/" + this.attributes.id; }

        return url;
      },

      set: function (attribute, value) {
        this.attributes[attribute] = value;
      },

      updateAttributes: function (data) {
        this.attributes = angular.extend(this.attributes, data);
      },

      removeFromCollection: function () {
        this.collection.remove(this);
      }
    });

    Model.extend = ExtendMethod;

    return Model;
  }
]);