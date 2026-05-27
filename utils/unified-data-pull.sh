#!/bin/sh
cd $(dirname "$0")
echo - Pulling latest Tachi seeds
cd ..
prroot=$PWD
cd ../Tachi
git pull
cd db/seeds
for item in "chunithm" "maimai" "jubeat" "popn" "sdvx"
    do
        cp charts-$item.json $prroot/data
        cp songs-$item.json $prroot/data
done
cp charts-iidx-sp.json $prroot/data
cp charts-iidx-dp.json $prroot/data
cp songs-iidx.json $prroot/data
echo - Pulling Zetaraku
cd $prroot
npm run fetch-data
echo - Done