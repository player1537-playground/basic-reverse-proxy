MKSHELL = $PLAN9/bin/rc

all:V:

install:V:
	sudo npm install -g .

chown:V:
	sudo chown thobson2:thobson2 index.js
