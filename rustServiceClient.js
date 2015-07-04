/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
/// <reference path="../declares.d.ts" />
'use strict';
define(["require", "exports", 'monaco', 'child_process', 'path', './features/configuration'],
    function (require, exports, monaco, cp, path, Configuration) {
        var RustServiceClient = (function () {
            function RustServiceClient(logger) {
                this.pathSeparator = path.sep;
                this.cfg = Configuration.defaultConfiguration;
                this.logger = logger;
            }
            RustServiceClient.prototype.setConfiguration = function (cfg) {
                this.cfg = cfg;
                this.logger.log('Racer Path="' + this.cfg.racerPath + "'");
            }
            RustServiceClient.prototype.asyncCtor = function () {
                return this.service();
            };
            RustServiceClient.prototype.asAbsolutePath = function (resource) {
                if (resource.scheme !== 'file') {
                    return null;
                }
                var result = resource.path;
                //var absolutePath = monaco.Paths.toAbsoluteFilePath(resource);
                // Both \ and / must be escaped in regular expressions
                return result ? result.replace(new RegExp('\\' + this.pathSeparator, 'g'), '/') : null;
            };
            RustServiceClient.prototype.asUrl = function (filepath) {
                return new monaco.URL(monaco.URI.file(filepath));
            };
            RustServiceClient.prototype.execute = function (args) {
                var _this = this;
                this.logger.log('Sending request ' + args + '.');
                var res = cp.execFileSync(this.cfg.racerPath, args);
                if (res.error !== undefined) {
                    this.logger.log('Error: ' + res.error);
                }
                var lines = res.toString().split('\n');
                var matches = new Array();
                var matchNames = new Array();
                var i = 0;
                lines.forEach(function (line) {
                    var firstSpace = line.indexOf(' ', 3);
                    var firstWord = line.substr(0, firstSpace);
                    if (firstWord === "MATCH") {
                        var parts = line.substr(firstSpace + 1).split(",");
                        var name = parts[0];
                        var rustKind = parts[4];
                        _this.logger.log("match: '" + name + "' racerKind=" + rustKind);
                        //racer sometime returns doublons...
                        if (matchNames.indexOf(name)<0) {
                            matches[i] = {
                                name: name,
                                kind: rustKind,
                                line: parseInt(parts[1]),
                                column: parseInt(parts[2]),
                                file: parts[3],
                                def: parts.slice(5).join(",")
                            };
                            matchNames.push(name);
                            i++;
                        }
                    }
                });
                return matches;
            };
            return RustServiceClient;
        })();
        return RustServiceClient;
    });
