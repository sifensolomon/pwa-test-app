#!/usr/bin/bash
#sudo apt install inotify-tools
#while inotifywait -r /home/tyeng/.node-red/uibuilder/uibuilder/src/*; do
# while inotifywait /home/mikeyoon/uibuilder/controller/*; do
    # rsync -a ./dist/spa/* --progress --delete tyeng@192.168.100.54:/var/www/node-red/uibuilder/smartFarm/dist
    # rsync -a ./dist/spa/* -e 'ssh -p 2020' --progress --delete tyeng@192.168.100.54:~/.node-red/uibuilder/smartFarm/dist
    # rsync -a ./dist/spa/* -e 'ssh -p 2022' --progress --delete tyeng@192.168.100.54:~/.node-red/uibuilder/smartFarm/dist
    # rsync -a ./dist/spa/* -e 'ssh -p 2040' --progress --delete tyeng@smartfarm.tyeng.com:/var/www/dist/
    rsync -a ./dist/spa/* --progress --delete tyeng@192.168.100.98:/var/www/node-red/uibuilder/smartFarm/dist
    # rsync -a ./dist/spa/* -e 'ssh -p 2021' --progress --delete tyeng@192.168.100.53:~/.node-red/uibuilder/smartFarm/dist
# done
