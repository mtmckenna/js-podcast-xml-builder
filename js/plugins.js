
// usage: log('inside coolFunc', this, arguments);
// paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
window.log = function(){
  log.history = log.history || [];   // store logs to an array for reference
  log.history.push(arguments);
  if(this.console) {
    arguments.callee = arguments.callee.caller;
    var newarr = [].slice.call(arguments);
    (typeof console.log === 'object' ? log.apply.call(console.log, console, newarr) : console.log.apply(console, newarr));
  }
};

// make it safe to use console.log always
(function(b){function c(){}for(var d="assert,clear,count,debug,dir,dirxml,error,exception,firebug,group,groupCollapsed,groupEnd,info,log,memoryProfile,memoryProfileEnd,profile,profileEnd,table,time,timeEnd,timeStamp,trace,warn".split(","),a;a=d.pop();){b[a]=b[a]||c}})((function(){try
{console.log();return window.console;}catch(err){return window.console={};}})());


// place any jQuery/helper plugins in here, instead of separate, slower script files.

/* FileSaver.js
 * A saveAs() FileSaver implementation.
 * 2011-08-02
 * 
 * By Eli Grey, http://eligrey.com
 * License: X11/MIT
 *   See LICENSE.md
 */

/*global self */
/*jslint bitwise: true, regexp: true, confusion: true, es5: true, vars: true, white: true,
  plusplus: true */

/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */

var saveAs = saveAs || (function(view) {
	"use strict";
	var
		  doc = view.document
		  // only get URL when necessary in case BlobBuilder.js hasn't overridden it yet
		, get_URL = function() {
			return view.URL || view.webkitURL || view;
		}
		, URL = view.URL || view.webkitURL || view
		, save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
		, can_use_save_link = "download" in save_link
		, click = function(node) {
			var event = doc.createEvent("MouseEvents");
			event.initMouseEvent(
				"click", true, false, view, 0, 0, 0, 0, 0
				, false, false, false, false, 0, null
			);
			return node.dispatchEvent(event); // false if event was cancelled
		}
		, webkit_req_fs = view.webkitRequestFileSystem
		, req_fs = view.requestFileSystem || webkit_req_fs || view.mozRequestFileSystem
		, throw_outside = function (ex) {
			(view.setImmediate || view.setTimeout)(function() {
				throw ex;
			}, 0);
		}
		, force_saveable_type = "application/octet-stream"
		, fs_min_size = 0
		, deletion_queue = []
		, process_deletion_queue = function() {
			var i = deletion_queue.length;
			while (i--) {
				var file = deletion_queue[i];
				if (typeof file === "string") { // file is an object URL
					URL.revokeObjectURL(file);
				} else { // file is a File
					file.remove();
				}
			}
			deletion_queue.length = 0; // clear queue
		}
		, dispatch = function(filesaver, event_types, event) {
			event_types = [].concat(event_types);
			var i = event_types.length;
			while (i--) {
				var listener = filesaver["on" + event_types[i]];
				if (typeof listener === "function") {
					try {
						listener.call(filesaver, event || filesaver);
					} catch (ex) {
						throw_outside(ex);
					}
				}
			}
		}
		, FileSaver = function(blob, name) {
			// First try a.download, then web filesystem, then object URLs
			var
				  filesaver = this
				, type = blob.type
				, blob_changed = false
				, object_url
				, target_view
				, get_object_url = function() {
					var object_url = get_URL().createObjectURL(blob);
					deletion_queue.push(object_url);
					return object_url;
				}
				, dispatch_all = function() {
					dispatch(filesaver, "writestart progress write writeend".split(" "));
				}
				// on any filesys errors revert to saving with object URLs
				, fs_error = function() {
					// don't create more object URLs than needed
					if (blob_changed || !object_url) {
						object_url = get_object_url(blob);
					}
					target_view.location.href = object_url;
					filesaver.readyState = filesaver.DONE;
					dispatch_all();
				}
				, abortable = function(func) {
					return function() {
						if (filesaver.readyState !== filesaver.DONE) {
							return func.apply(this, arguments);
						}
					};
				}
				, create_if_not_found = {create: true, exclusive: false}
				, slice
			;
			filesaver.readyState = filesaver.INIT;
			if (!name) {
				name = "download";
			}
			if (can_use_save_link) {
				object_url = get_object_url(blob);
				save_link.href = object_url;
				save_link.download = name;
				if (click(save_link)) {
					filesaver.readyState = filesaver.DONE;
					dispatch_all();
					return;
				}
			}
			// Object and web filesystem URLs have a problem saving in Google Chrome when
			// viewed in a tab, so I force save with application/octet-stream
			// http://code.google.com/p/chromium/issues/detail?id=91158
			if (view.chrome && type && type !== force_saveable_type) {
				slice = blob.slice || blob.webkitSlice;
				blob = slice.call(blob, 0, blob.size, force_saveable_type);
				blob_changed = true;
			}
			// Since I can't be sure that the guessed media type will trigger a download
			// in WebKit, I append .download to the filename.
			// https://bugs.webkit.org/show_bug.cgi?id=65440
			if (webkit_req_fs && name !== "download") {
				name += ".download";
			}
			if (type === force_saveable_type || webkit_req_fs) {
				target_view = view;
			} else {
				target_view = view.open();
			}
			if (!req_fs) {
				fs_error();
				return;
			}
			fs_min_size += blob.size;
			req_fs(view.TEMPORARY, fs_min_size, abortable(function(fs) {
				fs.root.getDirectory("saved", create_if_not_found, abortable(function(dir) {
					var save = function() {
						dir.getFile(name, create_if_not_found, abortable(function(file) {
							file.createWriter(abortable(function(writer) {
								writer.onwriteend = function(event) {
									target_view.location.href = file.toURL();
									deletion_queue.push(file);
									filesaver.readyState = filesaver.DONE;
									dispatch(filesaver, "writeend", event);
								};
								writer.onerror = function() {
									var error = writer.error;
									if (error.code !== error.ABORT_ERR) {
										fs_error();
									}
								};
								"writestart progress write abort".split(" ").forEach(function(event) {
									writer["on" + event] = filesaver["on" + event];
								});
								writer.write(blob);
								filesaver.abort = function() {
									writer.abort();
									filesaver.readyState = filesaver.DONE;
								};
								filesaver.readyState = filesaver.WRITING;
							}), fs_error);
						}), fs_error);
					};
					dir.getFile(name, {create: false}, abortable(function(file) {
						// delete file if it already exists
						file.remove();
						save();
					}), abortable(function(ex) {
						if (ex.code === ex.NOT_FOUND_ERR) {
							save();
						} else {
							fs_error();
						}
					}));
				}), fs_error);
			}), fs_error);
		}
		, FS_proto = FileSaver.prototype
		, saveAs = function(blob, name) {
			return new FileSaver(blob, name);
		}
	;
	FS_proto.abort = function() {
		var filesaver = this;
		filesaver.readyState = filesaver.DONE;
		dispatch(filesaver, "abort");
	};
	FS_proto.readyState = FS_proto.INIT = 0;
	FS_proto.WRITING = 1;
	FS_proto.DONE = 2;
	
	FS_proto.error =
	FS_proto.onwritestart =
	FS_proto.onprogress =
	FS_proto.onwrite =
	FS_proto.onabort =
	FS_proto.onerror =
	FS_proto.onwriteend =
		null;
	
	view.addEventListener("unload", process_deletion_queue, false);
	return saveAs;
}(self));

/* BlobBuilder.js
 * A BlobBuilder implementation.
 * 2011-07-13
 * 
 * By Eli Grey, http://eligrey.com
 * License: X11/MIT
 *   See LICENSE.md
 */

/*global self, unescape */
/*jslint bitwise: true, regexp: true, confusion: true, es5: true, vars: true, white: true,
  plusplus: true */

/*! @source http://purl.eligrey.com/github/BlobBuilder.js/blob/master/BlobBuilder.js */

var BlobBuilder = BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || (function(view) {
"use strict";
var
	  get_class = function(object) {
		return Object.prototype.toString.call(object).match(/^\[object\s(.*)\]$/)[1];
	}
	, FakeBlobBuilder = function(){
		this.data = [];
	}
	, FakeBlob = function(data, type, encoding) {
		this.data = data;
		this.size = data.length;
		this.type = type;
		this.encoding = encoding;
	}
	, FBB_proto = FakeBlobBuilder.prototype
	, FB_proto = FakeBlob.prototype
	, FileReaderSync = view.FileReaderSync
	, FileException = function(type) {
		this.code = this[this.name = type];
	}
	, file_ex_codes = (
		  "NOT_FOUND_ERR SECURITY_ERR ABORT_ERR NOT_READABLE_ERR ENCODING_ERR "
		+ "NO_MODIFICATION_ALLOWED_ERR INVALID_STATE_ERR SYNTAX_ERR"
	).split(" ")
	, file_ex_code = file_ex_codes.length
	, realURL = view.URL || view.webkitURL || view
	, real_create_object_URL = realURL.createObjectURL
	, real_revoke_object_URL = realURL.revokeObjectURL
	, URL = realURL
	, btoa = view.btoa
	, atob = view.atob
	, can_apply_typed_arrays = false
	, can_apply_typed_arrays_test = function(pass) {
		can_apply_typed_arrays = !pass;
	}
	
	, ArrayBuffer = view.ArrayBuffer
	, Uint8Array = view.Uint8Array
;
FakeBlobBuilder.fake = FB_proto.fake = true;
while (file_ex_code--) {
	FileException.prototype[file_ex_codes[file_ex_code]] = file_ex_code + 1;
}
try {
	if (Uint8Array) {
		can_apply_typed_arrays_test.apply(0, new Uint8Array(1));
	}
} catch (ex) {}
if (!realURL.createObjectURL) {
	URL = view.URL = {};
}
URL.createObjectURL = function(blob) {
	var
		  type = blob.type
		, data_URI_header
	;
	if (type === null) {
		type = "application/octet-stream";
	}
	if (blob instanceof FakeBlob) {
		data_URI_header = "data:" + type;
		if (blob.encoding === "base64") {
			return data_URI_header + ";base64," + blob.data;
		} else if (blob.encoding === "URI") {
			return data_URI_header + "," + decodeURIComponent(blob.data);
		} if (btoa) {
			return data_URI_header + ";base64," + btoa(blob.data);
		} else {
			return data_URI_header + "," + encodeURIComponent(blob.data);
		}
	} else if (real_create_object_url) {
		return real_create_object_url.call(realURL, blob);
	}
};
URL.revokeObjectURL = function(object_url) {
	if (object_url.substring(0, 5) !== "data:" && real_revoke_object_url) {
		real_revoke_object_url.call(realURL, object_url);
	}
};
FBB_proto.append = function(data/*, endings*/) {
	var bb = this.data;
	// decode data to a binary string
	if (Uint8Array && data instanceof ArrayBuffer) {
		if (can_apply_typed_arrays) {
			bb.push(String.fromCharCode.apply(String, new Uint8Array(data)));
		} else {
			var
				  str = ""
				, buf = new Uint8Array(data)
				, i = 0
				, buf_len = buf.length
			;
			for (; i < buf_len; i++) {
				str += String.fromCharCode(buf[i]);
			}
		}
	} else if (get_class(data) === "Blob" || get_class(data) === "File") {
		if (FileReaderSync) {
			var fr = new FileReaderSync;
			bb.push(fr.readAsBinaryString(data));
		} else {
			// async FileReader won't work as BlobBuilder is sync
			throw new FileException("NOT_READABLE_ERR");
		}
	} else if (data instanceof FakeBlob) {
		if (data.encoding === "base64" && atob) {
			bb.push(atob(data.data));
		} else if (data.encoding === "URI") {
			bb.push(decodeURIComponent(data.data));
		} else if (data.encoding === "raw") {
			bb.push(data.data);
		}
	} else {
		if (typeof data !== "string") {
			data += ""; // convert unsupported types to strings
		}
		// decode UTF-16 to binary string
		bb.push(unescape(encodeURIComponent(data)));
	}
};
FBB_proto.getBlob = function(type) {
	if (!arguments.length) {
		type = null;
	}
	return new FakeBlob(this.data.join(""), type, "raw");
};
FBB_proto.toString = function() {
	return "[object BlobBuilder]";
};
FB_proto.slice = function(start, end, type) {
	var args = arguments.length;
	if (args < 3) {
		type = null;
	}
	return new FakeBlob(
		  this.data.slice(start, args > 1 ? end : this.data.length)
		, type
		, this.encoding
	);
};
FB_proto.toString = function() {
	return "[object Blob]";
};
return FakeBlobBuilder;
}(self));
