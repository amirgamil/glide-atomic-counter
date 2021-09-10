(() => {
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // src/glide.ts
  function column(column2) {
    return column2;
  }

  // src/column.ts
  var column_default = column((message) => __async(void 0, null, function* () {
    if (message.value === void 0)
      return void 0;
    return `echo ${message.value}`;
  }));

  // src/index.ts
  function convert(x) {
    if (x instanceof Date) {
      return x.toISOString();
    } else if (Array.isArray(x)) {
      return x.map(convert);
    } else {
      return x;
    }
  }
  window.addEventListener("message", function(event) {
    return __async(this, null, function* () {
      var _a;
      const {
        origin,
        data: { key, params }
      } = event;
      let result;
      let error;
      try {
        result = yield column_default(...params);
      } catch (e) {
        result = void 0;
        try {
          error = e.toString();
        } catch (e2) {
          error = "Exception can't be stringified.";
        }
      }
      const response = { key };
      if (result !== void 0) {
        result = convert(result);
        response.result = { type: "string", value: result };
      }
      if (error !== void 0) {
        response.error = error;
      }
      ((_a = event.source) == null ? void 0 : _a.postMessage).call(_a, response, "*");
    });
  });
})();
