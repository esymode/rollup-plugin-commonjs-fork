// Copied from https://github.com/browserify/path-browserify/blob/master/index.js

function assertPath(path) {
	if (typeof path !== 'string') {
		throw new TypeError('Path must be a string. Received ' + JSON.stringify(path));
	}
}

function normalizeStringPosix(path, allowAboveRoot) {
	var res = '';
	var lastSegmentLength = 0;
	var lastSlash = -1;
	var dots = 0;
	var code;
	for (var i = 0; i <= path.length; ++i) {
		if (i < path.length) code = path.charCodeAt(i);
		else if (code === 47 /*/*/) break;
		else code = 47 /*/*/;
		if (code === 47 /*/*/) {
			if (lastSlash === i - 1 || dots === 1) {
				// NOOP
			} else if (lastSlash !== i - 1 && dots === 2) {
				if (
					res.length < 2 ||
					lastSegmentLength !== 2 ||
					res.charCodeAt(res.length - 1) !== 46 /*.*/ ||
					res.charCodeAt(res.length - 2) !== 46 /*.*/
				) {
					if (res.length > 2) {
						var lastSlashIndex = res.lastIndexOf('/');
						if (lastSlashIndex !== res.length - 1) {
							if (lastSlashIndex === -1) {
								res = '';
								lastSegmentLength = 0;
							} else {
								res = res.slice(0, lastSlashIndex);
								lastSegmentLength = res.length - 1 - res.lastIndexOf('/');
							}
							lastSlash = i;
							dots = 0;
							continue;
						}
					} else if (res.length === 2 || res.length === 1) {
						res = '';
						lastSegmentLength = 0;
						lastSlash = i;
						dots = 0;
						continue;
					}
				}
				if (allowAboveRoot) {
					if (res.length > 0) res += '/..';
					else res = '..';
					lastSegmentLength = 2;
				}
			} else {
				if (res.length > 0) res += '/' + path.slice(lastSlash + 1, i);
				else res = path.slice(lastSlash + 1, i);
				lastSegmentLength = i - lastSlash - 1;
			}
			lastSlash = i;
			dots = 0;
		} else if (code === 46 /*.*/ && dots !== -1) {
			++dots;
		} else {
			dots = -1;
		}
	}
	return res;
}

function basename(path, ext) {
	if (ext !== undefined && typeof ext !== 'string')
		throw new TypeError('"ext" argument must be a string');
	assertPath(path);

	var start = 0;
	var end = -1;
	var matchedSlash = true;
	var i;

	if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
		if (ext.length === path.length && ext === path) return '';
		var extIdx = ext.length - 1;
		var firstNonSlashEnd = -1;
		for (i = path.length - 1; i >= 0; --i) {
			var code = path.charCodeAt(i);
			if (code === 47 /*/*/) {
				// If we reached a path separator that was not part of a set of path
				// separators at the end of the string, stop now
				if (!matchedSlash) {
					start = i + 1;
					break;
				}
			} else {
				if (firstNonSlashEnd === -1) {
					// We saw the first non-path separator, remember this index in case
					// we need it if the extension ends up not matching
					matchedSlash = false;
					firstNonSlashEnd = i + 1;
				}
				if (extIdx >= 0) {
					// Try to match the explicit extension
					if (code === ext.charCodeAt(extIdx)) {
						if (--extIdx === -1) {
							// We matched the extension, so mark this as the end of our path
							// component
							end = i;
						}
					} else {
						// Extension does not match, so our result is the entire path
						// component
						extIdx = -1;
						end = firstNonSlashEnd;
					}
				}
			}
		}

		if (start === end) end = firstNonSlashEnd;
		else if (end === -1) end = path.length;
		return path.slice(start, end);
	} else {
		for (i = path.length - 1; i >= 0; --i) {
			if (path.charCodeAt(i) === 47 /*/*/) {
				// If we reached a path separator that was not part of a set of path
				// separators at the end of the string, stop now
				if (!matchedSlash) {
					start = i + 1;
					break;
				}
			} else if (end === -1) {
				// We saw the first non-path separator, mark this as the end of our
				// path component
				matchedSlash = false;
				end = i + 1;
			}
		}

		if (end === -1) return '';
		return path.slice(start, end);
	}
}

function extname(path) {
	assertPath(path);
	var startDot = -1;
	var startPart = 0;
	var end = -1;
	var matchedSlash = true;
	// Track the state of characters (if any) we see before our first dot and
	// after any path separator we find
	var preDotState = 0;
	for (var i = path.length - 1; i >= 0; --i) {
		var code = path.charCodeAt(i);
		if (code === 47 /*/*/) {
			// If we reached a path separator that was not part of a set of path
			// separators at the end of the string, stop now
			if (!matchedSlash) {
				startPart = i + 1;
				break;
			}
			continue;
		}
		if (end === -1) {
			// We saw the first non-path separator, mark this as the end of our
			// extension
			matchedSlash = false;
			end = i + 1;
		}
		if (code === 46 /*.*/) {
			// If this is our first dot, mark it as the start of our extension
			if (startDot === -1) startDot = i;
			else if (preDotState !== 1) preDotState = 1;
		} else if (startDot !== -1) {
			// We saw a non-dot and non-path separator before our dot, so we should
			// have a good chance at having a non-empty extension
			preDotState = -1;
		}
	}

	if (
		startDot === -1 ||
		end === -1 ||
		// We saw a non-dot character immediately before the dot
		preDotState === 0 ||
		// The (right-most) trimmed path component is exactly '..'
		(preDotState === 1 && startDot === end - 1 && startDot === startPart + 1)
	) {
		return '';
	}
	return path.slice(startDot, end);
}

function dirname(path) {
	assertPath(path);
	if (path.length === 0) return '.';
	var code = path.charCodeAt(0);
	var hasRoot = code === 47; /*/*/
	var end = -1;
	var matchedSlash = true;
	for (var i = path.length - 1; i >= 1; --i) {
		code = path.charCodeAt(i);
		if (code === 47 /*/*/) {
			if (!matchedSlash) {
				end = i;
				break;
			}
		} else {
			// We saw the first non-path separator
			matchedSlash = false;
		}
	}

	if (end === -1) return hasRoot ? '/' : '.';
	if (hasRoot && end === 1) return '//';
	return path.slice(0, end);
}

const sep = '/';

function normalize(path) {
	assertPath(path);

	if (path.length === 0) return '.';

	var isAbsolute = path.charCodeAt(0) === 47; /*/*/
	var trailingSeparator = path.charCodeAt(path.length - 1) === 47; /*/*/

	// Normalize the path
	path = normalizeStringPosix(path, !isAbsolute);

	if (path.length === 0 && !isAbsolute) path = '.';
	if (path.length > 0 && trailingSeparator) path += '/';

	if (isAbsolute) return '/' + path;
	return path;
}

export { basename, dirname, extname, sep, normalize };
