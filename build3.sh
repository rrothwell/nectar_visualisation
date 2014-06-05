#!/bin/bash

rm -Rf staging
mkdir -p staging/nectar_visualisation/static/js
mkdir -p staging/nectar_visualisation/static/css
mkdir -p staging/nectar_visualisation/static/img
mkdir -p staging/nectar_visualisation/data
cp web/static/js/allocations_pie.js staging/nectar_visualisation/static/js
cp web/static/js/d3.js staging/nectar_visualisation/static/js
cp web/static/css/langstroth.css staging/nectar_visualisation/static/css/langstroth.css
cp web/static/css/master-detail.css staging/nectar_visualisation/static/css/master-detail.css
cp web/static/img/logo.png staging/nectar_visualisation/static/img/logo.png
cp web/allocation_visualisation3.html staging/nectar_visualisation 
cp web/data/for_codes_final_2.json staging/nectar_visualisation/data
cp web/data/allocation_tree_final_2.json staging/nectar_visualisation/data
cd staging
tar -zcvf ../distribution/nectar_visualisation.tgz nectar_visualisation
cd ..
