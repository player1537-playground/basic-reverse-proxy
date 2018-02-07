# Basic Reverse Proxy

Proxy requests from one URL/host to one or more URLs/hosts based on the path
requested. Supports websockets in addition to other standard HTTP methods.


# Installation

To install into a local project, use:

```console
$ npm install --save github:player1537/basic-reverse-proxy
```

Or to install globally:

```console
$ sudo npm install -g github:player1537/basic-reverse-proxy
```


# Usage

The proxy operates on a set of upstreams and paths that correspond to that
upstream. Each upstream is associated with a name and one or more URLs, and
each path is associated with the name of an upstream. Finally, the URL/port
to bind to is specified:

```console
$ basic-reverse-proxy \
    -u api=http://127.0.0.1:8888,http://127.0.0.3:8888 \
    -u static=http://127.0.0.2:8888 \
    -p /api=api \
    -p /=static \
    -b 127.0.0.3:8888
```

One caveat to make note of is that the paths are just simple strings, without
any regular expressions or anything like that. Also, the paths are checked
in order, so if you map /foo to one service, and then /foo/bar to another,
then the second service will never get any URLs because the first one will
take them all. This could be fixed with a simple length-based heuristic,
but this method allows something like:

```console
$ basic-reverse-proxy \
    -u api1=http://127.0.0.1:8888 \
    -u api2=http://127.0.0.3:8888 \
    -u api=http://127.0.0.3:8888,http://127.0.0.1:8888 \
    -u static=http://127.0.0.2:8888 \
    -p /api/foo/bar=api1 \
    -p /api/foo=api2 \
    -p /api=api \
    -p /=static \
    -b 127.0.0.4:8888
```

This one will map `/api/foo/bar` to one host, `/api/foo` to another, or
`/api` to either of the two hosts.

