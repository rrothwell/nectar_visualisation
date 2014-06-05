#!/usr/bin/env groovy

import groovy.json.JsonOutput

System.in.withReader { println JsonOutput.prettyPrint(it.readLine()) }
