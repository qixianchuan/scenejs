
var SceneJs = {version: '1.0'};

(function() {

    /** All exceptions thrown by SceneJS
     */
    SceneJs.exceptions = {

    };

    function isArray(obj) {
        return toString.call(obj) === "[object Array]";
    }

    /** Public resources
     */
    SceneJs.utils = {

        /** Converts degrees to radiians
         */
        degToRad : function(degrees) {
            return degrees * Math.PI / 180.0;
        },

        /** Applies properties on c to o, applying properties on defaults to o where they are not on c
         *
         */
        apply : function(o, c, defaults) {
            if (defaults) {
                SceneJs.apply(o, defaults);
            }
            if (o && c && typeof c == 'object') {
                for (var p in c) {
                    o[p] = c[p];
                }
            }
            return o;
        },

        /** Applies properties on c to o wherever o does not already have properties of same name
         *
         */
        applyIf : function(o, c) {
            if (o && c) {
                for (var p in c) {
                    if (typeof o[p] == "undefined") {
                        o[p] = c[p];
                    }
                }
            }
            return o;
        },

        /** Creates a namespace
         */
        namespace : function() {
            var a = arguments, o = null, i, j, d, rt;
            for (i = 0; i < a.length; ++i) {
                d = a[i].split(".");
                rt = d[0];
                eval('if (typeof ' + rt + ' == "undefined"){' + rt + ' = {};} o = ' + rt + ';');
                for (j = 1; j < d.length; ++j) {
                    o[d[j]] = o[d[j]] || {};
                    o = o[d[j]];
                }
            }
        },
        /** Creates a new data scope for a scene graph subtree, optionally as a child of a
         * parent scope. The scope can be flagged as being either fixed or unfixed. The former
         * type has data that will be constant for the life of the scene graph, while the latter
         * has data that will vary. So, data derived from the former type may be cached (or 'memoized')
         * in scene nodes, while the latter type must not be cached.
         *
         * @param _parent
         * @param _constant
         */
        newScope : function(_parent, _fixed) {
            var parent = _parent;
            var data = {};
            var fixed = _fixed || (_parent ? _parent.isfixed() : false);

            return {
                put : function(key, value) {
                    data[key] = value;
                },

                /** Gets an element of data from this scope or the first one on the parent path that has it
                 */
                get : function(key) {
                    var value = data[key];
                    if (value) {
                        return value;
                    }
                    if (!parent) {
                        return null;
                    }
                    return parent.get(key);
                },

                isfixed : function() {
                    return fixed;
                }
            };
        },

        /**
         * Extracts scene node configuration from the given scene node parameter arguments. The mandatory first argument
         * must either be a config object or a function that returns one, while the zero or more subsequent arguments
         * are child nodes. When the first arg is an object the result will be an object containing a function that
         * returns that object, a flag set true to indicate that the function always returns that exact object (which may be cached),
         * and the child nodes. When the first arg is a function, the result will contain that function, a flag set false
         * to indicate that the function's result may be variable, and the children.
         */
        getNodeConfig : function(args) {
            if (args.length == 0) {
                throw new SceneJs.exceptions.InvalidNodeConfigException('Invalid node parameters: should be a configuration followed by zero or more child nodes');
            }
            var result = { };
            var a0 = args[0];
            if (a0 instanceof Function) {
                result.getParams = a0;
                result.fixed = false; // Configs generated by function - probably variable
            } else {
                result.getParams = function() {
                    return a0;
                };
                result.fixed = true;  // Config object - may be constant - node may override if config has function
            }
            result.children = [];
            for (var i = 1; i < args.length; i++) {
                var arg = args[i];
                if (isArray(arg)) {
                    for (var j = 0; j < arg.length; j++) {
                        result.children.push(arg[j]);
                    }
                } else {
                    result.children.push(arg);
                }
            }
            return result;
        },

        /** Visits child nodes in the given node configuration
         */
        visitChildren : function(config, scope) {
            if (config.children) {
                for (var i = 0; i < config.children.length; i++) {
                    config.children[i].call(this, scope);
                }
            }
        }
    };

    /** Registry of modules that provide backend functionality for scene graph nodes
     */
    SceneJs.backends = new (function() {
        var backends = {};
        var ctx = {};

        /** Installs a backend module - see examples for more info.
         */
        this.installBackend = function(backend) {
            backends[backend.type] = backend;
            backend.install(ctx);
        };

        /** Obtains the backend module of the given type
         */
        this.getBackend = function(type) {
            var backend = backends[type];
            if (!backend) {
                throw new SceneJs.exceptions.NodeBackendNotFoundException("No backend installed of type \'' + type + '\'");
            }
            return backend;
        };

        /** Cleans up all resources currently held by backend modules
         */
        this.reset = function() {
            for (var type in backends) {
                var backend = backends[type];
                if (backend.reset) {
                    backend.reset();
                }
            }
        };
    })();
})();

SceneJs.utils.ns = SceneJs.utils.namespace; // in intellij using keyword "namespace" causes parsing errors
SceneJs.utils.ns("SceneJs");

