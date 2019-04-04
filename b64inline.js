//custom compressor
const through = require("through2");
const PluginError = require("plugin-error");
const Vinyl = require("vinyl");
const path = require("path");

const PLUGIN_NAME = "b64inliner";

const mimes = {
	json: { mime: "application/json" },
	atlas: { mime: "text/plain" },
	mp3: { mime: "audio/mpeg", encode: true },
	jpeg: { mime: "image/jpeg", encode: true },
	jpg: { mime: "image/jpeg", encode: true },
	png: { mime: "image/png", encode: true }
};

const normalize = input => {
	const isExtendedLengthPath = /^\\\\\?\\/.test(input);
	const hasNonAscii = /[^\u0000-\u0080]+/.test(input); // eslint-disable-line no-control-regex

	if (isExtendedLengthPath || hasNonAscii) {
		return input;
	}

	return input.replace(/\\/g, "/");
};

const escape = text => {
	return text
		.replace(/(\r\n|\n|\r)/gm, "\\n")
		.replace(/"/g, '\\"')
		.replace(/'/g, "\\'");
};
const def_map = (entries, options) => {
	let str = "";
	for (let name in entries) {
		const childs = entries[name] || {};
		const data = Object.keys(childs)
			.map(e => {
				let ret = `['${e}'] : {\n`;
				for (let key in childs[e]) {
					const format = childs[e][key];
					ret += `\t${key} : '${format}',\n`;
				}
				ret += "}";

				return ret;
			})
			.join(",\n");

		if(options.es6)
			str += `export ${name} {\n${data}}`;
		else 
			str += `const ${name} {\n${data}}`;
	}

	return str;
};

module.exports = function(
	options = { groupname: "default", filename: "out.js", mapper: def_map, map_options: { es6: true } }
) {
	const map_options = options.map_options || {};
	const mapper = options.mapper || def_map;
	const group = options.groupname || "default";
	const fname = options.filename || "out.js";
	const data_buffer = {};
	let latest;

	function collect(file, encoder, cb) {
		latest = file;
		let data = {};
		data.path = normalize(path.relative(file.base, file.path));
		data.name = normalize(file.basename);

		if (!data_buffer[group]) data_buffer[group] = {};

		if (data_buffer[group][data.path] || file.isNull()) {
			return cb();
		}

		const ext = file.basename.split(".")[1];
		const mime = mimes[ext];

		if (mime) {
			data.mime = mime.mime;

			if (file.isStream()) {
				this.emit("error", new PluginError(PLUGIN_NAME, "Streams not supported!"));
				return cb(null, file);
			}

			if (file.isBuffer()) {
				if (mime.encode) {
					data.data = `data:${mime.mime};base64,${file.contents.toString("base64")}`;
				} else {
					data.data = escape(new String(file.contents));
				}
			}

			data_buffer[group][data.path] = data;
		}

		return cb();
	}

	function write(cb) {
		if (latest.isNull()) {
			return cb();
		}

		const mapped_data = mapper(data_buffer, map_options);

		if (!data_buffer) {
			this.emit("error", new PluginError(PLUGIN_NAME, "Call caollect before write for collecting file dataset!"));
			return cb();
		}

		const file = latest.clone({ contents: false });
		file.path = path.join(file.base, fname);
		file.contents = Buffer.from(mapped_data);
		return cb(null, file);
	}

	return through.obj(collect, write);
};