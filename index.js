#!/usr/bin/env node

const argv = require('yargs')
	.default('u', [])
	.alias('u', 'upstream')
	.default('p', [])
	.alias('p', 'path')
	.default('b', '127.0.0.1:8888')
	.alias('b', 'bind')
	.argv;
const urlParser = require('fast-url-parser');
const httpProxy = require('http-proxy');
const http = require('http');

if (!Array.isArray(argv.upstream)) {
	argv.upstream = [argv.upstream];
}

if (!Array.isArray(argv.path)) {
	argv.path = [argv.path];
}

const upstreams = {};
argv.upstream.forEach((d) => {
	const [key, value] = d.split('=', 2);
	const hosts = value.split(',');

	upstreams[key] = hosts.map((h) => {
		return httpProxy.createProxyServer({
			target: h,
			ws: true,
		});
	});
});

const routes = [];
argv.path.forEach((d) => {
	// want to use rsplit, but can't
	const [path, upstream] = d.split('=', 2);
	
	routes.push({
		path,
		upstream,
	});
});

function getProxy(req) {
	const urlPath = urlParser.parse(req.url).pathname;
	
	const route = routes.find(({ path, upstream }) => {
		return urlPath.startsWith(path);
	});
	
	if (!route) return;
	
	const { upstream } = route;
	
	const proxies = upstreams[upstream];
	const proxy = proxies.shift();
	proxies.push(proxy);
	
	return proxy;
}

const [host, port] = argv.bind.split(':');

const server = http.createServer((req, res) => {
	const proxy = getProxy(req);
	
	if (!proxy) {
		res.statusCode = 404;
		res.end();
		return;
	}
	
	proxy.web(req, res, (err) => {
		console.log('web err', { url: urlParser.parse(req.url).pathname });
		if (err.code === 'ECONNRESET') {
			res.statusCode = 502;
			res.end();
		}
	});
});

server.on('upgrade', (req, socket, head) => {
	const proxy = getProxy(req);
	
	if (!proxy) {
		res.statusCode = 404;
		res.end();
		return;
	}
	
	proxy.ws(req, socket, head, (err) => {
		console.log('ws err', { url: urlParser.parse(req.url).pathname });
		if (err.code === 'ECONNRESET') {
			res.statusCode = 502;
			res.end();
		}
	});
});

server.listen({
	host,
	port: +port,
}, (error) => {
	if (error) {
		console.log('error', error);
		return;

	}

	console.log('Listening at http://%s:%d', host, +port);
});
