#!/bin/bash

# Process allocations_pretty3.js so that it has the correct format 
# for the d3.js visualisation library.
# jrunscript works on MacOS X.

jrunscript -f preprocess_nectar_allocations.js > allocation_tree4.json 

cat allocation_tree4.json   |  python -mjson.tool > ../../web/data/allocation_tree_final_4.json
