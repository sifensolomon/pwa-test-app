#!/usr/bin/bash
yarn quasar build
#rsync -a ./dist/spa/* -e 'ssh -p 2021' --progress --delete tyeng@192.168.100.89:~/.node-red/uibuilder/smartFarm/dist
#rsync -a ./dist/spa/* -e 'ssh -p 2040' --progress --delete tyeng@smartfarm.tyeng.com:/var/www/dist
#rsync -a ./dist/spa/* -e 'ssh -p 2021' --progress --delete tyeng@192.168.100.54:~/.node-red/uibuilder/smartFarm/dist
#rsync -a ./dist/spa/* -e 'ssh -p 2020' --progress tyeng@192.168.100.242:/var/www/sifen
