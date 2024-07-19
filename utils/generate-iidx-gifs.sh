#!/bin/bash
echo Input folder : $1
echo Output folder : $2
cd $1
for i in $(ls *.mp4)
do
    ffmpeg -hide_banner -loglevel error -i $i -vf scale=512:-1 -ss 00:01:00 -t 5 $2/$(echo $i | sed "s/.mp4/.gif/") > /dev/null
done