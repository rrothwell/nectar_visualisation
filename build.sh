rm -Rf staging
mkdir -p staging/nectar_visualisation/scripts
mkdir -p staging/nectar_visualisation/media
mkdir -p staging/nectar_visualisation/data
cp web/scripts/allocation_visualisation.js staging/nectar_visualisation/scripts
cp web/scripts/colorbrewer.js staging/nectar_visualisation/scripts
cp web/media/style.css staging/nectar_visualisation/media
cp web/allocation_visualisation2.html staging/nectar_visualisation 
cp web/data/for_codes_final_2.json staging/nectar_visualisation/data
cp web/data/allocation_tree_final_2.json staging/nectar_visualisation/data
cd staging
tar -zcvf ../distribution/nectar_visualisation.tgz nectar_visualisation
cd ..
